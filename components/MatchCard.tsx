"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { MatchWithPrediction } from "@/lib/types";
import { savePrediction } from "@/app/apuestas/actions";
import { formatCl } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { Flag } from "@/components/Flag";

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
  // Último marcador confirmado por el server, para revertir si un guardado falla.
  const [saved, setSaved] = useState<{ h: string; a: string }>(() => ({
    h: pred ? String(pred.home_score) : "",
    a: pred ? String(pred.away_score) : "",
  }));

  // "Ahora" del cliente, refrescado cada 30s para cerrar el partido al llegar la hora.
  const nowMs = useNow();
  const lockMs = new Date(match.lock_at).getTime();
  const isFinished = match.status === "finalizado";
  const isLocked =
    isFinished || match.status !== "abierto" || (nowMs !== 0 && nowMs >= lockMs);

  function onSave() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      setMsg("Ingresa ambos marcadores.");
      return;
    }
    // Optimista: confirmamos al instante y revertimos si el server falla.
    setMsg("✓ Guardado");
    startTransition(async () => {
      const res = await savePrediction(match.id, h, a);
      if ("error" in res) {
        setHome(saved.h);
        setAway(saved.a);
        setMsg(res.error);
      } else {
        setSaved({ h: String(h), a: String(a) });
        setMsg("✓ Guardado");
      }
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
          {phaseLabel(match.phase)}
        </span>
        <span className="text-xs text-gray-500">
          🕓 {formatCl(match.kickoff_at)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="flex-1 text-right font-semibold">
          {match.home_team} <Flag team={match.home_team} />
        </span>

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

        <span className="flex-1 text-left font-semibold">
          <Flag team={match.away_team} /> {match.away_team}
        </span>
      </div>

      {/* Cerrado SIN resultado todavía: mostramos tu apuesta, a la espera. */}
      {isLocked && !isFinished && (
        <div className="mt-3 text-center text-sm text-gray-500">
          {pred ? (
            <>
              Tu apuesta:{" "}
              <strong className="text-gray-700">
                {pred.home_score}-{pred.away_score}
              </strong>
              <span className="mx-1.5 text-gray-300">·</span>
              esperando resultado oficial
            </>
          ) : (
            <span className="text-gray-400">No apostaste este partido.</span>
          )}
        </div>
      )}

      {/* Resultado oficial + puntos cuando el partido terminó */}
      {isFinished && match.home_score !== null && (
        <div className="mt-3 text-center text-sm">
          <span className="text-gray-500">
            Resultado oficial: <strong>{match.home_score}-{match.away_score}</strong>
          </span>
          {pred ? (
            <span
              className={`ml-2 pill ${
                (pred.points ?? 0) > 0 ? "pill-pitch" : "pill-mute"
              }`}
            >
              +{pred.points ?? 0} pts
            </span>
          ) : (
            <span className="ml-2 text-gray-400">No apostaste</span>
          )}
        </div>
      )}

      {/* Acciones cuando el partido está abierto */}
      {!isFinished && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            {isLocked ? (
              <span className="text-red-600 font-medium">🔒 Cerrado</span>
            ) : (
              <>Cierra: {formatCl(match.lock_at)} hrs</>
            )}
          </span>

          {!isLocked && (
            <button
              onClick={onSave}
              disabled={pending}
              className="btn btn-primary px-3 py-1.5 text-xs"
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

      {/* Ver apuestas de todos: solo cuando ya cerró el plazo */}
      {isLocked && (
        <div className="mt-3 border-t border-gray-100 pt-2 text-center">
          <Link
            href={`/partido/${match.id}`}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            👀 Ver apuestas de todos
          </Link>
        </div>
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
      className="field w-12 text-center py-1.5 text-lg font-extrabold disabled:bg-gray-100 disabled:text-gray-500"
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
