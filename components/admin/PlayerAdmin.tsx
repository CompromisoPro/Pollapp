"use client";

import { useTransition } from "react";
import type { Profile } from "@/lib/types";
import { setPaid, setAdmin } from "@/app/admin/actions";

export default function PlayerAdmin({
  players,
  meId,
}: {
  players: Profile[];
  meId: string;
}) {
  const [pending, start] = useTransition();
  const jugadores = players.filter((p) => !p.is_admin);
  const pagados = jugadores.filter((p) => p.paid).length;

  return (
    <div className="space-y-3">
      <div className="card px-4 py-3 flex items-center justify-between text-sm">
        <span className="font-bold">
          💰 Pagaron: {pagados}/{jugadores.length}
        </span>
        {pagados < jugadores.length && (
          <span className="text-xs text-amber-600 font-semibold">
            faltan {jugadores.length - pagados}
          </span>
        )}
      </div>

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Jugador</th>
            <th className="px-3 py-2 text-right font-semibold w-16">Pts</th>
            <th className="px-3 py-2 text-center font-semibold w-24">Pagó</th>
            <th className="px-3 py-2 text-center font-semibold w-24">Admin</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-3 py-2">
                <div className="font-medium">{p.full_name ?? "—"}</div>
                <div className="text-xs text-gray-400">{p.email}</div>
              </td>
              <td className="px-3 py-2 text-right font-bold">{p.points_total}</td>
              <td className="px-3 py-2 text-center">
                <button
                  disabled={pending}
                  onClick={() => start(() => setPaid(p.id, !p.paid).then(() => {}))}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.paid
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.paid ? "✓ Sí" : "No"}
                </button>
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  disabled={pending || p.id === meId}
                  onClick={() =>
                    start(() => setAdmin(p.id, !p.is_admin).then(() => {}))
                  }
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold disabled:opacity-50 ${
                    p.is_admin
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                  title={p.id === meId ? "No puedes quitarte admin a ti mismo" : ""}
                >
                  {p.is_admin ? "✓ Sí" : "No"}
                </button>
              </td>
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                Aún no hay jugadores registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
