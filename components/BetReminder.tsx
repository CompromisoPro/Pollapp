"use client";

import { useEffect, useState } from "react";
import type { MatchWithPrediction } from "@/lib/types";

/**
 * Aviso arriba de la lista de apuestas, con countdown al cierre más próximo.
 * Dos niveles según el estado del usuario en el día abierto:
 *   - Faltan apuestas  -> aviso crítico (amber): "te faltan N partidos".
 *   - Ya apostó todo    -> aviso suave (gris): aún puede cambiar marcadores.
 * Tick de 1s (HH:MM:SS), solo en cliente. Desaparece cuando ya no queda plazo.
 */
export default function BetReminder({
  matches,
}: {
  /** Partidos del día apostable (mode "bet"). */
  matches: MatchWithPrediction[];
}) {
  // "Ahora" propio con resolución de 1s. En SSR queda en 0 para no romper la
  // hidratación; el primer tick post-montaje fija la hora real.
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    // Sincroniza con el reloj real (sistema externo) y tickea cada 1s. El set
    // inicial es la primera sincronización tras montar, no un derivado de props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Antes del primer tick no sabemos la hora: no mostramos nada (evita flash).
  if (nowMs === 0) return null;

  // Partidos del día cuyo plazo sigue vigente (se pueden ingresar o editar).
  const open = matches.filter((m) => new Date(m.lock_at).getTime() > nowMs);
  if (open.length === 0) return null;

  // Cierre más próximo entre los abiertos (el plazo real más urgente).
  const nextLock = Math.min(...open.map((m) => new Date(m.lock_at).getTime()));
  const remaining = nextLock - nowMs;
  if (remaining <= 0) return null;

  // ¿Cuántos de los abiertos aún no tienen apuesta?
  const missing = open.filter((m) => !m.prediction).length;
  const countdown = formatCountdown(remaining);

  // Crítica: le faltan apuestas. Suave: ya apostó todo pero aún puede cambiar.
  if (missing > 0) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
      >
        <p className="text-sm font-semibold text-amber-900">
          Recuerda ingresar tus apuestas: te {missing === 1 ? "falta" : "faltan"}{" "}
          <strong>
            {missing} {missing === 1 ? "partido" : "partidos"}
          </strong>
          .
        </p>
        <p className="text-sm text-amber-800">
          Cierra en <strong className="tabular-nums">{countdown}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
      <p className="text-sm text-gray-600">
        Ya apostaste todo. Puedes cambiar tus marcadores hasta que cierre.
      </p>
      <p className="text-sm text-gray-500">
        Cierra en <strong className="tabular-nums">{countdown}</strong>
      </p>
    </div>
  );
}

/** ms -> "HH:MM:SS" (sin días: el plazo siempre cierra el mismo día). */
function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
