import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import { formatCl, santiagoDateParts } from "@/lib/time";
import type { Match } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

/** Duración estimada de un partido (90' + descanso + adición). */
const MATCH_MS = 130 * 60 * 1000;

export default async function EnVivoPage() {
  const supabase = await createClient();

  // eslint-disable-next-line react-hooks/purity -- server component: hora del request
  const now = Date.now();
  const today = santiagoDateParts(new Date(now));

  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  // Partidos de HOY (día calendario de Chile).
  const todayMatches = ((data ?? []) as Match[]).filter((m) => {
    const d = santiagoDateParts(new Date(m.kickoff_at));
    return d.year === today.year && d.month === today.month && d.day === today.day;
  });

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Los partidos de hoy, hora de Chile. El marcador en vivo lo ves con un
        toque; el <strong>resultado oficial</strong> (el que da puntos) lo carga
        el admin al final del partido.
      </p>

      {todayMatches.length === 0 ? (
        <EmptyState emoji="😴" title="Hoy no hay partidos">
          Revisa el fixture para ver los próximos.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {todayMatches.map((m) => (
            <LiveRow key={m.id} match={m} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveRow({ match: m, now }: { match: Match; now: number }) {
  const ko = new Date(m.kickoff_at).getTime();
  const finished = m.status === "finalizado" && m.home_score !== null;
  const live = !finished && now >= ko && now < ko + MATCH_MS;
  const upcoming = now < ko;

  const query = encodeURIComponent(`${m.home_team} vs ${m.away_team}`);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
            <span className="dot-live" /> En juego
          </span>
        ) : finished ? (
          <StatusBadge status="finalizado" />
        ) : upcoming ? (
          <span className="pill pill-mute">
            Hoy {formatCl(m.kickoff_at, { hour: "2-digit", minute: "2-digit" })} hrs
          </span>
        ) : (
          <span className="pill pill-mute">Por confirmar resultado</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 text-base font-bold">
        <span className="flex-1 text-right">
          {m.home_team} <Flag team={m.home_team} />
        </span>
        <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 font-black tabular-nums">
          {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
        </span>
        <span className="flex-1 text-left">
          <Flag team={m.away_team} /> {m.away_team}
        </span>
      </div>

      {!finished && !upcoming && (
        <div className="mt-3 text-center">
          <a
            href={`https://www.google.com/search?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary px-4 py-1.5 text-xs"
          >
            🔴 Ver marcador en vivo
          </a>
        </div>
      )}
    </div>
  );
}
