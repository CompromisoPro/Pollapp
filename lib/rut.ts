// Normaliza un RUT chileno para comparar sin importar puntos/guion/mayúsculas.
// Ej: "19.307.486-3", "19307486-3", "193074863" -> "193074863"
export function normalizeRut(rut: string): string {
  return String(rut ?? "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}
