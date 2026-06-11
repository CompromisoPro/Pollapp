"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"link" | "pass">("link");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      window.location.assign("/partidos");
    }
  }

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
    <main className="flex-1 grad-night relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* destellos de fondo */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8 text-white">
          <div className="flex justify-center mb-3">
            <LogoMark size={64} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Poll<span className="text-amber-300">app</span>
          </h1>
          <p className="text-sm text-white/70 mt-1 font-medium">
            Polla Mundialera 2026 · 🇨🇦🇲🇽🇺🇸
          </p>
        </div>

        {status === "sent" ? (
          <div className="card p-6 text-center">
            <p className="text-3xl mb-2">📧</p>
            <p className="font-bold text-pitch">¡Revisa tu correo!</p>
            <p className="text-sm text-gray-600 mt-2">
              Te enviamos un link a <strong>{email}</strong>. Ábrelo desde este
              mismo dispositivo para entrar.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-brand-600 underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : mode === "pass" ? (
          <form onSubmit={handlePassword} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Tu correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="field w-full px-3 py-2.5 text-sm"
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn btn-primary w-full py-2.5 text-sm"
            >
              {status === "sending" ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("link");
                setStatus("idle");
                setErrorMsg("");
              }}
              className="w-full text-xs text-brand-600 underline"
            >
              ← Volver al link mágico
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                className="field w-full px-3 py-2.5 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solo la primera vez. Así te ven en la tabla.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Tu correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="field w-full px-3 py-2.5 text-sm"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn btn-primary w-full py-2.5 text-sm"
            >
              {status === "sending" ? "Enviando…" : "Entrar con link mágico ✨"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Sin contraseñas. Te llega un link al correo y entras con un clic.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("pass");
                setStatus("idle");
                setErrorMsg("");
              }}
              className="w-full text-xs text-gray-400 underline"
            >
              ¿Problemas con el link? Entrar con contraseña
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
