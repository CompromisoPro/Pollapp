"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Guarda (o actualiza) la respuesta de un bono. La RLS impide guardar si ya
 * pasó el deadline del bono.
 */
export async function saveBonusAnswer(
  questionId: string,
  answer: unknown
): Promise<{ ok: true } | { error: string }> {
  // Validación básica: respuesta no vacía.
  const empty =
    answer === null ||
    answer === undefined ||
    answer === "" ||
    (Array.isArray(answer) && answer.filter((x) => x !== "" && x != null).length === 0);
  if (empty) return { error: "Completa tu respuesta." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const { error } = await supabase.from("bonus_answers").upsert(
    {
      user_id: user.id,
      question_id: questionId,
      answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" }
  );

  if (error) {
    return {
      error: "No se pudo guardar. Puede que ya haya cerrado el plazo de este bono.",
    };
  }

  revalidatePath("/bonos");
  return { ok: true };
}
