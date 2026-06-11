"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreMatch, scoreBonus, type BonusKind } from "@/lib/scoring";
import { computeLockAt, santiagoWallToUtc } from "@/lib/time";

type Result = { ok: true } | { error: string };

function fail(e: unknown): Result {
  return { error: e instanceof Error ? e.message : "Error desconocido." };
}

/** Recalcula el puntaje total de TODOS los jugadores (marcadores + bonos). */
async function recomputeAllTotals(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: preds }, { data: bonus }, { data: profiles }] =
    await Promise.all([
      admin.from("predictions").select("user_id, points"),
      admin.from("bonus_answers").select("user_id, points"),
      admin.from("profiles").select("id"),
    ]);

  const totals = new Map<string, number>();
  for (const p of profiles ?? []) totals.set(p.id, 0);
  for (const p of preds ?? [])
    totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + (p.points ?? 0));
  for (const b of bonus ?? [])
    totals.set(b.user_id, (totals.get(b.user_id) ?? 0) + (b.points ?? 0));

  await Promise.all(
    [...totals.entries()].map(([id, total]) =>
      admin.from("profiles").update({ points_total: total }).eq("id", id)
    )
  );
}

// ----------------------------- PARTIDOS -----------------------------

/** Crea un partido. kickoffLocal viene de un <input datetime-local> (hora Chile). */
export async function createMatch(formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const phase = String(formData.get("phase") || "grupos");
    const home = String(formData.get("home_team") || "").trim();
    const away = String(formData.get("away_team") || "").trim();
    const kickoffLocal = String(formData.get("kickoff") || ""); // "2026-06-19T16:00"
    if (!home || !away || !kickoffLocal)
      return { error: "Faltan datos del partido." };

    const [datePart, timePart] = kickoffLocal.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, mi] = timePart.split(":").map(Number);
    const kickoffUtc = santiagoWallToUtc(y, mo, d, h, mi);
    const lockUtc = computeLockAt(kickoffUtc);

    const admin = createAdminClient();
    const { error } = await admin.from("matches").insert({
      phase,
      home_team: home,
      away_team: away,
      kickoff_at: kickoffUtc.toISOString(),
      lock_at: lockUtc.toISOString(),
      status: "oculto",
    });
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/partidos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setMatchStatus(
  matchId: number,
  status: "oculto" | "abierto" | "finalizado"
): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from("matches")
      .update({ status })
      .eq("id", matchId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/partidos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMatch(matchId: number): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("matches").delete().eq("id", matchId);
    if (error) return { error: error.message };
    await recomputeAllTotals(admin);
    revalidatePath("/admin");
    revalidatePath("/partidos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Carga el resultado oficial y recalcula los puntos de todos los pronósticos del partido. */
export async function saveMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<Result> {
  try {
    await requireAdmin();
    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    )
      return { error: "Resultado inválido." };

    const admin = createAdminClient();
    const { error: upErr } = await admin
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finalizado",
      })
      .eq("id", matchId);
    if (upErr) return { error: upErr.message };

    const { data: preds } = await admin
      .from("predictions")
      .select("id, home_score, away_score")
      .eq("match_id", matchId);

    await Promise.all(
      (preds ?? []).map((p) =>
        admin
          .from("predictions")
          .update({
            points: scoreMatch(
              p.home_score,
              p.away_score,
              homeScore,
              awayScore
            ),
          })
          .eq("id", p.id)
      )
    );

    await recomputeAllTotals(admin);
    revalidatePath("/admin");
    revalidatePath("/partidos");
    revalidatePath("/tabla");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------- SELECCIONES -----------------------------

export async function addTeam(formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "").trim().toUpperCase();
    const name = String(formData.get("name") || "").trim();
    const group = String(formData.get("group_label") || "").trim().toUpperCase();
    if (!id || !name) return { error: "Faltan datos de la selección." };

    const admin = createAdminClient();
    const { error } = await admin
      .from("teams")
      .upsert({ id, name, group_label: group || null });
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/bonos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTeam(id: string): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("teams").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/bonos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------- BONOS -----------------------------

/** Carga la respuesta oficial de un bono y recalcula los puntos de todos. */
export async function saveBonusOfficial(
  questionId: string,
  official: unknown
): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: q } = await admin
      .from("bonus_questions")
      .select("kind, max_points")
      .eq("id", questionId)
      .single();
    if (!q) return { error: "Bono no encontrado." };

    const { error: upErr } = await admin
      .from("bonus_questions")
      .update({ official_answer: official })
      .eq("id", questionId);
    if (upErr) return { error: upErr.message };

    const { data: answers } = await admin
      .from("bonus_answers")
      .select("id, answer")
      .eq("question_id", questionId);

    await Promise.all(
      (answers ?? []).map((a) =>
        admin
          .from("bonus_answers")
          .update({
            points: scoreBonus(
              q.kind as BonusKind,
              q.max_points,
              official,
              a.answer
            ),
          })
          .eq("id", a.id)
      )
    );

    await recomputeAllTotals(admin);
    revalidatePath("/admin");
    revalidatePath("/bonos");
    revalidatePath("/tabla");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------- JUGADORES -----------------------------

export async function setPaid(userId: string, paid: boolean): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ paid })
      .eq("id", userId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/tabla");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setAdmin(
  userId: string,
  isAdmin: boolean
): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
