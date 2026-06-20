"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreMatch, scoreBonus, type BonusKind } from "@/lib/scoring";
import { computeLockAt, santiagoWallToUtc } from "@/lib/time";
import { computeStandings, type MatchResult } from "@/lib/standings";
import { canonicalRut } from "@/lib/rut";

type Result = { ok: true } | { error: string };

function fail(e: unknown): Result {
  return { error: e instanceof Error ? e.message : "Error desconocido." };
}

// El total de cada jugador (profiles.points_total) lo mantiene la BASE con un
// trigger (supabase/points_total_trigger.sql): cada cambio de puntos en
// predictions/bonus_answers recalcula el total del jugador de forma atómica.
// Antes esto lo hacía un recomputeAllTotals en la app que, al leer datos recién
// escritos desde una réplica con retraso, podía pisar el valor correcto con uno
// viejo (la tabla mostraba MENOS puntos que los reales). Por eso ya no existe.

/**
 * Si todos los partidos de un grupo están finalizados, calcula la tabla y
 * fija automáticamente los 2 clasificados como respuesta oficial del bono
 * `grupo_X`, calificando las respuestas de los jugadores. NO sobrescribe si el
 * admin ya cargó una respuesta oficial a mano (override manual).
 */
async function autoGradeGroupIfComplete(
  admin: ReturnType<typeof createAdminClient>,
  group: string
) {
  const [{ data: teams }, { data: gm }, { data: q }] = await Promise.all([
    admin.from("teams").select("id, name").eq("group_label", group),
    admin
      .from("matches")
      .select("home_team, away_team, home_score, away_score, status")
      .eq("phase", "grupos")
      .eq("group_label", group),
    admin
      .from("bonus_questions")
      .select("id, official_answer, max_points")
      .eq("id", `grupo_${group}`)
      .maybeSingle(),
  ]);

  if (!q || q.official_answer != null) return; // no existe el bono o ya está definido
  const all = gm ?? [];
  if (all.length === 0 || all.some((x) => x.status !== "finalizado")) return; // grupo incompleto

  const finished: MatchResult[] = all
    .filter((x) => x.home_score != null && x.away_score != null)
    .map((x) => ({
      home_team: x.home_team,
      away_team: x.away_team,
      home_score: x.home_score as number,
      away_score: x.away_score as number,
    }));

  const names = (teams ?? []).map((t) => t.name);
  const standings = computeStandings(names, finished);
  const nameToId = new Map((teams ?? []).map((t) => [t.name, t.id]));
  const top2 = standings
    .slice(0, 2)
    .map((s) => nameToId.get(s.team))
    .filter((x): x is string => Boolean(x));
  if (top2.length < 2) return;

  await admin
    .from("bonus_questions")
    .update({ official_answer: top2 })
    .eq("id", q.id);

  const { data: answers } = await admin
    .from("bonus_answers")
    .select("id, answer")
    .eq("question_id", q.id);

  await Promise.all(
    (answers ?? []).map((a) =>
      admin
        .from("bonus_answers")
        .update({
          points: scoreBonus("qualifiers", q.max_points, top2, a.answer),
        })
        .eq("id", a.id)
    )
  );
}

// ----------------------------- PARTIDOS -----------------------------

/** Crea un partido. kickoffLocal viene de un <input datetime-local> (hora Chile). */
export async function createMatch(formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const phase = String(formData.get("phase") || "grupos");
    const groupLabel =
      String(formData.get("group_label") || "").trim().toUpperCase() || null;
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
      group_label: groupLabel,
      home_team: home,
      away_team: away,
      kickoff_at: kickoffUtc.toISOString(),
      lock_at: lockUtc.toISOString(),
      status: "oculto",
    });
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/apuestas");
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
    revalidatePath("/apuestas");
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
    revalidatePath("/admin");
    revalidatePath("/apuestas");
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

    // Si es de fase de grupos y el grupo quedó completo, auto-calificar el bono.
    const { data: m } = await admin
      .from("matches")
      .select("phase, group_label")
      .eq("id", matchId)
      .single();
    if (m?.phase === "grupos" && m.group_label) {
      await autoGradeGroupIfComplete(admin, m.group_label);
    }
    revalidatePath("/admin");
    revalidatePath("/apuestas");
    revalidatePath("/resultados");
    revalidatePath("/mundial/grupos");
    revalidatePath("/apuestas/bonos");
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
    revalidatePath("/apuestas/bonos");
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
    revalidatePath("/apuestas/bonos");
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
    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Abre u oculta un bono para los jugadores. */
