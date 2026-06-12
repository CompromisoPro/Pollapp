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

  // Qué mostrar en /apuestas (el cierre real es por lock_at, no por status:
  // un partido sigue 'abierto' aunque su plazo ya venció, hasta que el admin
  // carga el resultado y lo pasa a 'finalizado'):
  //  - partidos que AÚN se pueden apostar (status 'abierto' y plazo vigente), y
  //  - partidos que YA cerraron el plazo pero SIN resultado oficial, SOLO si
  //    apostaste (para ver tu apuesta "esperando resultado").
  // Los 'finalizado' (con resultado) salen de aquí: se ven en Fixture y en
  // "Ver apuestas de todos".
  const nowMs = Date.now();
  const enriched: MatchWithPrediction[] = matches
    .map((m) => ({ ...m, prediction: predByMatch.get(m.id) ?? null }))
    .filter((m) => {
      if (m.status === "finalizado") return false;
      const stillOpen =
        m.status === "abierto" && nowMs < new Date(m.lock_at).getTime();
      if (stillOpen) return true;
      // cerrado (plazo vencido) sin resultado: solo si aposté
      return m.prediction !== null;
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
