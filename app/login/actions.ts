"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRut } from "@/lib/rut";

/**
 * "¿Olvidaste tu correo?" — devuelve el correo registrado a partir del RUT.
 * Pensado para un grupo cerrado (el RUT no es secreto, así que esto expone el
 * correo a quien tenga el RUT; aceptable entre gente conocida).
 */
export async function buscarCorreoPorRut(
  rut: string
): Promise<{ email: string } | { error: string }> {
  const norm = normalizeRut(rut);
  if (norm.length < 7) {
    return { error: "Escribe tu RUT completo, con dígito verificador." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("rut, email")
    .not("rut", "is", null);

  const match = (data ?? []).find(
    (p) => normalizeRut(p.rut as string) === norm
  );

  if (!match || !match.email) {
    return { error: "No encontramos ese RUT. Avísale al organizador." };
  }
  return { email: match.email as string };
}
