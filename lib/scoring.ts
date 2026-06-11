// Lógica de puntaje de la Polla Mundialera 2026.
// Todo el cálculo vive acá para tener una sola fuente de verdad.

/**
 * Puntaje de un pronóstico de marcador contra el resultado oficial (90' + adición).
 *   - Marcador exacto ............... 3 puntos
 *   - Diferencia de goles / empate no exacto (mismo margen y ganador) ... 2 puntos
 *   - Solo el equipo ganador ......... 1 punto
 *   - Cualquier otra cosa ............ 0 puntos
 */
export function scoreMatch(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): number {
  if (predHome === realHome && predAway === realAway) return 3;

  const predDiff = predHome - predAway;
  const realDiff = realHome - realAway;
  // Mismo diferencial firmado cubre "mismo margen y ganador" y "empate no exacto".
  if (predDiff === realDiff) return 2;

  // Mismo ganador (o ambos empate, ya descartado arriba).
  if (Math.sign(predDiff) === Math.sign(realDiff)) return 1;

  return 0;
}

export type BonusKind =
  | "number"
  | "team"
  | "player"
  | "finalists"
  | "qualifiers";

/**
 * Puntaje de un bono según su tipo.
 * @param official respuesta oficial cargada por el admin (jsonb)
 * @param answer   respuesta del usuario (jsonb)
 */
export function scoreBonus(
  kind: BonusKind,
  maxPoints: number,
  official: unknown,
  answer: unknown
): number {
  if (official === null || official === undefined) return 0;

  switch (kind) {
    case "number":
      return Number(answer) === Number(official) ? maxPoints : 0;

    case "team":
      return String(answer) === String(official) ? maxPoints : 0;

    case "player": {
      // Oficial puede ser un valor o una lista de respuestas aceptadas.
      const set = (Array.isArray(official) ? official : [official]).map((x) =>
        normalize(x)
      );
      return set.includes(normalize(answer)) ? maxPoints : 0;
    }

    case "finalists": {
      const o = asStringArray(official);
      const a = asStringArray(answer);
      const hits = a.filter((x) => o.includes(x)).length;
      if (hits >= 2) return 6;
      if (hits === 1) return 3;
      return 0;
    }

    case "qualifiers": {
      // 1 punto por cada selección acertada (tope = maxPoints).
      const o = asStringArray(official);
      const a = asStringArray(answer);
      const hits = a.filter((x) => o.includes(x)).length;
      return Math.min(hits, maxPoints);
    }

    default:
      return 0;
  }
}

function normalize(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => normalize(x));
  if (v === null || v === undefined || v === "") return [];
  return [normalize(v)];
}
