"use client";

import { useState, useTransition } from "react";
import type { Match } from "@/lib/types";
import { formatCl } from "@/lib/time";
import {
  createMatch,
  setMatchStatus,
  saveMatchResult,
  deleteMatch,
} from "@/app/admin/actions";

const PHASES = [
  ["grupos", "Fase de grupos"],
  ["dieciseisavos", "Dieciseisavos"],
  ["octavos", "Octavos"],
  ["cuartos", "Cuartos"],
  ["semis", "Semifinales"],
  ["tercer", "Tercer lugar"],
  ["final", "Final"],
] as const;

export default function MatchAdmin({ matches }: { matches: Match[] }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createMatch(fd);
      if ("error" in res) setMsg(res.error);
      else {
        setMsg("✓ Partido creado (queda oculto hasta que lo abras).");
        form.reset();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Crear partido */}
      <form
        onSubmit={onCreate}
        className="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <select
          name="phase"
          className="col-span-2 sm:col-span-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          {PHASES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          name="home_team"
          placeholder="Local (ej. Chile)"
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          name="away_team"
          placeholder="Visita (ej. Argentina)"
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <label className="col-span-2 sm:col-span-1 text-xs text-gray-500 flex flex-col">
          Día y hora (Chile)
          <input
            type="datetime-local"
            name="kickoff"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          disabled={pending}
          className="col-span-2 sm:col-span-1 rounded-lg bg-blue-600 text-white py-1.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 self-end"
        >
          + Crear partido
        </button>
      </form>

      {msg && (
        <p
          className={`text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}

      {/* Lista de partidos */}
      <div className="space-y-2">
        {matches.length === 0 && (
          <p className="text-sm text-gray-400">Aún no hay partidos.</p>
        )}
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(
    match.home_score != null ? String(match.home_score) : ""
  );
  const [away, setAway] = useState(
    match.away_score != null ? String(match.away_score) : ""
  );
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const statusColor =
    match.status === "abierto"
      ? "bg-green-100 text-green-700"
      : match.status === "finalizado"
      ? "bg-gray-200 text-gray-600"
      : "bg-amber-100 text-amber-700";

  function act(fn: () => Promise<{ ok: true } | { error: string }>) {
    setMsg("");
    start(async () => {
      const res = await fn();
      if ("error" in res) setMsg(res.error);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">
          {match.home_team} <span className="text-gray-400">vs</span>{" "}
          {match.away_team}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor}`}>
          {match.status}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        🕓 {formatCl(match.kickoff_at)} · cierra {formatCl(match.lock_at)}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Abrir / ocultar */}
        {match.status !== "finalizado" && (
          <button
            disabled={pending}
            onClick={() =>
              act(() =>
                setMatchStatus(
                  match.id,
                  match.status === "abierto" ? "oculto" : "abierto"
                )
              )
            }
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          >
            {match.status === "abierto" ? "👁️ Ocultar" : "🚀 Abrir"}
          </button>
        )}

        {/* Resultado oficial */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="w-12 rounded border border-gray-300 text-center py-1"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="w-12 rounded border border-gray-300 text-center py-1"
          />
          <button
            disabled={pending}
            onClick={() => {
              const h = parseInt(home, 10);
              const a = parseInt(away, 10);
              if (Number.isNaN(h) || Number.isNaN(a)) {
                setMsg("Ingresa el resultado.");
                return;
              }
              act(() => saveMatchResult(match.id, h, a));
            }}
            className="rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
          >
            💾 Resultado
          </button>
        </div>

        <button
          disabled={pending}
          onClick={() => {
            if (confirm("¿Borrar este partido? Se eliminan sus pronósticos."))
              act(() => deleteMatch(match.id));
          }}
          className="ml-auto text-xs text-red-500 hover:underline"
        >
          Borrar
        </button>
      </div>

      {msg && <p className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
