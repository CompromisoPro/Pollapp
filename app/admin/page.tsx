import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Match,
  Team,
  BonusQuestion,
  Profile,
} from "@/lib/types";
import MatchAdmin from "@/components/admin/MatchAdmin";
import TeamAdmin from "@/components/admin/TeamAdmin";
import BonusAdmin from "@/components/admin/BonusAdmin";
import BonusGrading, { type GradeAnswer } from "@/components/admin/BonusGrading";
import PlayerAdmin from "@/components/admin/PlayerAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile?.is_admin) redirect("/apuestas");

  // Lectura con service role: el admin ve TODO (incluso partidos ocultos).
  const admin = createAdminClient();
  const [
    { data: matches },
    { data: teams },
    { data: bonus },
    { data: players },
    { data: bonusAnswers },
  ] = await Promise.all([
    admin.from("matches").select("*").order("kickoff_at", { ascending: true }),
    admin.from("teams").select("*").order("group_label").order("name"),
    admin.from("bonus_questions").select("*").order("sort"),
    admin.from("profiles").select("*").order("points_total", { ascending: false }),
    admin
      .from("bonus_answers")
      .select("id, question_id, answer, points, profiles(full_name)"),
  ]);

  // Respuestas de los bonos de texto libre (kind=player) para calificar a mano.
  const bonusQuestions = (bonus ?? []) as BonusQuestion[];
  const playerQuestionIds = new Set(
    bonusQuestions.filter((q) => q.kind === "player").map((q) => q.id)
  );
  const gradeAnswers: GradeAnswer[] = ((bonusAnswers ?? []) as unknown[])
    .map((a) => {
      const row = a as {
        id: number;
        question_id: string;
        answer: unknown;
        points: number | null;
        profiles: { full_name: string | null } | null;
      };
      return {
        id: row.id,
        question_id: row.question_id,
        answer: row.answer,
        points: row.points,
        name: row.profiles?.full_name ?? "—",
      };
    })
    .filter((a) => playerQuestionIds.has(a.question_id));

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6 space-y-10">
      <header>
        <h1 className="text-2xl font-black">Panel de administración</h1>
        <p className="text-sm text-gray-500">
          Aquí cargas resultados, abres partidos, defines respuestas de bonos y
          gestionas pagos.
        </p>
      </header>

      <Section title="⚽ Partidos">
        <MatchAdmin matches={(matches ?? []) as Match[]} />
      </Section>

      <Section title="🏳️ Selecciones (para los bonos de grupos y finalistas)">
        <TeamAdmin teams={(teams ?? []) as Team[]} />
      </Section>

      <Section title="🎯 Bonos — respuestas oficiales (equipos / números)">
        <BonusAdmin questions={bonusQuestions} teams={(teams ?? []) as Team[]} />
      </Section>

      <Section title="✍️ Calificar bonos de jugador (a mano)">
        <BonusGrading
          questions={bonusQuestions.filter((q) => q.kind === "player")}
          answers={gradeAnswers}
        />
      </Section>

      <Section title="👥 Jugadores y pagos">
        <PlayerAdmin players={(players ?? []) as Profile[]} meId={profile.id} />
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}
