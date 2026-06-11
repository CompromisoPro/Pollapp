"use client";

import { useState, useTransition } from "react";
import type { BonusQuestion, BonusAnswer, Team } from "@/lib/types";
import { saveBonusAnswer } from "@/app/bonos/actions";
import { formatCl } from "@/lib/time";

export default function BonusCard({
  question,
  answer,
  teams,
}: {
  question: BonusQuestion;
  answer: BonusAnswer | null;
  teams: Team[];
}) {
  const initial = answer?.answer;
  const [single, setSingle] = useState<string>(
    initial != null && !Array.isArray(initial) ? String(initial) : ""
  );
  const [pair, setPair] = useState<[string, string]>(
    Array.isArray(initial)
      ? [String(initial[0] ?? ""), String(initial[1] ?? "")]
      : ["", ""]
  );
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const isLocked = Date.now() >= new Date(question.deadline).getTime();
  const groupTeams =
    question.kind === "qualifiers"
      ? teams.filter((t) => t.group_label === question.group_label)
      : teams;

  function buildAnswer(): unknown {
    if (question.kind === "finalists" || question.kind === "qualifiers") {
      return pair;
    }
    if (question.kind === "number") return Number(single);
    return single.trim();
  }

  function onSave() {
    setMsg("");
    startTransition(async () => {
      const res = await saveBonusAnswer(question.id, buildAnswer());
      setMsg("error" in res ? res.error : "✓ Guardado");
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{question.title}</h3>
          {question.description && (
            <p className="text-xs text-gray-500 mt-0.5">{question.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5">
          {question.max_points} pts
        </span>
      </div>

      <div className="mt-3">
        {question.kind === "number" && (
          <input
            type="number"
            value={single}
            disabled={isLocked || pending}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="Número"
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {question.kind === "player" && (
          <input
            type="text"
            value={single}
            disabled={isLocked || pending}
            onChange={(e) => setSingle(e.target.value)}
            placeholder='Nombre del jugador (o "NADIE")'
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {question.kind === "team" && (
          <TeamSelect
            teams={groupTeams}
            value={single}
            disabled={isLocked || pending}
            onChange={setSingle}
          />
        )}

        {(question.kind === "finalists" || question.kind === "qualifiers") && (
          <div className="flex flex-wrap gap-2">
            <TeamSelect
              teams={groupTeams}
              value={pair[0]}
              disabled={isLocked || pending}
              onChange={(v) => setPair([v, pair[1]])}
            />
            <TeamSelect
              teams={groupTeams}
              value={pair[1]}
              disabled={isLocked || pending}
              onChange={(v) => setPair([pair[0], v])}
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {isLocked ? (
            <span className="text-red-500 font-medium">🔒 Cerrado</span>
          ) : (
            <>Cierra: {formatCl(question.deadline)} hrs</>
          )}
          {answer?.points != null && (
            <span className="ml-2 rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-bold">
              +{answer.points} pts
            </span>
          )}
        </span>

        {!isLocked && (
          <button
            onClick={onSave}
            disabled={pending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Guardando…" : answer ? "Actualizar" : "Guardar"}
          </button>
        )}
      </div>

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

function TeamSelect({
  teams,
  value,
  onChange,
  disabled,
}: {
  teams: Team[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  if (teams.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        (El admin aún no cargó las selecciones)
      </span>
    );
  }
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
