"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: name.trim() ? { full_name: name.trim() } : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight">⚽ Pollapp</h1>
          <p className="text-sm text-gray-500 mt-1">Polla Mundialera 2026</p>
        </div>

        {status === "sent" ? (
          <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
            <p className="text-2xl mb-2">📧</p>
            <p className="font-semibold text-green-800">¡Revisa tu correo!</p>
            <p className="text-sm text-green-700 mt-2">
              Te enviamos un link a <strong>{email}</strong>. Ábrelo desde este
              mismo dispositivo para entrar.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-green-700 underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solo la primera vez. Así te ven en la tabla.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tu correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Entrar con link mágico"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              No necesitas contraseña. Te llega un link al correo y entras con un
              clic.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
