import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TablaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, points_total, paid")
    .order("points_total", { ascending: false })
    .order("full_name", { ascending: true });

  const rows = (data ?? []) as Pick<
    Profile,
    "id" | "full_name" | "points_total" | "paid"
  >[];

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
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
            {rows.map((r, i) => {
              const isMe = r.id === user?.id;
              return (
                <tr
                  key={r.id}
                  className={`border-t border-gray-100 ${
                    isMe ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-gray-400 font-medium">
                    {medal(i)}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.full_name ?? "Sin nombre"}
                    {isMe && (
                      <span className="ml-1 text-xs text-blue-500">(tú)</span>
                    )}
                    {!r.paid && (
                      <span className="ml-2 text-xs text-amber-500">
                        • pago pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {r.points_total}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-gray-400">
                  Aún no hay jugadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function medal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return String(index + 1);
}
