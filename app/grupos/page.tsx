import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { computeStandings, type MatchResult } from "@/lib/standings";
import { flagFor } from "@/lib/flags";
import type { Team, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const supabase = await createClient();

  const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
    supabase.from("teams").select("*").order("group_label").order("name"),
    supabase
      .from("matches")
      .select("*")
      .eq("phase", "grupos")
      .eq("status", "finalizado"),
  ]);

  const teams = (teamsData ?? []) as Team[];
  const finished = (matchesData ?? []) as Match[];

  const groups = [...new Set(teams.map((t) => t.group_label).filter(Boolean))]
    .sort() as string[];

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Grupos"
        emoji="📊"
        subtitle="Las tablas se arman solas con cada resultado oficial. En verde, los 2 clasificados."
      />

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Aún no se han cargado las selecciones. (Admin: corre fixtures.sql)
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const names = teams
              .filter((t) => t.group_label === g)
              .map((t) => t.name);
            const groupMatches: MatchResult[] = finished
              .filter(
                (m) =>
                  m.group_label === g &&
                  m.home_score !== null &&
                  m.away_score !== null
              )
              .map((m) => ({
                home_team: m.home_team,
                away_team: m.away_team,
                home_score: m.home_score as number,
                away_score: m.away_score as number,
              }));
            const standings = computeStandings(names, groupMatches);

            return (
              <div key={g} className="card overflow-hidden">
                <div className="grad-night text-white px-3 py-2 text-sm font-bold">
                  Grupo {g}
                </div>
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold">
                        Equipo
                      </th>
                      <th className="px-1 py-1.5 w-7 text-center font-semibold">PJ</th>
                      <th className="px-1 py-1.5 w-7 text-center font-semibold">DIF</th>
                      <th className="px-1 py-1.5 w-8 text-center font-bold">
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s) => (
                      <tr
                        key={s.team}
                        className={`border-t border-gray-100 ${
                          s.qualifies ? "bg-green-50" : ""
                        }`}
                      >
                        <td className="px-2 py-1.5 font-medium">
                          <span
                            className={`inline-block w-4 text-xs tabular-nums ${
                              s.qualifies ? "text-pitch font-bold" : "text-gray-400"
                            }`}
                          >
                            {s.rank}
                          </span>
                          <span className="mr-1">{flagFor(s.team)}</span>
                          {s.team}
                        </td>
                        <td className="px-1 py-1.5 text-center text-gray-600 tabular-nums">
                          {s.played}
                        </td>
                        <td className="px-1 py-1.5 text-center text-gray-600 tabular-nums">
                          {s.gd > 0 ? `+${s.gd}` : s.gd}
                        </td>
                        <td className="px-1 py-1.5 text-center font-bold tabular-nums">
                          {s.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
