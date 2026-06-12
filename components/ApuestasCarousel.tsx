"use client";

import { useState } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import BetChart from "@/components/BetChart";
import { Flag } from "@/components/Flag";
import { formatCl } from "@/lib/time";
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
  // Por defecto seleccionamos el día apostable (lo accionable); si no hay,
  // mostramos el que esté en juego.
  const [sel, setSel] = useState(
    () => (days.find((d) => d.mode === "bet") ?? days[0]).key
  );
  const active = days.find((d) => d.key === sel) ?? days[0];

  return (
    <div>
      {/* Carrusel de pills de fechas */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
        {days.map((d) => {
          const on = d.key === sel;
          const live = d.mode === "live";
          return (
            <button
              key={d.key}
              onClick={() => setSel(d.key)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-bold border transition-colors ${
                on
                  ? "grad-brand text-white border-transparent shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="capitalize">{d.label}</span>
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                  on
                    ? "bg-white/20"
                    : live
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {live ? "🔴 en juego" : "🎯 apostar"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido del día seleccionado */}
      {active.mode === "bet" ? (
        <div className="space-y-3">
          {active.matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Estos partidos ya cerraron. Mira cómo apostó todo el mundo 👀
          </p>
          {active.matches.map((m) => (
            <LiveCard key={m.id} match={m} bets={charts[m.id] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveCard({
  match: m,
  bets,
}: {
  match: MatchWithPrediction;
  bets: { home: number; away: number }[];
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-red-500">
          🔴 En juego / por jugarse
        </span>
        <span className="text-xs text-gray-500">🕓 {formatCl(m.kickoff_at)}</span>
      </div>

      <div className="flex items-center justify-center gap-3 font-semibold">
        <span className="flex-1 text-right">
          {m.home_team} <Flag team={m.home_team} />
        </span>
        <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-black">
          {m.prediction
            ? `${m.prediction.home_score}-${m.prediction.away_score}`
            : "—"}
        </span>
        <span className="flex-1 text-left">
          <Flag team={m.away_team} /> {m.away_team}
        </span>
      </div>
      <p className="text-center text-[0.7rem] text-gray-400 mt-1">
        {m.prediction ? "tu apuesta" : "no apostaste este partido"}
      </p>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs font-bold text-gray-500 mb-2">
          📊 Lo que apostó el grupo ({bets.length})
        </p>
        <BetChart bets={bets} />
      </div>

      <div className="mt-3 text-center">
        <Link
          href={`/partido/${m.id}`}
          className="text-xs font-bold text-brand-600 hover:underline"
        >
          👀 Ver el detalle de cada uno
        </Link>
      </div>
    </div>
  );
}
