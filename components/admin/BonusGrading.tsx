"use client";

import { useState, useTransition } from "react";
import type { BonusQuestion } from "@/lib/types";
import { gradeBonusAnswer } from "@/app/admin/actions";

export interface GradeAnswer {
  id: number;
  question_id: string;
  answer: unknown;
  points: number | null;
  name: string;
}

export default function BonusGrading({
  questions,
  answers,
}: {
  questions: BonusQuestion[];
  answers: GradeAnswer[];
}) {
  const byQ = new Map<string, GradeAnswer[]>();
  for (const a of answers) {
    if (!byQ.has(a.question_id)) byQ.set(a.question_id, []);
    byQ.get(a.question_id)!.push(a);
  }
  for (const list of byQ.values())
    list.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Bonos de texto libre (goleador, arquero, mejor jugador). Marca a mano
        quién acertó. Cada cambio pide confirmación.
      </p>
      {questions.map((q) => {
        const list = byQ.get(q.id) ?? [];
        const graded = list.filter((a) => a.points !== null).length;
        return (
          <details key={q.id} className="card overflow-hidden">
            <summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm flex items-center justify-between">
              <span>{q.title}</span>
              <span className="text-xs font-medium text-gray-400">
                {graded}/{list.length} calificados · {q.max_points} pts
              </span>
            </summary>
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {list.map((a) => (
                <Row key={a.id} a={a} maxPoints={q.max_points} />
              ))}
              {list.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Sin respuestas.</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function Row({ a, maxPoints }: { a: GradeAnswer; maxPoints: number }) {
  const [points, setPoints] = useState<number | null>(a.points);
  const [pending, start] = useTransition();
  const answerText = Array.isArray(a.answer)
    ? a.answer.join(", ")
    : String(a.answer ?? "");

  function set(correct: boolean) {
    const label = correct ? `ACERTÓ (+${maxPoints} pts)` : "NO acertó (0 pts)";
    if (
      !confirm(
        `¿Confirmas que ${a.name} ${label}?\n\nSu respuesta: "${answerText}"`
      )
    )
      return;
    start(async () => {
      const res = await gradeBonusAnswer(a.id, correct);
      if ("error" in res) alert(res.error);
      else setPoints(correct ? maxPoints : 0);
    });
  }

  const acerto = points !== null && points > 0;
  const fallo = points === 0;

  return (
    <div className="px-4 py-2.5 flex items-center gap-3 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium">{a.name}</div>
        <div className="text-gray-500 truncate">“{answerText}”</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          disabled={pending}
          onClick={() => set(true)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
            acerto
              ? "bg-green-600 text-white border-green-600"
              : "border-gray-300 text-gray-500 hover:bg-green-50"
          }`}
        >
          ✓ Acertó
        </button>
        <button
          disabled={pending}
          onClick={() => set(false)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
            fallo
              ? "bg-gray-500 text-white border-gray-500"
              : "border-gray-300 text-gray-500 hover:bg-gray-100"
          }`}
        >
          ✗ No
        </button>
      </div>
    </div>
  );
}
