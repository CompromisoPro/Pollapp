import NavBar from "@/components/NavBar";
import MatchCard from "@/components/MatchCard";
import BonusCard from "@/components/BonusCard";
import PageHeader from "@/components/PageHeader";
import { computeStandings, type MatchResult } from "@/lib/standings";
import type {
  MatchWithPrediction,
  BonusQuestion,
  BonusAnswer,
  Team,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * VISTA PREVIA (temporal): muestra las pantallas con datos de ejemplo, sin
 * login ni base de datos. Sirve para ver el diseño antes de configurar Supabase.
 * Borrar este archivo (y la línea /demo en lib/supabase/proxy.ts) cuando ya no
 * se necesite. Los botones "Guardar" no funcionan aquí (no hay base de datos).
 */

const FUTURO = "2026-07-01T20:00:00Z";
const CIERRE_FUTURO = "2026-06-30T03:59:00Z";
const PASADO_CIERRE = "2026-06-08T03:59:00Z";

const partidos: MatchWithPrediction[] = [
  {
    id: 1,
    phase: "grupos",
    group_label: "A",
    home_team: "Chile",
    away_team: "Argentina",
    kickoff_at: FUTURO,
    lock_at: CIERRE_FUTURO,
    home_score: null,
    away_score: null,
    status: "abierto",
    created_at: FUTURO,
    prediction: null,
  },
  {
    id: 2,
    phase: "grupos",
    group_label: "A",
    home_team: "Brasil",
    away_team: "Uruguay",
    kickoff_at: FUTURO,
    lock_at: CIERRE_FUTURO,
    home_score: null,
    away_score: null,
    status: "abierto",
    created_at: FUTURO,
    prediction: {
      id: 10,
      user_id: "demo",
      match_id: 2,
      home_score: 2,
      away_score: 1,
      points: null,
      created_at: FUTURO,
      updated_at: FUTURO,
    },
  },
  {
    id: 3,
    phase: "grupos",
    group_label: "A",
    home_team: "España",
    away_team: "Alemania",
    kickoff_at: "2026-06-09T20:00:00Z",
    lock_at: PASADO_CIERRE,
    home_score: 1,
    away_score: 1,
    status: "finalizado",
    created_at: FUTURO,
    prediction: {
      id: 11,
      user_id: "demo",
      match_id: 3,
      home_score: 1,
      away_score: 1,
      points: 3,
      created_at: FUTURO,
      updated_at: FUTURO,
    },
  },
];

const teams: Team[] = [
  { id: "ARG", name: "Argentina", group_label: "A" },
  { id: "BRA", name: "Brasil", group_label: "A" },
  { id: "FRA", name: "Francia", group_label: "A" },
  { id: "ESP", name: "España", group_label: "A" },
];

const bonos: { q: BonusQuestion; a: BonusAnswer | null }[] = [
  {
    q: {
      id: "goleador",
      phase: "especial",
      kind: "player",
      title: "Goleador del Mundial (Bota de Oro)",
      description: "Jugador que será el máximo goleador.",
      group_label: null,
      max_points: 6,
      deadline: CIERRE_FUTURO,
      official_answer: null,
      sort: 1,
    },
    a: null,
  },
  {
    q: {
      id: "alargues",
      phase: "octavos",
      kind: "number",
      title: "Partidos a alargue en Octavos",
      description: "Cuántos partidos terminarán en alargue (0 a 8).",
      group_label: null,
      max_points: 3,
      deadline: CIERRE_FUTURO,
      official_answer: null,
      sort: 2,
    },
    a: {
      id: 1,
      user_id: "demo",
      question_id: "alargues",
      answer: 3,
      points: null,
      created_at: FUTURO,
      updated_at: FUTURO,
    },
  },
  {
    q: {
      id: "finalistas",
      phase: "especial",
      kind: "finalists",
      title: "Dúo de Finalistas",
      description: "Las dos selecciones que jugarán la final.",
      group_label: null,
      max_points: 6,
      deadline: CIERRE_FUTURO,
      official_answer: null,
      sort: 3,
    },
    a: null,
  },
];

const grupoAResultados: MatchResult[] = [
  { home_team: "Mexico", away_team: "South Africa", home_score: 2, away_score: 0 },
  { home_team: "South Korea", away_team: "Czechia", home_score: 1, away_score: 1 },
  { home_team: "Czechia", away_team: "South Africa", home_score: 0, away_score: 1 },
  { home_team: "Mexico", away_team: "South Korea", home_score: 1, away_score: 1 },
  { home_team: "Czechia", away_team: "Mexico", home_score: 0, away_score: 3 },
  { home_team: "South Africa", away_team: "South Korea", home_score: 2, away_score: 2 },
];
const grupoA = computeStandings(
  ["Mexico", "South Africa", "South Korea", "Czechia"],
  grupoAResultados
);

const tabla = [
  { name: "Magdalena H.", pts: 41, paid: true },
  { name: "Andy C.", pts: 38, paid: true },
  { name: "Sebastián R.", pts: 35, paid: true },
  { name: "Carolina M.", pts: 29, paid: false },
  { name: "Tú", pts: 26, paid: true },
];

export default function DemoPage() {
  return (
    <>
      <NavBar isAdmin points={26} />

      <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          👀 <strong>Vista previa con datos de ejemplo.</strong> No hay base de
          datos conectada, así que los botones «Guardar» no funcionan aquí. Es
          solo para ver el diseño.
        </div>

        {/* PARTIDOS */}
        <PageHeader
          title="Partidos"
          emoji="⚽"
          subtitle="Pon tu marcador. Cierra a las 23:59 (Chile) del día anterior."
        />
        <div className="space-y-3 mb-10">
          {partidos.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

        {/* BONOS */}
        <PageHeader
          title="Bonos"
          emoji="🎯"
          subtitle="Pronósticos especiales por fase, cada uno con su fecha de cierre."
        />
        <div className="space-y-3 mb-10">
          {bonos.map(({ q, a }) => (
            <BonusCard key={q.id} question={q} answer={a} teams={teams} />
          ))}
        </div>

        {/* GRUPOS */}
        <PageHeader
          title="Grupos"
          emoji="📊"
          subtitle="Las tablas se arman solas con cada resultado. En verde, los 2 clasificados."
        />
        <div className="card overflow-hidden mb-10 max-w-xs">
          <div className="grad-night text-white px-3 py-2 text-sm font-bold">
            Grupo A
          </div>
          <table className="w-full text-sm">
            <thead className="text-gray-400 text-xs">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Equipo</th>
                <th className="px-1 py-1.5 w-7 text-center">PJ</th>
                <th className="px-1 py-1.5 w-7 text-center">DIF</th>
                <th className="px-1 py-1.5 w-8 text-center font-bold">PTS</th>
              </tr>
            </thead>
            <tbody>
              {grupoA.map((s) => (
                <tr
                  key={s.team}
                  className={`border-t border-gray-100 ${
                    s.qualifies ? "bg-green-50" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 font-medium">
                    <span
                      className={`inline-block w-4 text-xs ${
                        s.qualifies ? "text-pitch font-bold" : "text-gray-300"
                      }`}
                    >
                      {s.rank}
                    </span>
                    {s.team}
                  </td>
                  <td className="px-1 py-1.5 text-center text-gray-500">
                    {s.played}
                  </td>
                  <td className="px-1 py-1.5 text-center text-gray-500">
                    {s.gd > 0 ? `+${s.gd}` : s.gd}
                  </td>
                  <td className="px-1 py-1.5 text-center font-bold">
                    {s.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLA */}
        <PageHeader
          title="Tabla de posiciones"
          emoji="🏆"
          subtitle="Ranking por puntaje acumulado (marcadores + bonos)."
        />
        <div className="overflow-hidden card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-semibold w-10">#</th>
                <th className="px-3 py-2 text-left font-semibold">Jugador</th>
                <th className="px-3 py-2 text-right font-semibold w-20">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((r, i) => (
                <tr
                  key={r.name}
                  className={`border-t border-gray-100 ${
                    r.name === "Tú" ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-gray-400 font-medium">
                    {["🥇", "🥈", "🥉"][i] ?? i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.name}
                    {!r.paid && (
                      <span className="ml-2 text-xs text-amber-500">
                        • pago pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
