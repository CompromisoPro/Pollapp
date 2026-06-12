"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buscarCorreoPorRut } from "@/app/login/actions";
import { canonicalRut } from "@/lib/rut";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rut, setRut] = useState("");
  const [foundEmail, setFoundEmail] = useState("");
  const [mode, setMode] = useState<"pass" | "forgot">("pass");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const mail = email.trim();

    // 1er intento: la contraseña tal cual la escribió.
    let { error } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
    });

    // 2do intento: si parece un RUT, normalizarlo (puntos, sin guion, K min/may).
    if (error) {
      const canon = canonicalRut(password);
      if (canon && canon !== password) {
        const retry = await supabase.auth.signInWithPassword({
          email: mail,
          password: canon,
        });
        error = retry.error;
      }
    }

    if (error) {
      setStatus("error");
      setErrorMsg("Correo o contraseña incorrectos. Tu contraseña es tu RUT.");
    } else {
      // Pedirle explícitamente al navegador que ofrezca guardar la credencial
      // (Credential Management API: Chrome/Edge/Android). En una app moderna
      // sin recarga clásica, las heurísticas a veces no saltan solas; esto es
      // el método oficial. Safari no la soporta: usa sus propias heurísticas.
      try {
        type PCCtor = new (data: { id: string; password: string }) => Credential;
        const PC = (window as { PasswordCredential?: PCCtor }).PasswordCredential;
        if (PC && navigator.credentials?.store) {
          await navigator.credentials.store(new PC({ id: mail, password }));
        }
      } catch {
        // mejora opcional: si falla, seguimos igual
      }
      window.location.assign("/apuestas");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    setFoundEmail("");
    const res = await buscarCorreoPorRut(rut);
    if ("error" in res) {
      setStatus("error");
      setErrorMsg(res.error);
    } else {
      setStatus("idle");
      setFoundEmail(res.email);
    }
  }

  return (
    <main className="flex-1 relative overflow-hidden flex items-center justify-center px-4 py-12 bg-[#5B21B6]">
      {/* Bloques de color estilo Mundial 26 */}
      <div className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 rounded-[5rem] bg-[#E4002B] rotate-12" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-[40%] bg-[#00A859] -rotate-6" />
      <div className="pointer-events-none absolute top-1/4 -left-16 h-40 w-40 rounded-full bg-[#F59E0B]/90" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-[#7C3AED]" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8 text-white">
          <div className="flex justify-center mb-4">
            {/* Emblema oficial Mundial 2026 — uso de fans, grupo privado */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mundial26.svg"
              alt="Mundial 2026"
              className="h-36 w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Poll<span className="text-amber-300">app</span>
          </h1>
          <p className="text-sm text-white/80 mt-1 font-medium">
            Polla Mundialera 2026 ⚽
          </p>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Tu RUT</label>
              <input
                type="text"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="12.345.678-9"
                className="field w-full px-3 py-2.5 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Con tu RUT te mostramos el correo con el que estás inscrito.
              </p>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            {foundEmail ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
                <p className="text-gray-600">Tu correo registrado es:</p>
                <p className="font-bold text-pitch break-all">{foundEmail}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(foundEmail);
                    setMode("pass");
                    setFoundEmail("");
                    setStatus("idle");
                  }}
                  className="btn btn-primary w-full py-2 text-xs mt-2"
                >
                  Usar este correo para entrar →
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn btn-primary w-full py-2.5 text-sm"
              >
                {status === "sending" ? "Buscando…" : "Ver mi correo"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMode("pass");
                setStatus("idle");
                setErrorMsg("");
                setFoundEmail("");
              }}
              className="w-full text-xs text-brand-600 underline"
            >
              ← Volver
            </button>
          </form>
        ) : (
          <form onSubmit={handlePassword} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Tu correo
              </label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Contraseña (tu RUT)
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="12345678-9"
                  className="field w-full px-3 py-2.5 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tu contraseña es tu RUT con guión (ej. 12345678-9).
              </p>
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
                setMode("forgot");
                setStatus("idle");
                setErrorMsg("");
              }}
              className="w-full text-xs text-gray-500 underline"
            >
              ¿Olvidaste con qué correo te inscribiste? Búscalo con tu RUT
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
