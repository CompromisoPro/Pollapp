import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Una fila del desglose de puntos (vista score_breakdown).
interface Breakdown {
  user_id: string;
  full_name: string | null;
  paid: boolean;
  points_total: number;
  pts_exacto: number;
  pts_diferencia: number;
  pts_ganador: number;
  pts_bonos: number;
}

export default async function TablaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("score_breakdown")
    .select("*")
    .order("points_total", { ascending: false })
    .order("full_name", { ascending: true });

  const rows = (data ?? []) as Breakdown[];

  // Posición con empates: mismo puntaje => misma posición (estilo "1, 2, 2, 4").
  // 1 + cantidad de jugadores con MÁS puntos (ranking de competición estándar).
  const ranked = rows.map((r) => ({
    ...r,
    rank: rows.filter((x) => x.points_total > r.points_total).length + 1,
  }));

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        Cada marcador suma por escalones: acertar al{" "}
        <strong className="text-gray-700">ganador</strong> da 1 pt, la{" "}
        <strong className="text-gray-700">diferencia</strong> 1 más y el{" "}
        <strong className="text-gray-700">resultado exacto</strong> otro más.
      </p>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-10">#</th>
              <th className="px-3 py-2 text-left font-semibold">Jugador</th>
              <th className="px-1.5 py-2 text-center font-semibold w-9" title="Ganador">
                Gan
              </th>
              <th className="px-1.5 py-2 text-center font-semibold w-9" title="Diferencia">
                Dif
              </th>
              <th className="px-1.5 py-2 text-center font-semibold w-9" title="Marcador exacto">
                Exa
              </th>
              <th className="px-1.5 py-2 text-center font-semibold w-9" title="Bonos">
                Bon
              </th>
              <th className="px-3 py-2 text-right font-bold w-14">Total</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => {
              const isMe = r.user_id === user?.id;
              return (
                <tr
                  key={r.user_id}
                  className={`border-t border-gray-100 ${isMe ? "bg-brand-50" : ""}`}
                >
                  <td className="px-3 py-2 text-gray-500 font-medium tabular-nums">
                    {medal(r.rank)}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.full_name ?? "Sin nombre"}
                    {isMe && (
                      <span className="ml-1 text-xs text-brand-600">(tú)</span>
                    )}
                    {!r.paid && (
                      <span className="ml-2 text-xs text-amber-600">
                        • pago pendiente
                      </span>
                    )}
                  </td>
                  <Cell value={r.pts_ganador} />
                  <Cell value={r.pts_diferencia} />
                  <Cell value={r.pts_exacto} />
                  <Cell value={r.pts_bonos} accent />
                  <td className="px-3 py-2 text-right font-extrabold tabular-nums text-brand-700">
                    {r.points_total}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-gray-500">
                  Aún no hay jugadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Cell({ value, accent }: { value: number; accent?: boolean }) {
  return (
    <td
      className={`px-1.5 py-2 text-center tabular-nums ${
        value > 0
          ? accent
            ? "text-gold-dark font-semibold"
            : "text-gray-700"
          : "text-gray-300"
      }`}
    >
      {value}
    </td>
  );
}

function medal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}
