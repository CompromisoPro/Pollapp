"use client";

import { useState, useTransition } from "react";
import type { BonusQuestion, BonusAnswer, Team } from "@/lib/types";
import { saveBonusAnswer } from "@/app/apuestas/bonos/actions";
import { formatCl } from "@/lib/time";
import { useNow } from "@/lib/useNow";

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

  const nowMs = useNow();
  const isLocked = nowMs !== 0 && nowMs >= new Date(question.deadline).getTime();
  const groupTeams =
    question.kind === "qualifiers"
      ? teams.filter((t) => t.group_label === question.group_label)
      : teams;

  // Nombre legible de un id de equipo (los answers de equipo guardan ids: 'CHI').
  const teamName = (id: unknown) =>
    teams.find((t) => t.id === String(id))?.name ?? String(id ?? "—");

  // Formatea una respuesta (jsonb) para mostrarla: equipos -> nombres, listas -> coma.
  function fmt(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) return v.map((x) => fmt(x)).join(", ");
    if (question.kind === "team" || question.kind === "finalists" || question.kind === "qualifiers") {
      return teamName(v);
    }
    return String(v);
  }

  // ¿El bono ya tiene respuesta oficial cargada? Entonces mostramos el resultado.
  const resolved =
    question.official_answer !== null && question.official_answer !== undefined;
  const myPoints = answer?.points ?? 0;

  function buildAnswer(): unknown {
    if (question.kind === "finalists" || question.kind === "qualifiers") {
      return pair;
    }
    if (question.kind === "number") return Number(single);
    return single.trim();
  }

  function onSave() {
    // Optimista: confirmamos de inmediato; el server revalida en segundo plano.
    setMsg("✓ Guardado");
    startTransition(async () => {
      const res = await saveBonusAnswer(question.id, buildAnswer());
      setMsg("error" in res ? res.error : "✓ Guardado");
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">{question.title}</h3>
          {question.description && (
            <p className="text-xs text-gray-500 mt-0.5">{question.description}</p>
          )}
        </div>
        <span className="pill pill-gold shrink-0">🏅 {question.max_points} pts</span>
      </div>

      <div className="mt-3">
        {question.kind === "number" && (
          <input
            type="number"
            value={single}
            disabled={isLocked || pending}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="Número"
            className="field w-28 px-3 py-1.5 text-sm disabled:bg-gray-100"
          />
        )}

        {question.kind === "player" && (
          <input
            type="text"
            value={single}
            disabled={isLocked || pending}
            onChange={(e) => setSingle(e.target.value)}
            placeholder='Nombre del jugador (o "NADIE")'
            className="field w-full px-3 py-1.5 text-sm disabled:bg-gray-100"
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

      {/* Resultado: tu apuesta vs la oficial, cuando el bono ya se resolvió. */}
      {resolved && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm space-y-1">
          <p className="text-gray-500">
            Tu apuesta:{" "}
            <strong className="text-gray-700">
              {answer ? fmt(answer.answer) : "— (no apostaste)"}
            </strong>
          </p>
          <p className="text-gray-500">
            Resultado oficial:{" "}
            <strong className="text-gray-700">{fmt(question.official_answer)}</strong>
          </p>
          <p className="pt-0.5">
            <span
              className={`pill ${myPoints > 0 ? "pill-pitch" : "pill-mute"}`}
            >
              {myPoints > 0 ? `✓ +${myPoints} pts` : "✗ +0 pts"}
            </span>
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">
          {isLocked ? (
            <span className="text-red-600 font-medium">🔒 Cerrado</span>
          ) : (
            <>Cierra: {formatCl(question.deadline)} hrs</>
          )}
          {!resolved && answer?.points != null && (
            <span className="ml-2 pill pill-pitch">+{answer.points} pts</span>
          )}
        </span>

        {!isLocked && (
          <button
            onClick={onSave}
            disabled={pending}
            className="btn btn-primary px-3 py-1.5 text-xs"
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
      <span className="text-xs text-gray-500 italic">
        (El admin aún no cargó las selecciones)
      </span>
    );
  }
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="field px-3 py-1.5 text-sm disabled:bg-gray-100"
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
