"use client";

import { useState, useEffect, useMemo } from "react";
import MatchCard from "@/components/MatchCard";
import BetReminder from "@/components/BetReminder";
import type { MatchWithPrediction } from "@/lib/types";

export interface ApuestaDay {
  key: string;
  label: string; // ej. "sáb 13 jun"
  mode: "bet" | "live";
  matches: MatchWithPrediction[];
}

export default function ApuestasCarousel({
  days,
  charts,
}: {
  days: ApuestaDay[];
  charts: Record<number, { home: number; away: number }[]>;
}) {
  // Índice key -> día, para no re-escanear el array en cada render.
  const byKey = useMemo(() => {
    const m = new Map<string, ApuestaDay>();
    for (const d of days) m.set(d.key, d);
    return m;
  }, [days]);

  // Por defecto seleccionamos el día apostable (lo accionable); si no hay,
  // mostramos el que esté en juego.
  const [sel, setSel] = useState(
    () => (days.find((d) => d.mode === "bet") ?? days[0]).key
  );

  // Recordar el día elegido entre navegaciones (sessionStorage), pero solo si
  // ese día SIGUE siendo apostable. Si ya cerró (pasó a 'live'), no lo
  // restauramos: dejamos el default, que es el primer día apostable.
  // Se lee tras montar (SSR no conoce sessionStorage), por eso el setState aquí.
  useEffect(() => {
    const saved = sessionStorage.getItem("apuestas-dia");
    if (saved && days.some((d) => d.key === saved && d.mode === "bet")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSel(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function pick(key: string) {
    setSel(key);
    sessionStorage.setItem("apuestas-dia", key);
  }

  const active = byKey.get(sel) ?? days[0];

  return (
    <div>
      {/* Recordatorio: si el día activo es apostable y faltan partidos. */}
      {active.mode === "bet" && <BetReminder matches={active.matches} />}

      {/* Carrusel de pills de fechas */}
      <div
        role="tablist"
        aria-label="Días de partidos"
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4"
      >
        {days.map((d) => {
          const on = d.key === sel;
          const live = d.mode === "live";
          return (
            <button
              key={d.key}
              role="tab"
              aria-selected={on}
              onClick={() => pick(d.key)}
              className={`shrink-0 min-h-[44px] rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                on
                  ? "grad-brand text-white shadow-sm font-bold"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 font-semibold"
              }`}
            >
              <span className="capitalize">{d.label}</span>
              {on ? (
                // La pill activa ya comunica por el gradiente: basta el dot del modo.
                <span aria-hidden className="ml-1.5">
                  {live ? "🔴" : "🎯"}
                </span>
              ) : (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    live ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"
                  }`}
                >
                  {live ? "🔴 en juego" : "🎯 apostar"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido del día seleccionado. Una sola card (MatchCard) cubre todo
          el ciclo: apostar, en juego (con apuestas del grupo) y finalizado. */}
      <div role="tabpanel" className="space-y-3">
        {active.mode === "live" && (
          <p className="text-xs text-gray-500">
            Estos partidos ya cerraron. Mira cómo apostó todo el mundo 👀
          </p>
        )}
        {active.matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            bets={active.mode === "live" ? charts[m.id] ?? [] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
