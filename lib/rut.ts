// Normaliza un RUT chileno para comparar sin importar puntos/guion/mayúsculas.
// Ej: "19.307.486-3", "19307486-3", "193074863" -> "193074863"
export function normalizeRut(rut: string): string {
  return String(rut ?? "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

// Formato canónico "cuerpo-DV" (guion antes del dígito verificador, K en mayúscula).
// Ej: "19.307.486-3" -> "19307486-3" ; "6674048-k" -> "6674048-K"
// Se usa como CONTRASEÑA de cada jugador (su propio RUT).
export function canonicalRut(rut: string): string {
  const clean = normalizeRut(rut);
  if (clean.length < 2) return clean;
  return clean.slice(0, -1) + "-" + clean.slice(-1);
}
