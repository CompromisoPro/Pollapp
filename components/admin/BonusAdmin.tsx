"use client";

import { useState, useTransition } from "react";
import type { BonusQuestion, Team } from "@/lib/types";
import {
  saveBonusOfficial,
  setBonusStatus,
  createBonus,
  updateBonus,
  deleteBonus,
} from "@/app/admin/actions";
import { formatCl } from "@/lib/time";

const KINDS = [
  ["number", "Número exacto"],
  ["player", "Jugador (texto, se califica a mano)"],
  ["team", "Una selección"],
  ["finalists", "Dos finalistas"],
  ["qualifiers", "Clasificados de un grupo"],
] as const;

const PHASES_BONUS = [
  ["especial", "Especial del torneo"],
  ["grupos", "Fase de grupos"],
  ["dieciseisavos", "Dieciseisavos"],
  ["octavos", "Octavos"],
  ["cuartos", "Cuartos"],
  ["semis", "Semifinales"],
  ["final", "Final"],
] as const;

export default function BonusAdmin({
  questions,
  teams,
}: {
  questions: BonusQuestion[];
  teams: Team[];
}) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setMsg("");
    start(async () => {
      const res = await createBonus(fd);
      if ("error" in res) setMsg(res.error);
      else {
        setMsg("✓ Bono creado (nace oculto: ábrelo cuando quieras que lo vean).");
        form.reset();
      }
    });
  }

  return (
    <div className="space-y-2">
      {/* Crear bono */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-gray-500">
          + Crear bono nuevo
        </summary>
        <form
          onSubmit={onCreate}
          className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3"
        >
          <input
            name="title"
            placeholder="Título (ej. Goleador de octavos)"
            className="field px-2 py-1.5 text-sm col-span-2"
          />
          <textarea
            name="description"
            placeholder="Descripción / reglas del bono (opcional)"
            rows={2}
            className="field px-2 py-1.5 text-sm col-span-2"
          />
          <label className="text-xs text-gray-500 flex flex-col">
            Tipo de respuesta
            <select name="kind" className="field px-2 py-1.5 text-sm">
              {KINDS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Fase
            <select name="phase" className="field px-2 py-1.5 text-sm">
              {PHASES_BONUS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Puntos
            <input
              name="max_points"
              type="number"
              min={1}
              placeholder="3"
              className="field px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Cierre (hora Chile)
            <input
              name="deadline"
              type="datetime-local"
              className="field px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Grupo (solo clasificados)
            <input
              name="group_label"
              placeholder="A-L"
              maxLength={1}
              className="field px-2 py-1.5 text-sm uppercase w-20"
            />
          </label>
          <button
            disabled={pending}
            className="btn btn-primary py-1.5 text-sm self-end"
          >
            + Crear bono
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

      {questions.length === 0 && (
        <p className="text-sm text-gray-400">
          No hay bonos cargados. Corre el archivo seed.sql en Supabase.
        </p>
      )}
      {questions.map((q) => (
        <BonusRow key={q.id} q={q} teams={teams} />
      ))}
    </div>
  );
}

function BonusRow({ q, teams }: { q: BonusQuestion; teams: Team[] }) {
  const off = q.official_answer;
  const [single, setSingle] = useState<string>(
    off != null && !Array.isArray(off) ? String(off) : ""
  );
  const [pair, setPair] = useState<[string, string]>(
    Array.isArray(off) ? [String(off[0] ?? ""), String(off[1] ?? "")] : ["", ""]
  );
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  // Editor del bono
  const [editTitle, setEditTitle] = useState(q.title);
  const [editDesc, setEditDesc] = useState(q.description ?? "");
  const [editPoints, setEditPoints] = useState(String(q.max_points));
  const [editDeadline, setEditDeadline] = useState(""); // vacío = no cambiar

  function onEdit() {
    if (!confirm(`¿Guardar los cambios del bono "${editTitle}"?`)) return;
    setMsg("");
    start(async () => {
      const res = await updateBonus(q.id, {
        title: editTitle,
        description: editDesc,
        max_points: parseInt(editPoints, 10),
        deadlineLocal: editDeadline || undefined,
      });
      setMsg("error" in res ? res.error : "✓ Bono actualizado");
    });
  }

  function onDelete() {
    if (
      !confirm(
        `¿BORRAR el bono "${q.title}"?\n\nSe eliminan también TODAS las respuestas de los jugadores y se recalculan los puntos. Esto no se puede deshacer.`
      )
    )
      return;
    setMsg("");
    start(async () => {
      const res = await deleteBonus(q.id);
      if ("error" in res) setMsg(res.error);
    });
  }

  const groupTeams =
    q.kind === "qualifiers"
      ? teams.filter((t) => t.group_label === q.group_label)
      : teams;

  function build(): unknown {
    if (q.kind === "finalists" || q.kind === "qualifiers") return pair;
    if (q.kind === "number") return Number(single);
    if (q.kind === "player")
      // acepta varias respuestas separadas por coma
      return single
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return single.trim();
  }

  function onSave() {
    setMsg("");
    start(async () => {
      const res = await saveBonusOfficial(q.id, build());
      setMsg("error" in res ? res.error : "✓ Guardado y puntos recalculados");
    });
  }

  const visible = q.status === "abierto";

  function toggleStatus() {
    const next = visible ? "oculto" : "abierto";
    const aviso = visible
      ? `¿Ocultar "${q.title}"?\n\nLos jugadores dejarán de verlo.`
      : `¿Abrir "${q.title}"?\n\nLos jugadores podrán verlo y responder hasta su fecha de cierre.`;
    if (!confirm(aviso)) return;
    start(async () => {
      const res = await setBonusStatus(q.id, next);
      setMsg("error" in res ? res.error : `✓ Bono ${next}`);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <strong>{q.title}</strong>
        <span className="flex items-center gap-2 shrink-0">
          <span
            className={`pill ${
              visible ? "pill-pitch" : "bg-amber-100 text-amber-700"
            }`}
          >
            {visible ? "visible" : "oculto"}
          </span>
          <button
            disabled={pending}
            onClick={toggleStatus}
            className="rounded-lg border border-gray-300 px-2 py-0.5 text-xs font-medium hover:bg-gray-50"
          >
            {visible ? "👁️ Ocultar" : "🚀 Abrir"}
          </button>
          <span className="text-xs text-gray-400">{q.max_points} pts</span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {q.kind === "number" && (
          <input
            type="number"
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="Número oficial"
            className="w-32 rounded-lg border border-gray-300 px-2 py-1.5"
          />
        )}

        {q.kind === "player" && (
          <input
            type="text"
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="Nombre oficial (varios = separar con coma)"
            className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-2 py-1.5"
          />
        )}

        {q.kind === "team" && (
          <Select teams={groupTeams} value={single} onChange={setSingle} />
        )}

        {(q.kind === "finalists" || q.kind === "qualifiers") && (
          <>
            <Select
              teams={groupTeams}
              value={pair[0]}
              onChange={(v) => setPair([v, pair[1]])}
            />
            <Select
              teams={groupTeams}
              value={pair[1]}
              onChange={(v) => setPair([pair[0], v])}
            />
          </>
        )}

        <button
          disabled={pending}
          onClick={onSave}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Calculando…" : "Guardar oficial"}
        </button>
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

      {/* Editar / borrar este bono */}
      <details className="mt-2 border-t border-gray-100 pt-2">
        <summary className="cursor-pointer select-none text-xs text-gray-400 hover:text-gray-600">
          ✏️ Editar bono (título, puntos, cierre) o borrarlo
        </summary>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-500 flex flex-col">
            Título
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="field px-2 py-1.5 text-sm w-64"
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Puntos
            <input
              type="number"
              min={1}
              value={editPoints}
              onChange={(e) => setEditPoints(e.target.value)}
              className="field px-2 py-1.5 text-sm w-20"
            />
          </label>
          <label className="text-xs text-gray-500 flex flex-col">
            Nuevo cierre (Chile) — actual: {formatCl(q.deadline)}
            <input
              type="datetime-local"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className="field px-2 py-1.5 text-sm"
            />
          </label>
          <button
            disabled={pending}
            onClick={onEdit}
            className="btn btn-success px-3 py-1.5 text-xs"
          >
            💾 Guardar cambios
          </button>
          <button
            disabled={pending}
            onClick={onDelete}
            className="ml-auto text-xs text-red-500 hover:underline"
          >
            🗑️ Borrar bono
          </button>
        </div>
        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          placeholder="Descripción"
          rows={2}
          className="field px-2 py-1.5 text-sm w-full mt-2"
        />
      </details>
    </div>
  );
}

function Select({
  teams,
  value,
  onChange,
}: {
  teams: Team[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (teams.length === 0)
    return (
      <span className="text-xs text-gray-400 italic">
        (agrega selecciones primero)
      </span>
    );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
    >
      <option value="">— Elegir —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
