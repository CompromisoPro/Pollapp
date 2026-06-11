"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Guarda (o actualiza) el pronóstico de marcador del usuario para un partido.
 * La base de datos (RLS) impide guardar si el partido no está abierto o si ya
 * pasó la hora de cierre, así que no se puede hacer trampa desde el navegador.
 */
export async function savePrediction(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<{ ok: true } | { error: string }> {
  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    homeScore > 99 ||
    awayScore > 99
  ) {
    return { error: "Marcador inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    // Mensaje amigable si fue bloqueado por la regla de cierre.
    return {
      error:
        "No se pudo guardar. Puede que el partido ya esté cerrado (pasó el plazo).",
    };
  }

  revalidatePath("/partidos");
  return { ok: true };
}
