"use client";

import { useState } from "react";
import { Flag } from "@/components/Flag";
import { flagIso } from "@/lib/flags";

// Un partido de eliminación para el cuadro (solo lo que la vista necesita).
export interface BracketMatch {
  id: number;
  phase: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

type Pred = { home: number; away: number; points: number | null };

// Columnas del cuadro, de izquierda a derecha.
const ROUNDS: { phase: string; label: string }[] = [
  { phase: "dieciseisavos", label: "16avos" },
  { phase: "octavos", label: "Octavos" },
  { phase: "cuartos", label: "Cuartos" },
  { phase: "semis", label: "Semis" },
  { phase: "final", label: "Final" },
];

export default function Bracket({
  matches,
  myPreds,
}: {
  matches: BracketMatch[];
  myPreds: Record<number, Pred>;
}) {
  const [mine, setMine] = useState(false);
  const byPhase = (p: string) => matches.filter((m) => m.phase === p);
  const tercer = byPhase("tercer");

  return (
    <div>
      {/* Toggle Cuadro / Mi camino */}
      <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setMine(false)}
          className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
            !mine ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"
          }`}
        >
          🏆 Cuadro
        </button>
        <button
          onClick={() => setMine(true)}
          className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
            mine ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"
          }`}
        >
          🧭 Mi camino
        </button>
      </div>

      {mine && (
        <p className="mb-3 text-xs text-gray-500">
          Tus pronósticos en cada cruce. Se siguen apostando como siempre — esto
          es solo para ver cómo vas.
        </p>
      )}

      {/* Cuadro: scroll horizontal en celular */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-3 min-w-max">
          {ROUNDS.map((r) => {
            const ms = byPhase(r.phase);
            if (ms.length === 0) return null;
            return (
              <div key={r.phase} className="flex w-44 shrink-0 flex-col gap-3">
                <p className="text-center text-xs font-bold uppercase tracking-wide text-brand-600">
                  {r.label}
                </p>
                {ms.map((m) => (
                  <MatchCell key={m.id} m={m} mine={mine} pred={myPreds[m.id]} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tercer lugar (aparte del árbol principal) */}
      {tercer.length > 0 && (
        <div className="mt-4 max-w-[12rem]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            🥉 Tercer lugar
          </p>
          {tercer.map((m) => (
            <MatchCell key={m.id} m={m} mine={mine} pred={myPreds[m.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCell({
  m,
  mine,
  pred,
}: {
  m: BracketMatch;
  mine: boolean;
  pred?: Pred;
}) {
  const finished =
    m.status === "finalizado" &&
    m.home_score !== null &&
    m.away_score !== null;
  const homeWin = finished && m.home_score! > m.away_score!;
  const awayWin = finished && m.away_score! > m.home_score!;

  return (
    <div className="card p-2 text-sm">
      <TeamRow team={m.home_team} score={m.home_score} win={homeWin} finished={finished} />
      <div className="my-1 border-t border-gray-100" />
      <TeamRow team={m.away_team} score={m.away_score} win={awayWin} finished={finished} />

      {mine && (
        <div className="mt-1.5 border-t border-gray-100 pt-1 text-center text-[11px]">
          {pred ? (
            <span className="text-gray-500">
              Tú:{" "}
              <strong className="text-gray-700 tabular-nums">
                {pred.home}-{pred.away}
              </strong>
              {finished && pred.points != null && (
                <span
                  className={`ml-1 pill ${
                    pred.points > 0 ? "pill-pitch" : "pill-mute"
                  }`}
                >
                  +{pred.points}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  score,
  win,
  finished,
}: {
  team: string;
  score: number | null;
  win: boolean;
  finished: boolean;
}) {
  const real = flagIso(team) !== null; // los placeholders ("Ganador M073") no tienen bandera
  return (
    <div className={`flex items-center gap-1.5 ${win ? "font-bold text-ink" : ""}`}>
      {real ? (
        <Flag team={team} />
      ) : (
        <span aria-hidden className="text-gray-300">
          ⚽
        </span>
      )}
      <span
        className={`flex-1 truncate ${real ? "" : "text-[11px] italic text-gray-400"}`}
      >
        {team}
      </span>
      {finished && <span className="tabular-nums font-bold">{score}</span>}
    </div>
  );
}
