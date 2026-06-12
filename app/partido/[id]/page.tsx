import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import BetChart from "@/components/BetChart";
import { formatCl } from "@/lib/time";
import { scoreLabel } from "@/lib/scoring";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PredRow {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  profiles: { full_name: string | null } | null;
}

export default async function PartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  const match = matchData as Match | null;

  if (!match) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-3 py-10 text-center text-gray-500">
        Partido no encontrado.{" "}
        <Link href="/apuestas" className="text-brand-600 underline">
          Volver
        </Link>
      </main>
    );
  }

  // eslint-disable-next-line react-hooks/purity -- server component: hora del request
  const locked = Date.now() >= new Date(match.lock_at).getTime();
  const finished = match.status === "finalizado" && match.home_score !== null;

  // Apuestas de todos (la RLS solo las devuelve si el partido ya cerró).
  const { data: predData } = await supabase
    .from("predictions")
    .select("user_id, home_score, away_score, points, profiles(full_name)")
    .eq("match_id", matchId);
  const preds = (predData ?? []) as unknown as PredRow[];

  const name = (p: PredRow) => p.profiles?.full_name ?? "";

  if (finished) {
    // Con resultado oficial: por puntos desc, luego nombre.
    preds.sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || name(a).localeCompare(name(b)));
  } else {
    // Sin resultado aún: agrupar por marcador más apostado (espeja el gráfico
    // de arriba). Empate de popularidad -> marcador "menor"; dentro del grupo,
    // alfabético.
    const popularity = new Map<string, number>();
    for (const p of preds) {
      const k = `${p.home_score}-${p.away_score}`;
      popularity.set(k, (popularity.get(k) ?? 0) + 1);
    }
    const key = (p: PredRow) => `${p.home_score}-${p.away_score}`;
    preds.sort((a, b) => {
      const diff = (popularity.get(key(b)) ?? 0) - (popularity.get(key(a)) ?? 0);
      if (diff !== 0) return diff;
      if (key(a) !== key(b)) return key(a).localeCompare(key(b));
      return name(a).localeCompare(name(b));
    });
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-3 py-6">
      <Link
        href="/apuestas"
        className="text-sm text-brand-600 hover:underline"
      >
        ← Volver
      </Link>

      {/* Encabezado del partido */}
      <div className="card p-5 mt-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
          {formatCl(match.kickoff_at)} hrs
        </p>
        <div className="flex items-center justify-center gap-3 mt-2 text-lg font-bold">
          <span className="flex-1 text-right">
            {match.home_team} <Flag team={match.home_team} />
          </span>
          <span className="rounded-lg bg-gray-100 px-3 py-1 text-xl font-black tabular-nums">
            {finished ? `${match.home_score} - ${match.away_score}` : "vs"}
          </span>
          <span className="flex-1 text-left">
            <Flag team={match.away_team} /> {match.away_team}
          </span>
        </div>
        {finished && (
          <p className="text-xs text-pitch font-semibold mt-2">
            Resultado oficial
          </p>
        )}
      </div>

      <h1 className="text-lg font-black mt-6 mb-3">Apuestas de todos</h1>

      {!locked ? (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">🔒</p>
          <p className="font-bold">Las apuestas se revelan al cerrar el plazo</p>
          <p className="text-sm text-gray-500 mt-1">
            Cierra el {formatCl(match.lock_at)} hrs. Para que nadie copie.
          </p>
        </div>
      ) : preds.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          Nadie apostó este partido.
        </div>
      ) : (
        <>
          <div className="card p-4 mb-3">
            <p className="text-xs font-bold text-gray-500 mb-2">
              📊 Marcadores apostados ({preds.length})
            </p>
            <BetChart
              bets={preds.map((p) => ({
                home: p.home_score,
                away: p.away_score,
              }))}
            />
          </div>

          <div className="overflow-hidden card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Jugador</th>
                <th className="px-2 py-2 text-center font-semibold w-16">Apuesta</th>
                {finished && (
                  <>
                    <th className="px-2 py-2 text-left font-semibold">Resultado</th>
                    <th className="px-2 py-2 text-right font-semibold w-12">Pts</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {preds.map((p, i) => {
                const isMe = p.user_id === user?.id;
                // Primer jugador de un grupo de marcador (solo cuando agrupamos
                // por marcador, es decir sin resultado oficial): borde más marcado.
                const prev = preds[i - 1];
                const newGroup =
                  !finished &&
                  i > 0 &&
                  prev &&
                  (prev.home_score !== p.home_score ||
                    prev.away_score !== p.away_score);
                return (
                  <tr
                    key={p.user_id}
                    className={`border-t ${
                      newGroup ? "border-gray-200" : "border-gray-100"
                    } ${isMe ? "bg-brand-50" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium">
                      {p.profiles?.full_name ?? "—"}
                      {isMe && (
                        <span className="ml-1 text-xs text-brand-500">(tú)</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums">
                      {p.home_score}-{p.away_score}
                    </td>
                    {finished && (
                      <>
                        <td className="px-2 py-2 text-xs text-gray-500">
                          {scoreLabel(p.points ?? 0)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span
                            className={`pill ${
                              (p.points ?? 0) > 0
                                ? "pill-pitch"
                                : "pill-mute"
                            }`}
                          >
                            {p.points ?? 0}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </main>
  );
}