export async function setBonusStatus(
  questionId: string,
  status: "oculto" | "abierto"
): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from("bonus_questions")
      .update({ status })
      .eq("id", questionId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------- JUGADORES -----------------------------

/**
 * Califica MANUALMENTE una respuesta de bono (acertó = max_points, no = 0).
 * Pensado para los bonos de texto libre (goleador, arquero, mejor jugador),
 * donde el sistema no puede comparar automáticamente por la variación de nombres.
 */
export async function gradeBonusAnswer(
  answerId: number,
  correct: boolean
): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: ans } = await admin
      .from("bonus_answers")
      .select("question_id")
      .eq("id", answerId)
      .single();
    if (!ans) return { error: "Respuesta no encontrada." };

    const { data: q } = await admin
      .from("bonus_questions")
      .select("max_points")
      .eq("id", ans.question_id)
      .single();

    const pts = correct ? q?.max_points ?? 0 : 0;
    const { error } = await admin
      .from("bonus_answers")
      .update({ points: pts })
      .eq("id", answerId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

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
    revalidatePath("/resultados");
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

/**
 * Resuelve la contraseña a partir del campo "RUT / contraseña":
 *  - si parece un RUT (canónico de 7+ chars) -> usa el RUT canónico
 *  - si no, lo usa tal cual como contraseña personalizada (mín. 6 chars)
 *  - si es muy corto -> null (el llamador avisa el error, no lo ignora)
 */
function resolvePassword(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const canon = canonicalRut(v);
  if (canon.length >= 7) return canon; // parece un RUT real
  if (v.length >= 6) return v; // contraseña personalizada (ej. Bruno)
  return null;
}

/**
 * Crea un participante nuevo: usuario de auth (correo confirmado, sin enviar
 * email) con contraseña = su RUT (o una clave personalizada), y completa su
 * perfil (nombre + RUT).
 */
export async function createPlayer(formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const rut = String(formData.get("rut") || "").trim();
    if (!name || !email || !rut)
      return { error: "Completa nombre, correo y RUT/contraseña." };
    const pass = resolvePassword(rut);
    if (!pass)
      return { error: "El RUT/contraseña es muy corto (mínimo 6 caracteres)." };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) return { error: error.message };

    // El trigger crea el perfil; completamos nombre y RUT.
    await admin
      .from("profiles")
      .update({ full_name: name, rut })
      .eq("id", data.user.id);

    revalidatePath("/admin");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Edita un participante (nombre, correo y/o RUT). Si cambia el RUT, su
 * contraseña pasa a ser el RUT nuevo (regla de la polla).
 */
export async function updatePlayer(
  userId: string,
  fields: { full_name: string; email: string; rut: string }
): Promise<Result> {
  try {
    await requireAdmin();
    const name = fields.full_name.trim();
    const email = fields.email.trim().toLowerCase();
    const rut = fields.rut.trim();
    if (!name || !email) return { error: "Nombre y correo son obligatorios." };

    const admin = createAdminClient();

    // Auth: correo y (si se ingresó RUT/contraseña) la nueva clave.
    const authUpdate: { email: string; password?: string } = { email };
    if (rut) {
      const pass = resolvePassword(rut);
      if (!pass)
        return {
          error: "El RUT/contraseña es muy corto (mínimo 6 caracteres).",
        };
      authUpdate.password = pass;
    }
    const { error: authErr } = await admin.auth.admin.updateUserById(
      userId,
      authUpdate
    );
    if (authErr) return { error: authErr.message };

    const { error } = await admin
      .from("profiles")
      .update({ full_name: name, email, rut: rut || null })
      .eq("id", userId);
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------- MANTENEDOR DE BONOS -----------------------------

function slugify(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/** Crea un bono nuevo. Nace OCULTO; el admin lo abre cuando corresponda. */
export async function createBonus(formData: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const title = String(formData.get("title") || "").trim();
    const kind = String(formData.get("kind") || "number");
    const phase = String(formData.get("phase") || "especial");
    const description = String(formData.get("description") || "").trim();
    const groupLabel =
      String(formData.get("group_label") || "").trim().toUpperCase() || null;
    const maxPoints = parseInt(String(formData.get("max_points") || ""), 10);
    const deadlineLocal = String(formData.get("deadline") || ""); // datetime-local (hora Chile)

    if (!title || !deadlineLocal || Number.isNaN(maxPoints))
      return { error: "Completa título, puntos y fecha de cierre." };
    if (kind === "qualifiers" && !groupLabel)
      return { error: "Los bonos de clasificados necesitan el grupo (A-L)." };

    const [datePart, timePart] = deadlineLocal.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, mi] = timePart.split(":").map(Number);
    const deadline = santiagoWallToUtc(y, mo, d, h, mi);

    const admin = createAdminClient();
    const { error } = await admin.from("bonus_questions").insert({
      id: slugify(title) || `bono_${Date.now()}`,
      title,
      kind,
      phase,
      description: description || null,
      group_label: groupLabel,
      max_points: maxPoints,
      deadline: deadline.toISOString(),
      status: "oculto",
      sort: 100,
    });
    if (error)
      return {
        error: error.code === "23505"
          ? "Ya existe un bono con un título muy parecido. Cambia el título."
          : error.message,
      };

    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Edita título, descripción, puntos y/o cierre de un bono. */
export async function updateBonus(
  questionId: string,
  fields: {
    title: string;
    description: string;
    max_points: number;
    deadlineLocal?: string; // datetime-local hora Chile; vacío = no cambiar
  }
): Promise<Result> {
  try {
    await requireAdmin();
    if (!fields.title.trim() || Number.isNaN(fields.max_points))
      return { error: "Título y puntos son obligatorios." };

    const patch: Record<string, unknown> = {
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      max_points: fields.max_points,
    };
    if (fields.deadlineLocal) {
      const [datePart, timePart] = fields.deadlineLocal.split("T");
      const [y, mo, d] = datePart.split("-").map(Number);
      const [h, mi] = timePart.split(":").map(Number);
      patch.deadline = santiagoWallToUtc(y, mo, d, h, mi).toISOString();
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("bonus_questions")
      .update(patch)
      .eq("id", questionId);
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Borra un bono y sus respuestas; recalcula los totales. */
export async function deleteBonus(questionId: string): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from("bonus_questions")
      .delete()
      .eq("id", questionId);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/apuestas/bonos");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
