import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import { formatCl } from "@/lib/time";
import EmptyState from "@/components/ui/EmptyState";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const PHASE_LABEL: Record<string, string> = {
  grupos: "Fase de grupos",
  dieciseisavos: "Dieciseisavos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semifinales",
  tercer: "Tercer lugar",
  final: "Final",
};

export default async function FixturePage() {
  const supabase = await createClient();

  // La RLS oculta los partidos en estado 'oculto'.
  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });
  const matches = (data ?? []) as Match[];

  // Agrupar por día (hora Chile), preservando el orden cronológico.
  const days = new Map<string, Match[]>();
  for (const m of matches) {
    const key = formatCl(m.kickoff_at, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(m);
  }

  return matches.length === 0 ? (
    <EmptyState emoji="⚽" title="Todavía no hay partidos disponibles.">
      Vuelve pronto. 👀
    </EmptyState>
  ) : (
    <div className="space-y-8">
      {[...days.entries()].map(([day, dayMatches]) => (
        <section key={day}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 capitalize">
            {day}
          </h2>
          <div className="card divide-y divide-gray-100">
            {dayMatches.map((m) => (
              <FixtureRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FixtureRow({ match: m }: { match: Match }) {
  const finished = m.status === "finalizado" && m.home_score !== null;
  // eslint-disable-next-line react-hooks/purity -- server component: hora del request
  const locked = Date.now() >= new Date(m.lock_at).getTime();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Fase + hora */}
      <div className="w-20 shrink-0 text-xs text-gray-500">
        <p className="font-bold uppercase tracking-wide text-brand-600 leading-tight">
          {PHASE_LABEL[m.phase] ?? m.phase}
        </p>
        <p className="mt-0.5 tabular-nums">
          {formatCl(m.kickoff_at, { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Equipos + marcador */}
      <div className="flex flex-1 items-center justify-center gap-2 text-sm">
        <span className="flex-1 text-right font-semibold">
          {m.home_team} <Flag team={m.home_team} />
        </span>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 font-extrabold tabular-nums ${
            finished ? "bg-gray-100 text-ink" : "text-gray-300"
          }`}
        >
          {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
        </span>
        <span className="flex-1 text-left font-semibold">
          <Flag team={m.away_team} /> {m.away_team}
        </span>
      </div>

      {/* Ver apuestas: solo cuando ya cerró el plazo */}
      <div className="w-8 shrink-0 text-center">
        {locked && (
          <Link
            href={`/partido/${m.id}`}
            title="Ver apuestas de todos"
            className="text-base hover:scale-110 inline-block"
          >
            👀
          </Link>
        )}
      </div>
    </div>
  );
}
