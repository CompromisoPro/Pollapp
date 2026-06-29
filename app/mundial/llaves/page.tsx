import { createClient } from "@/lib/supabase/server";
import Bracket, { type BracketMatch } from "@/components/Bracket";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function LlavesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Todos los partidos de eliminación (incluye placeholders de rondas futuras).
  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, phase, home_team, away_team, home_score, away_score, status")
    .neq("phase", "grupos")
    .order("code", { ascending: true });
  const matches = (matchesData ?? []) as BracketMatch[];

  // Mis pronósticos de esos partidos (para "Mi camino").
  const myPreds: Record<number, { home: number; away: number; points: number | null }> = {};
  const ids = matches.map((m) => m.id);
  if (user && ids.length > 0) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("match_id, home_score, away_score, points")
      .eq("user_id", user.id)
      .in("match_id", ids);
    for (const p of preds ?? []) {
      myPreds[p.match_id] = {
        home: p.home_score,
        away: p.away_score,
        points: p.points,
      };
    }
  }

  if (matches.length === 0) {
    return (
      <EmptyState emoji="🏆" title="Las llaves aún no están disponibles.">
        Cuando arranque la fase de eliminación, aquí verás el cuadro completo. 👀
      </EmptyState>
    );
  }

  return <Bracket matches={matches} myPreds={myPreds} />;
}
