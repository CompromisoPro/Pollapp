// Utilidades de fecha/hora ancladas a la hora oficial de Santiago de Chile.
// Maneja automáticamente el cambio de horario (UTC-4 invierno / UTC-3 verano).

export const TIMEZONE = "America/Santiago";

/** Convierte una hora "de pared" de Santiago (año, mes 1-12, día, hora, min) al instante UTC correspondiente. */
export function santiagoWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcGuess));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second)
  );
  const offset = asUTC - utcGuess; // cuánto va adelantada Santiago respecto a UTC
  return new Date(utcGuess - offset);
}

/** Devuelve {year, month, day} del día calendario en Santiago para un instante dado. */
export function santiagoDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = dtf.format(date).split("-").map(Number);
  return { year, month, day };
}

/**
 * Cierre de pronósticos para un partido: 23:59 (hora Chile) del día ANTERIOR
 * a la fecha del partido (también en hora Chile). Devuelve el instante UTC.
 */
export function computeLockAt(kickoffUtc: Date): Date {
  const { year, month, day } = santiagoDateParts(kickoffUtc);
  // Restar un día de forma segura usando UTC sobre la fecha calendario.
  const prev = new Date(Date.UTC(year, month - 1, day));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return santiagoWallToUtc(
    prev.getUTCFullYear(),
    prev.getUTCMonth() + 1,
    prev.getUTCDate(),
    23,
    59
  );
}

/** Formatea un instante en hora de Chile, ej "jue 19 jun, 16:00". */
export function formatCl(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", { timeZone: TIMEZONE, ...opts }).format(
    d
  );
}
