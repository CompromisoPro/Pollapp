"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/types";
import {
  setPaid,
  setAdmin,
  createPlayer,
  updatePlayer,
} from "@/app/admin/actions";

export default function PlayerAdmin({
  players,
  meId,
}: {
  players: Profile[];
  meId: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const jugadores = players.filter((p) => !p.is_admin);
  const pagados = jugadores.filter((p) => p.paid).length;

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setMsg("");
    start(async () => {
      const res = await createPlayer(fd);
      if ("error" in res) setMsg(res.error);
      else {
        setMsg("✓ Participante creado. Entra con su correo y su RUT como contraseña.");
        form.reset();
      }
    });
  }

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

      {/* Agregar participante */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-gray-500">
          + Agregar participante
        </summary>
        <form
          onSubmit={onCreate}
          className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <input
            name="full_name"
            placeholder="Nombre y apellido"
            className="field px-2 py-1.5 text-sm col-span-2 sm:col-span-1"
          />
          <input
            name="email"
            type="email"
            placeholder="correo@gmail.com"
            className="field px-2 py-1.5 text-sm col-span-2 sm:col-span-1"
          />
          <input
            name="rut"
            placeholder="RUT o contraseña"
            className="field px-2 py-1.5 text-sm"
          />
          <button
            disabled={pending}
            className="btn btn-primary py-1.5 text-sm"
          >
            + Crear
          </button>
          <p className="col-span-2 sm:col-span-4 text-xs text-gray-400">
            Su contraseña será su RUT (o lo que escribas ahí, si no tiene RUT
            válido — mín. 6 caracteres). Queda con pago pendiente.
          </p>
        </form>
      </details>

      {msg && (
        <p
          className={`text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Jugador</th>
              <th className="px-3 py-2 text-right font-semibold w-14">Pts</th>
              <th className="px-3 py-2 text-center font-semibold w-20">Pagó</th>
              <th className="px-3 py-2 text-center font-semibold w-20">Admin</th>
              <th className="px-3 py-2 text-center font-semibold w-12"></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <PlayerRow
                key={p.id}
                p={p}
                meId={meId}
                pending={pending}
                start={start}
                editing={editingId === p.id}
                onToggleEdit={() =>
                  setEditingId(editingId === p.id ? null : p.id)
                }
              />
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
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

function PlayerRow({
  p,
  meId,
  pending,
  start,
  editing,
  onToggleEdit,
}: {
  p: Profile;
  meId: string;
  pending: boolean;
  start: React.TransitionStartFunction;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const [name, setName] = useState(p.full_name ?? "");
  const [email, setEmail] = useState(p.email ?? "");
  const [rut, setRut] = useState(p.rut ?? "");
  const [err, setErr] = useState("");

  function onSave() {
    setErr("");
    start(async () => {
      const res = await updatePlayer(p.id, {
        full_name: name,
        email,
        rut,
      });
      if ("error" in res) setErr(res.error);
      else onToggleEdit();
    });
  }

  return (
    <>
      <tr className="border-t border-gray-100">
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
              p.paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
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
        <td className="px-3 py-2 text-center">
          <button
            onClick={onToggleEdit}
            className="text-gray-400 hover:text-brand-600"
            title="Editar participante"
          >
            ✏️
          </button>
        </td>
      </tr>

      {editing && (
        <tr className="bg-brand-50/50 border-t border-gray-100">
          <td colSpan={5} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-gray-500 flex flex-col">
                Nombre
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field px-2 py-1.5 text-sm w-44"
                />
              </label>
              <label className="text-xs text-gray-500 flex flex-col">
                Correo
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field px-2 py-1.5 text-sm w-56"
                />
              </label>
              <label className="text-xs text-gray-500 flex flex-col">
                RUT o contraseña
                <input
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12345678-9"
                  className="field px-2 py-1.5 text-sm w-36"
                />
              </label>
              <button
                disabled={pending}
                onClick={onSave}
                className="btn btn-success px-3 py-1.5 text-xs"
              >
                💾 Guardar
              </button>
              <button
                onClick={onToggleEdit}
                className="btn btn-ghost px-3 py-1.5 text-xs"
              >
                Cancelar
              </button>
            </div>
            {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Si escribes algo en este campo, esa pasa a ser su contraseña (el
              RUT con guión, o una clave personalizada de mín. 6 caracteres).
              Déjalo igual para no cambiarla.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
