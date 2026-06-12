import { createClient } from "@/lib/supabase/server";
import BonusCard from "@/components/BonusCard";
import type { BonusQuestion, BonusAnswer, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

const PHASE_TITLES: Record<string, string> = {
  especial: "🏆 Bonos especiales del torneo",
  grupos: "Clasificados de fase de grupos",
  dieciseisavos: "Dieciseisavos de final",
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semis: "Semifinales",
  final: "Gran final",
};

export default async function BonosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: qData }, { data: aData }, { data: tData }] = await Promise.all([
    supabase.from("bonus_questions").select("*").order("sort", { ascending: true }),
    supabase.from("bonus_answers").select("*").eq("user_id", user!.id),
    supabase.from("teams").select("*").order("group_label").order("name"),
  ]);

  const questions = (qData ?? []) as BonusQuestion[];
  const teams = (tData ?? []) as Team[];
  const ansByQ = new Map<string, BonusAnswer>();
  for (const a of (aData ?? []) as BonusAnswer[]) ansByQ.set(a.question_id, a);

  // Agrupar por fase, respetando el orden de PHASE_TITLES.
  const phases = Object.keys(PHASE_TITLES).filter((ph) =>
    questions.some((q) => q.phase === ph)
  );

  return questions.length === 0 ? (
    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
      Aún no hay bonos cargados.
    </div>
  ) : (
    <div className="space-y-8">
      {phases.map((ph) => (
        <section key={ph}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
            {PHASE_TITLES[ph]}
          </h2>
          <div className="space-y-3">
            {questions
              .filter((q) => q.phase === ph)
              .map((q) => (
                <BonusCard
                  key={q.id}
                  question={q}
                  answer={ansByQ.get(q.id) ?? null}
                  teams={teams}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
