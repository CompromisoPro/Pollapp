import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GanadoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("score_breakdown")
    .select("full_name, points_total")
    .order("points_total", { ascending: false })
    .limit(3);
  const top = (data ?? []) as { full_name: string | null; points_total: number }[];
  const [first, second, third] = top;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden text-white">
      {/* FOTO DE FONDO: reemplaza public/ganadores-fondo.jpg por la que tú quieras. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ganadores-fondo.jpg')" }}
      />
      {/* Velo oscuro para que se lea el texto encima de cualquier foto. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">
          Polla Mundialera 2026
        </p>
        <h1 className="mt-1 text-center text-3xl font-black drop-shadow sm:text-4xl">
          🏆 Los Ganadores 🏆
        </h1>
        <p className="mt-2 text-center text-sm text-white/70">
          Se acabó el Mundial. Estos son los cracks… y los otros 😅
        </p>

        {/* Podio */}
        {first ? (
          <div className="mt-8">
            <div className="mx-auto max-w-sm rounded-2xl border border-amber-300/40 bg-white/10 p-6 text-center backdrop-blur-sm shadow-lg">
              <p className="text-6xl">🥇</p>
              <p className="mt-2 text-2xl font-black">{first.full_name ?? "—"}</p>
              <p className="font-bold text-amber-300">
                {first.points_total} pts · CAMPEÓN 👑
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {second && (
                <Podio medal="🥈" name={second.full_name} pts={second.points_total} />
              )}
              {third && (
                <Podio medal="🥉" name={third.full_name} pts={third.points_total} />
              )}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-center text-white/60">Aún no hay tabla que mostrar.</p>
        )}

        {/* Premios especiales (el hueveo de la polla) */}
        <h2 className="mt-12 text-center text-lg font-black">🎖️ Premios Especiales</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Award
            emoji="🕳️"
            title="Los Desaparecidos"
            text="NADIE le achuntó a Rodri (Mejor Jugador) ni a Ferran Torres (goleador de la Final). Se los tragó la tierra."
          />
          <Award
            emoji="🦟"
            title="Balón de Mosquito"
            text="Para el fenómeno que escribió “Mosquito Dembélé”. Un grande."
          />
          <Award
            emoji="🎤"
            title="Kiki, do you love me?"
            text="Alguien puso “kiki do you love me (kylian mbappe)”. Sí, contó. Sí, te vimos. 👀"
          />
          <Award
            emoji="✍️"
            title="Muro de la Vergüenza"
            text="cuortois · thibaut curtois · bruno fernández… el diccionario pidió licencia."
          />
        </div>

        <p className="mt-12 text-center text-xs text-white/45">
          Hecho con puro hueveo para la polla · Mundial 2026 🇨🇱
        </p>
        <div className="mt-5 text-center">
          <Link href="/resultados" className="text-sm text-amber-300 hover:underline">
            ← Volver a la tabla
          </Link>
        </div>
      </div>
    </main>
  );
}

function Podio({
  medal,
  name,
  pts,
}: {
  medal: string;
  name: string | null;
  pts: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm">
      <p className="text-3xl">{medal}</p>
      <p className="mt-1 font-bold leading-tight">{name ?? "—"}</p>
      <p className="text-sm text-white/70">{pts} pts</p>
    </div>
  );
}

function Award({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1 font-bold text-amber-200">{title}</p>
      <p className="mt-0.5 text-sm text-white/75">{text}</p>
    </div>
  );
}
