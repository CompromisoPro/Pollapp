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
import PlayerAdmin from "@/components/admin/PlayerAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile?.is_admin) redirect("/partidos");

  // Lectura con service role: el admin ve TODO (incluso partidos ocultos).
  const admin = createAdminClient();
  const [{ data: matches }, { data: teams }, { data: bonus }, { data: players }] =
    await Promise.all([
      admin.from("matches").select("*").order("kickoff_at", { ascending: true }),
      admin.from("teams").select("*").order("group_label").order("name"),
      admin.from("bonus_questions").select("*").order("sort"),
      admin
        .from("profiles")
        .select("*")
        .order("points_total", { ascending: false }),
    ]);

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

      <Section title="🎯 Bonos — respuestas oficiales">
        <BonusAdmin
          questions={(bonus ?? []) as BonusQuestion[]}
          teams={(teams ?? []) as Team[]}
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
