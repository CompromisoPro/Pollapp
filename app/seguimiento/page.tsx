import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { Flag } from "@/components/Flag";
import { formatCl } from "@/lib/time";
import type {
  Match,
  Prediction,
  BonusQuestion,
  BonusAnswer,
  Team,
} from "@/lib/types";

export const dynamic = "force-dynamic";

// Un evento en la línea de tiempo de cómo el jugador acumuló puntos.
interface TimelineItem {
  key: string;
  at: string; // instante para ordenar (ISO)
  type: "match" | "bonus";
  points: number;
  // Datos de partido
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  predHome?: number;
  predAway?: number;
  phase?: string;
  // Datos de bono
  title?: string;
  myAnswer?: unknown;
  officialAnswer?: unknown;
}

export default async function SeguimientoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Partidos finalizados + mi pronóstico ---
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "finalizado")
    .order("kickoff_at", { ascending: true });
  const matches = (matchesData ?? []) as Match[];

  const { data: predData } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user!.id);
  const predByMatch = new Map<number, Prediction>();
  for (const p of (predData ?? []) as Prediction[]) predByMatch.set(p.match_id, p);

  // --- Bonos resueltos + mi respuesta ---
  const { data: bonusQData } = await supabase
    .from("bonus_questions")
    .select("*")
    .not("official_answer", "is", null);
  const bonusQs = (bonusQData ?? []) as BonusQuestion[];

  const { data: bonusAData } = await supabase
    .from("bonus_answers")
    .select("*")
    .eq("user_id", user!.id);
  const ansByQ = new Map<string, BonusAnswer>();
  for (const a of (bonusAData ?? []) as BonusAnswer[]) ansByQ.set(a.question_id, a);

  // Para traducir ids de equipo ('CHI') a nombres en las apuestas de bonos.
  const { data: teamsData } = await supabase.from("teams").select("id, name");
  const teamName = new Map(
    ((teamsData ?? []) as Pick<Team, "id" | "name">[]).map((t) => [t.id, t.name])
  );

  // --- Construir línea de tiempo ---
  const items: TimelineItem[] = [];

  for (const m of matches) {
    const pred = predByMatch.get(m.id);
    if (!pred) continue; // sin pronóstico = no aporta a tu historial
    items.push({
      key: `m${m.id}`,
      at: m.kickoff_at,
      type: "match",
      points: pred.points ?? 0,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeScore: m.home_score,
      awayScore: m.away_score,
      predHome: pred.home_score,
      predAway: pred.away_score,
      phase: m.phase,
    });
  }

  for (const q of bonusQs) {
    const ans = ansByQ.get(q.id);
    if (!ans) continue;
    items.push({
      key: `b${q.id}`,
      at: q.deadline,
      type: "bonus",
      points: ans.points ?? 0,
      title: q.title,
      myAnswer: ans.answer,
      officialAnswer: q.official_answer,
    });
  }

  // Orden cronológico y acumulado corriendo.
  items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  let running = 0;
  const withTotal = items.map((it) => {
    running += it.points;
    return { ...it, total: running };
  });

  const grandTotal = running;

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Seguimiento"
        emoji="📈"
        subtitle="Cómo fuiste acumulando puntos, partido a partido y bono a bono."
      />

      {/* Resumen */}
      <div className="card p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-500">Total acumulado</span>
        <span className="text-2xl font-extrabold text-brand-600">
          {grandTotal} <span className="text-base font-semibold text-gray-500">pts</span>
        </span>
      </div>

      {withTotal.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Todavía no hay partidos finalizados con tus pronósticos. Vuelve cuando
          arranque el Mundial 👀
        </div>
      ) : (
        <ol className="space-y-3">
          {withTotal.map((it) => (
            <li key={it.key} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {it.type === "match" ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-1">
                        {phaseLabel(it.phase!)}
                      </p>
                      <p className="font-semibold leading-tight">
                        <Flag team={it.homeTeam!} /> {it.homeTeam}{" "}
                        <span className="text-gray-500 font-normal">vs</span>{" "}
                        <Flag team={it.awayTeam!} /> {it.awayTeam}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Oficial:{" "}
                        <strong className="text-gray-700">
                          {it.homeScore}-{it.awayScore}
                        </strong>
                        <span className="mx-1.5 text-gray-300">·</span>
                        Tú:{" "}
                        <strong className="text-gray-700">
                          {it.predHome}-{it.predAway}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-1">
                        🎯 Bono
                      </p>
                      <p className="font-semibold leading-tight">{it.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Tú:{" "}
                        <strong className="text-gray-700">
                          {fmtAnswer(it.myAnswer, teamName)}
                        </strong>
                        <span className="mx-1.5 text-gray-300">·</span>
                        Oficial:{" "}
                        <strong className="text-gray-700">
                          {fmtAnswer(it.officialAnswer, teamName)}
                        </strong>
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5">
                    {formatCl(it.at, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`pill ${it.points > 0 ? "pill-pitch" : "pill-mute"}`}
                  >
                    +{it.points}
                  </span>
                  <p className="text-xs text-gray-500 mt-1.5">
                    acum. <strong className="text-gray-700">{it.total}</strong>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

/**
 * Muestra la respuesta de un bono (jsonb) legible: escalar o lista. Si el valor
 * coincide con un id de equipo, lo traduce a su nombre.
 */
function fmtAnswer(v: unknown, teamName: Map<string, string>): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) {
    return v.map((x) => fmtAnswer(x, teamName)).join(", ");
  }
  return teamName.get(String(v)) ?? String(v);
}

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    grupos: "Fase de grupos",
    dieciseisavos: "Dieciseisavos",
    octavos: "Octavos",
    cuartos: "Cuartos",
    semis: "Semifinales",
    tercer: "Tercer lugar",
    final: "Final",
  };
  return map[phase] ?? phase;
}
