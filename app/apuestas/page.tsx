import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import type { Match, Prediction, MatchWithPrediction } from "@/lib/types";
import { formatCl } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Traemos los partidos visibles (no 'oculto') y los pronósticos del usuario.
  // El calendario completo y los ya jugados están en Fixture; /apuestas se
  // queda solo con lo accionable (ver el filtro más abajo).
  const [{ data: matchesData }, { data: predData }] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .neq("status", "oculto")
      .order("kickoff_at", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user!.id),
  ]);
  const matches = (matchesData ?? []) as Match[];

  const predByMatch = new Map<number, Prediction>();
  for (const p of (predData ?? []) as Prediction[]) {
    predByMatch.set(p.match_id, p);
  }

  // Qué mostrar en /apuestas:
  //  - los partidos que AÚN puedes apostar (abierto y plazo vigente), y
  //  - TODOS los partidos que apostaste, en cualquier estado (cerrado a la
  //    espera de resultado, o ya finalizado con sus puntos).
  // Los partidos cerrados que NO apostaste no aparecen (ya no puedes hacer
  // nada con ellos); igual se ven en Fixture y en "Ver apuestas de todos".
  // eslint-disable-next-line react-hooks/purity -- server component: hora del request
  const nowMs = Date.now();
  const enriched: MatchWithPrediction[] = matches
    .map((m) => ({ ...m, prediction: predByMatch.get(m.id) ?? null }))
    .filter((m) => {
      if (m.prediction !== null) return true; // lo aposté: siempre lo veo
      const stillOpen =
        m.status === "abierto" && nowMs < new Date(m.lock_at).getTime();
      return stillOpen; // sin apostar: solo si todavía se puede apostar
    });

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

  return enriched.length === 0 ? (
    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
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
  );
}
