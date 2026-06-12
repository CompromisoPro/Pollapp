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
            aria-pressed={view === v}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              view === v
                ? "grad-brand text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* VISTA PRÓXIMOS */}
      {view === "proximos" &&
        (proximosDays.length === 0 ? (
          <p className="card p-6 text-center text-sm text-gray-500">
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
                <span className="text-xs text-gray-500">
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
        <p className="text-sm text-gray-500">Aún no hay partidos.</p>
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
          aria-label="Fase del partido"
          className="field col-span-2 sm:col-span-1 px-2 py-1.5 text-base"
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
          aria-label="Grupo"
          maxLength={1}
          className="field px-2 py-1.5 text-base uppercase"
        />
        <input
          name="home_team"
          placeholder="Local (ej. Chile)"
          aria-label="Equipo local"
          className="field px-2 py-1.5 text-base"
        />
        <input
          name="away_team"
          placeholder="Visita (ej. Argentina)"
          aria-label="Equipo visita"
          className="field px-2 py-1.5 text-base"
        />
        <label className="col-span-2 sm:col-span-1 text-xs text-gray-500 flex flex-col">
          Día y hora (Chile)
          <input
            type="datetime-local"
            name="kickoff"
            aria-label="Día y hora del partido"
            className="field px-2 py-1.5 text-base"
          />
        </label>
        <button
          disabled={pending}
          className="btn btn-primary col-span-2 sm:col-span-1 py-1.5 text-sm self-end"
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
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();

  const statusColor =
    match.status === "abierto"
      ? "bg-green-100 text-green-800"
      : match.status === "finalizado"
      ? "bg-gray-200 text-gray-700"
      : "bg-amber-100 text-amber-800";

  function act(
    fn: () => Promise<{ ok: true } | { error: string }>,
    okMsg = ""
  ) {
    setMsg("");
    start(async () => {
      const res = await fn();
      setMsg("error" in res ? res.error : okMsg);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">
          {match.home_team} <span className="text-gray-500">vs</span>{" "}
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
            className="btn btn-ghost px-2.5 py-1 text-xs"
          >
            {match.status === "abierto" ? "👁️ Ocultar" : "🚀 Abrir"}
          </button>
        )}

        {/* Resultado oficial */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            aria-label={`Goles de ${match.home_team}`}
            className="field w-12 text-center py-1 text-base"
          />
          <span aria-hidden className="text-gray-400">
            -
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            aria-label={`Goles de ${match.away_team}`}
            className="field w-12 text-center py-1 text-base"
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
              act(() => saveMatchResult(match.id, h, a), "✓ Resultado guardado");
            }}
            className="btn btn-success px-2.5 py-1 text-xs"
          >
            💾 Resultado
          </button>
        </div>

        {confirmDel ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs">
            <span className="text-gray-600">¿Borrar?</span>
            <button
              disabled={pending}
              onClick={() =>
                act(async () => {
                  const res = await deleteMatch(match.id);
                  // Si falla, salimos del modo confirmación para no dejar la
                  // fila atascada ni permitir un re-disparo accidental.
                  if ("error" in res) setConfirmDel(false);
                  return res;
                })
              }
              className="font-bold text-red-600 hover:underline"
            >
              Sí
            </button>
            <button
              disabled={pending}
              onClick={() => setConfirmDel(false)}
              className="text-gray-500 hover:underline disabled:opacity-50"
            >
              No
            </button>
          </span>
        ) : (
          <button
            disabled={pending}
            onClick={() => setConfirmDel(true)}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            Borrar
          </button>
        )}
      </div>

      {msg && (
        <p
          className={`mt-1 text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
