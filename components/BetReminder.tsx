"use client";

import { useEffect, useState } from "react";
import type { MatchWithPrediction } from "@/lib/types";

/**
 * Alerta arriba de la lista de apuestas: si al usuario le faltan partidos por
 * apostar en el día abierto, le recuerda con un countdown al cierre más próximo
 * de los que aún le faltan. Tick de 1s (countdown HH:MM:SS), solo en cliente.
 * Se auto-oculta cuando completa todo o cuando ya no queda plazo.
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

  // Partidos que le faltan y cuyo plazo sigue vigente.
  const pending = matches.filter(
    (m) => !m.prediction && new Date(m.lock_at).getTime() > nowMs
  );
  if (pending.length === 0) return null;

  // Cierre más próximo entre los pendientes (el plazo real más urgente).
  const nextLock = Math.min(
    ...pending.map((m) => new Date(m.lock_at).getTime())
  );
  const remaining = nextLock - nowMs;
  if (remaining <= 0) return null;

  const n = pending.length;

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm font-semibold text-amber-900">
        Recuerda ingresar tus apuestas: te {n === 1 ? "falta" : "faltan"}{" "}
        <strong>
          {n} {n === 1 ? "partido" : "partidos"}
        </strong>
        .
      </p>
      <p className="text-sm text-amber-800">
        Cierra en{" "}
        <strong className="tabular-nums">{formatCountdown(remaining)}</strong>
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
