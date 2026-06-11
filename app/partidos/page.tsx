import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import type { Match, Prediction, MatchWithPrediction } from "@/lib/types";
import { formatCl } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Partidos visibles (la RLS oculta los que están en estado 'oculto').
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });
  const matches = (matchesData ?? []) as Match[];

  // Pronósticos del usuario.
  const { data: predData } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user!.id);
  const predByMatch = new Map<number, Prediction>();
  for (const p of (predData ?? []) as Prediction[]) {
    predByMatch.set(p.match_id, p);
  }

  const enriched: MatchWithPrediction[] = matches.map((m) => ({
    ...m,
    prediction: predByMatch.get(m.id) ?? null,
  }));

  // Agrupar por día (hora Chile).
  const groups = new Map<string, MatchWithPrediction[]>();
  for (const m of enriched) {
    const key = formatCl(m.kickoff_at, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Partidos"
        emoji="⚽"
        subtitle="Pon tu marcador. Cierra a las 23:59 (Chile) del día anterior a cada partido."
      />

      {enriched.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
          Todavía no hay partidos disponibles. Vuelve pronto 👀
        </div>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, dayMatches]) => (
            <section key={day}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 capitalize">
                {day}
              </h2>
              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
