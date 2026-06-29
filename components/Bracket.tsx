"use client";

import { useState } from "react";
import { Flag } from "@/components/Flag";
import { flagIso } from "@/lib/flags";

// Un partido de eliminación para el cuadro.
export interface BracketMatch {
  id: number;
  code: string;
  phase: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}
type Pred = { home: number; away: number; points: number | null };

const PHASES: [string, string][] = [
  ["dieciseisavos", "16avos"],
  ["octavos", "Octavos"],
  ["cuartos", "Cuartos"],
  ["semis", "Semis"],
  ["final", "Final"],
];
const LABEL: Record<string, string> = Object.fromEntries(PHASES);

// "Ganador M073" / "Perdedor M101" -> "M073". Equipos reales -> null.
function feederCode(team: string): string | null {
  if (!/^(ganador|perdedor)/i.test(team.trim())) return null;
  const m = team.match(/M\d+/);
  return m ? m[0] : null;
}

interface TNode {
  match: BracketMatch;
  home?: TNode;
  away?: TNode;
}

function buildTree(byCode: Map<string, BracketMatch>, code?: string): TNode | undefined {
  if (!code) return undefined;
  const match = byCode.get(code);
  if (!match) return undefined;
  return {
    match,
    home: buildTree(byCode, feederCode(match.home_team) ?? undefined),
    away: buildTree(byCode, feederCode(match.away_team) ?? undefined),
  };
}

// Recorrido in-order (home arriba → away abajo): da el orden vertical correcto
// de cada ronda para que las llaves calcen entre sí.
function collectByPhase(node: TNode | undefined, acc: Map<string, BracketMatch[]>) {
  if (!node) return;
  collectByPhase(node.home, acc);
  const arr = acc.get(node.match.phase);
  if (arr) arr.push(node.match);
  else acc.set(node.match.phase, [node.match]);
  collectByPhase(node.away, acc);
}

export default function Bracket({
  matches,
  myPreds,
}: {
  matches: BracketMatch[];
  myPreds: Record<number, Pred>;
}) {
  const [mine, setMine] = useState(false);
  const [round, setRound] = useState<string>("dieciseisavos");

  const byPhase = (p: string) => matches.filter((m) => m.phase === p);

  // Árbol simétrico (escritorio): se arma desde la final siguiendo "Ganador M0XX".
  const byCode = new Map(matches.map((m) => [m.code, m]));
  const finalNode = buildTree(byCode, "M104");
  const finalMatch = matches.find((m) => m.code === "M104");
  const tercer = matches.find((m) => m.phase === "tercer");
  const leftAcc = new Map<string, BracketMatch[]>();
  const rightAcc = new Map<string, BracketMatch[]>();
  collectByPhase(finalNode?.home, leftAcc);
  collectByPhase(finalNode?.away, rightAcc);
  const symmetricOk = !!finalMatch && leftAcc.size > 0 && rightAcc.size > 0;

  // Rondas para el selector mobile (la Final incluye el 3er lugar).
  const mobileMatches =
    round === "final"
      ? matches.filter((m) => m.phase === "final" || m.phase === "tercer")
      : byPhase(round);

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
          Tus pronósticos en cada cruce. Las apuestas siguen igual — esto es solo
          para ver cómo vas.
        </p>
      )}

      {/* ===================== MOBILE: selector de ronda ===================== */}
      <div className="md:hidden">
        <div className="mb-3 -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {PHASES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRound(key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                round === key
                  ? "grad-brand text-white shadow-sm"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {mobileMatches.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Esta ronda aún no está definida.
            </p>
          ) : (
            mobileMatches.map((m) => (
              <Cell key={m.id} m={m} mine={mine} pred={myPreds[m.id]} />
            ))
          )}
        </div>
      </div>

      {/* ===================== ESCRITORIO: árbol simétrico ===================== */}
      <div className="hidden md:block overflow-x-auto pb-4">
        {symmetricOk ? (
          <div className="mx-auto flex h-[46rem] min-w-max items-stretch justify-center gap-2">
            {/* Mitad izquierda: 16avos → semis */}
            {["dieciseisavos", "octavos", "cuartos", "semis"].map((ph) => (
              <Column
                key={`L-${ph}`}
                label={LABEL[ph]}
                matches={leftAcc.get(ph) ?? []}
                mine={mine}
                myPreds={myPreds}
              />
            ))}

            {/* Centro: final + 3er lugar */}
            <div className="flex w-44 shrink-0 flex-col items-center justify-center gap-2">
              <span aria-hidden className="text-4xl">🏆</span>
              <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                Final
              </p>
              {finalMatch && (
                <Cell m={finalMatch} mine={mine} pred={myPreds[finalMatch.id]} />
              )}
              {tercer && (
                <>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    🥉 3er lugar
                  </p>
                  <Cell m={tercer} mine={mine} pred={myPreds[tercer.id]} />
                </>
              )}
            </div>

            {/* Mitad derecha: semis → 16avos */}
            {["semis", "cuartos", "octavos", "dieciseisavos"].map((ph) => (
              <Column
                key={`R-${ph}`}
                label={LABEL[ph]}
                matches={rightAcc.get(ph) ?? []}
                mine={mine}
                myPreds={myPreds}
              />
            ))}
          </div>
        ) : (
          // Fallback: si el árbol no se puede armar, columnas simples por ronda.
          <div className="flex items-start gap-3 min-w-max">
            {PHASES.map(([ph, label]) => {
              const ms = byPhase(ph);
              if (ms.length === 0) return null;
              return (
                <Column key={ph} label={label} matches={ms} mine={mine} myPreds={myPreds} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({
  label,
  matches,
  mine,
  myPreds,
}: {
  label: string;
  matches: BracketMatch[];
  mine: boolean;
  myPreds: Record<number, Pred>;
}) {
  return (
    <div className="flex w-44 shrink-0 flex-col">
      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-brand-600">
        {label}
      </p>
      <div className="flex flex-1 flex-col justify-around gap-2">
        {matches.map((m) => (
          <Cell key={m.id} m={m} mine={mine} pred={myPreds[m.id]} />
        ))}
      </div>
    </div>
  );
}

function Cell({
  m,
  mine,
  pred,
}: {
  m: BracketMatch;
  mine: boolean;
  pred?: Pred;
}) {
  const finished =
    m.status === "finalizado" && m.home_score !== null && m.away_score !== null;
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
              <strong className="tabular-nums text-gray-700">
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
  const real = flagIso(team) !== null; // placeholders ("Ganador M073") no tienen bandera
  return (
    <div className={`flex items-center gap-1.5 ${win ? "font-bold text-ink" : ""}`}>
      {real ? (
        <Flag team={team} />
      ) : (
        <span aria-hidden className="text-gray-300">⚽</span>
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
