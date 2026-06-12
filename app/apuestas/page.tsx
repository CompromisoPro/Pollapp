import { createClient } from "@/lib/supabase/server";
import ApuestasCarousel, { type ApuestaDay } from "@/components/ApuestasCarousel";
import type { Match, Prediction, MatchWithPrediction } from "@/lib/types";
import { formatCl, santiagoDateParts } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // eslint-disable-next-line react-hooks/purity -- server component: hora del request
  const nowMs = Date.now();

  // Clasificamos lo que se muestra:
  //   bet  -> abierto y plazo vigente (se puede apostar / editar)
  //   live -> ya cerró el plazo y aún no hay resultado (en juego hoy; se revela)
  const shown = matches
    .map((m) => ({ ...m, prediction: predByMatch.get(m.id) ?? null }))
    .map((m) => {
      const lockMs = new Date(m.lock_at).getTime();
      const mode: "bet" | "live" | null =
        m.status === "abierto" && nowMs < lockMs
          ? "bet"
          : nowMs >= lockMs && m.status !== "finalizado"
          ? "live"
          : null;
      return { m, mode };
    })
    .filter((x): x is { m: MatchWithPrediction; mode: "bet" | "live" } =>
      Boolean(x.mode)
    );

  // Distribución de apuestas para los partidos "live" (la RLS solo deja leer
  // las de todos cuando el partido ya cerró, así no hay copia anticipada).
  const liveIds = shown.filter((x) => x.mode === "live").map((x) => x.m.id);
  const charts: Record<number, { home: number; away: number }[]> = {};
  if (liveIds.length) {
    const { data } = await supabase
      .from("predictions")
      .select("match_id, home_score, away_score")
      .in("match_id", liveIds);
    for (const p of (data ?? []) as Prediction[]) {
      (charts[p.match_id] ??= []).push({
        home: p.home_score,
        away: p.away_score,
      });
    }
  }

  // Agrupar por día (hora Chile). Cada día comparte modo (el cierre es por fecha).
  const dayMap = new Map<string, ApuestaDay>();
  for (const { m, mode } of shown) {
    const dp = santiagoDateParts(new Date(m.kickoff_at));
    const key = `${dp.year}-${dp.month}-${dp.day}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        key,
        label: formatCl(m.kickoff_at, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        mode,
        matches: [],
      });
    }
    dayMap.get(key)!.matches.push(m);
  }
  const days = [...dayMap.values()];

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        <p className="text-3xl mb-2">⏳</p>
        <p className="font-semibold text-gray-600">
          No hay partidos abiertos para apostar ahora mismo.
        </p>
        <p className="text-sm mt-1">
          Cada día se abre la jornada siguiente. Mientras tanto, mira el ranking
          en <strong>Resultados</strong> y el calendario en{" "}
          <strong>Mundial</strong>. 👀
        </p>
      </div>
    );
  }

  return <ApuestasCarousel days={days} charts={charts} />;
}
