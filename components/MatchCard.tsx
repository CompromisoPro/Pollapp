"use client";

import { useState, useTransition } from "react";
import type { MatchWithPrediction } from "@/lib/types";
import { savePrediction } from "@/app/partidos/actions";
import { formatCl } from "@/lib/time";

export default function MatchCard({ match }: { match: MatchWithPrediction }) {
  const pred = match.prediction;
  const [home, setHome] = useState<string>(
    pred ? String(pred.home_score) : ""
  );
  const [away, setAway] = useState<string>(
    pred ? String(pred.away_score) : ""
  );
  const [msg, setMsg] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const now = Date.now();
  const lockMs = new Date(match.lock_at).getTime();
  const isFinished = match.status === "finalizado";
  const isLocked = isFinished || match.status !== "abierto" || now >= lockMs;

  function onSave() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      setMsg("Ingresa ambos marcadores.");
      return;
    }
    setMsg("");
    startTransition(async () => {
      const res = await savePrediction(match.id, h, a);
      setMsg("error" in res ? res.error : "✓ Guardado");
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {phaseLabel(match.phase)}
        </span>
        <span className="text-xs text-gray-500">
          🕓 {formatCl(match.kickoff_at)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="flex-1 text-right font-semibold">{match.home_team}</span>

        <div className="flex items-center gap-1.5">
          <ScoreBox
            value={home}
            onChange={setHome}
            disabled={isLocked || pending}
          />
          <span className="text-gray-300 font-bold">-</span>
          <ScoreBox
            value={away}
            onChange={setAway}
            disabled={isLocked || pending}
          />
        </div>

        <span className="flex-1 text-left font-semibold">{match.away_team}</span>
      </div>

      {/* Resultado oficial + puntos cuando el partido terminó */}
      {isFinished && match.home_score !== null && (
        <div className="mt-3 text-center text-sm">
          <span className="text-gray-500">
            Resultado oficial: <strong>{match.home_score}-{match.away_score}</strong>
          </span>
          {pred && (
            <span
              className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                (pred.points ?? 0) > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              +{pred.points ?? 0} pts
            </span>
          )}
        </div>
      )}

      {/* Acciones cuando el partido está abierto */}
      {!isFinished && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">
            {isLocked ? (
              <span className="text-red-500 font-medium">🔒 Cerrado</span>
            ) : (
              <>Cierra: {formatCl(match.lock_at)} hrs</>
            )}
          </span>

          {!isLocked && (
            <button
              onClick={onSave}
              disabled={pending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Guardando…" : pred ? "Actualizar" : "Guardar"}
            </button>
          )}
        </div>
      )}

      {msg && (
        <p
          className={`mt-2 text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

function ScoreBox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-12 rounded-lg border border-gray-300 text-center py-1.5 text-lg font-bold disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    grupos: "Fase de grupos",
    dieciseisavos: "Dieciseisavos",
    octavos: "Octavos",
    cuartos: "Cuartos",
    semis: "Semifinales",
    tercer: "Tercer lugar",
    final: "Final",
  };
  return map[phase] ?? phase;
}
