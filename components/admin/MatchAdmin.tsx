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
  const [view, setView] = useState<"proximos" | "grupos">("proximos");
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

  // Secciones: Grupo A..L y luego cada fase eliminatoria.
  const sections: { title: string; items: Match[] }[] = [];
  for (const g of "ABCDEFGHIJKL") {
    const items = matches.filter(
      (m) => m.phase === "grupos" && m.group_label === g
    );
    if (items.length) sections.push({ title: `Grupo ${g}`, items });
  }
  for (const [phase, label] of PHASES) {
    if (phase === "grupos") continue;
    const items = matches.filter((m) => m.phase === phase);
    if (items.length) sections.push({ title: label, items });
  }
  const huerfanos = matches.filter(
    (m) => m.phase === "grupos" && !m.group_label
  );
  if (huerfanos.length) sections.push({ title: "Sin grupo", items: huerfanos });

  // Vista "Próximos": partidos sin resultado, agrupados por día (los más
  // cercanos primero). Es la cola de acciones del día a día (abrir / cargar).
  const pendientes = matches.filter((m) => m.status !== "finalizado");
  const dayMap = new Map<string, Match[]>();
  for (const m of pendientes) {
    const key = formatCl(m.kickoff_at, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(m);
  }
  const proximosDays = [...dayMap.entries()].slice(0, 5); // próximos 5 días con pendientes

  return (
    <div className="space-y-3">
      {/* Toggle de vista */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        {(
          [
            ["proximos", "📅 Próximos"],
            ["grupos", "🔤 Por grupo / fase"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              view === v
                ? "grad-brand text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* VISTA PRÓXIMOS */}
      {view === "proximos" &&
        (proximosDays.length === 0 ? (
          <p className="card p-6 text-center text-sm text-gray-400">
            🎉 Todos los partidos tienen resultado cargado.
          </p>
        ) : (
          proximosDays.map(([day, items]) => (
            <section key={day}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 capitalize mt-3">
                {day}
              </h3>
              <div className="space-y-2">
                {items.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))
        ))}

      {/* VISTA POR GRUPO / FASE */}
      {view === "grupos" &&
        sections.map(({ title, items }) => {
          const sinResultado = items.filter((m) => m.home_score === null).length;
          const abiertos = items.filter((m) => m.status === "abierto").length;
          return (
            <details key={title} className="card overflow-hidden">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-2 text-sm">
                <span className="font-bold">{title}</span>
                <span className="text-xs text-gray-400">
                  {items.length} partidos
                  {abiertos > 0 && (
                    <span className="ml-2 text-green-600 font-semibold">
                      {abiertos} abiertos
                    </span>
                  )}
                  {sinResultado > 0 && (
                    <span className="ml-2 text-amber-600 font-semibold">
                      {sinResultado} sin resultado
                    </span>
                  )}
                </span>
              </summary>
              <div className="space-y-2 border-t border-gray-100 p-3">
                {items.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </details>
          );
        })}

      {matches.length === 0 && (
        <p className="text-sm text-gray-400">Aún no hay partidos.</p>
      )}

      {/* Crear partido (plegado, se usa poco) */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-gray-500">
          + Crear partido manualmente
        </summary>
      <form
        onSubmit={onCreate}
        className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
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
          name="group_label"
          placeholder="Grupo (A-L, opcional)"
          maxLength={1}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm uppercase"
        />
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
      </details>

      {msg && (
        <p
          className={`text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}
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
