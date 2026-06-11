"use client";

import { useState, useTransition } from "react";
import type { BonusQuestion, Team } from "@/lib/types";
import { saveBonusOfficial } from "@/app/admin/actions";

export default function BonusAdmin({
  questions,
  teams,
}: {
  questions: BonusQuestion[];
  teams: Team[];
}) {
  return (
    <div className="space-y-2">
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

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <strong>{q.title}</strong>
        <span className="text-xs text-gray-400">{q.max_points} pts</span>
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
