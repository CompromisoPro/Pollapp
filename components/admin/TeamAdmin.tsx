"use client";

import { useState, useTransition } from "react";
import type { Team } from "@/lib/types";
import { addTeam, deleteTeam } from "@/app/admin/actions";

export default function TeamAdmin({ teams }: { teams: Team[] }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await addTeam(fd);
      if ("error" in res) setMsg(res.error);
      else {
        setMsg("✓ Selección guardada.");
        form.reset();
      }
    });
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={onAdd}
        className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-end gap-2"
      >
        <label className="text-xs text-gray-500 flex flex-col">
          Código
          <input
            name="id"
            placeholder="CHI"
            maxLength={4}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm uppercase"
          />
        </label>
        <label className="text-xs text-gray-500 flex flex-col">
          Nombre
          <input
            name="name"
            placeholder="Chile"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500 flex flex-col">
          Grupo
          <input
            name="group_label"
            placeholder="A"
            maxLength={1}
            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm uppercase"
          />
        </label>
        <button
          disabled={pending}
          className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          + Agregar
        </button>
      </form>

      {msg && (
        <p
          className={`text-xs ${
            msg.startsWith("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}

      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-sm"
            >
              <strong>{t.name}</strong>
              {t.group_label && (
                <span className="text-xs text-gray-400">G{t.group_label}</span>
              )}
              <button
                onClick={() => start(() => deleteTeam(t.id).then(() => {}))}
                className="text-red-400 hover:text-red-600 ml-1"
                title="Borrar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
