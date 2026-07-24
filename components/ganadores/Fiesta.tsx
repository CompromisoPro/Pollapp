"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Winner = { full_name: string | null; points_total: number };

/**
 * Escena de "Los ganadores": fuegos artificiales + nieve (canvas), refugio y
 * montañas (SVG), helicóptero con foco, gente buscando con linternas y el
 * podio con los nombres reales. Todo animado en código (sin imágenes).
 *
 * Rendimiento: los fuegos usan sprites de brillo pre-renderizados (nada de
 * shadowBlur, que es carísimo por frame) y nada que vaya SOBRE el canvas usa
 * backdrop-blur. Respeta `prefers-reduced-motion` (escena estática).
 */
export default function Fiesta({ winners }: { winners: Winner[] }) {
  const [first, second, third] = winners;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const colors = [
      "#f43f5e", "#fb7185", "#f59e0b", "#facc15", "#22d3ee",
      "#38bdf8", "#a855f7", "#c084fc", "#22c55e", "#ec4899",
    ];

    // Un sprite de brillo por color (radial: núcleo blanco -> color -> transparente).
    // Dibujar con drawImage + composición "lighter" da el glow sin shadowBlur.
    const spriteFor = (color: string) => {
      const s = document.createElement("canvas");
      s.width = 32;
      s.height = 32;
      const c = s.getContext("2d");
      if (c) {
        const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.2, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(16, 16, 16, 0, 6.283);
        c.fill();
      }
      return s;
    };
    const sprites = colors.map(spriteFor);
    const pickSprite = () => sprites[(Math.random() * sprites.length) | 0];

    type Sprite = HTMLCanvasElement;
    type Rocket = { x: number; y: number; vx: number; vy: number; sprite: Sprite; target: number };
    type Part = { x: number; y: number; vx: number; vy: number; sprite: Sprite; life: number; decay: number };
    type Flake = { x: number; y: number; vy: number; r: number; a: number; o: number };
    let rockets: Rocket[] = [];
    let parts: Part[] = [];
    let flakes: Flake[] = [];
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = Array.from({ length: 60 }, () => ({
        x: rand(0, W), y: rand(0, H), vy: rand(0.4, 1.4),
        r: rand(0.6, 2.2), a: rand(0.3, 0.9), o: rand(0, 6.28),
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const launch = () => {
      rockets.push({
        x: rand(W * 0.12, W * 0.88), y: H + 4,
        vx: rand(-0.5, 0.5), vy: -rand(6, 9.5),
        sprite: pickSprite(), target: rand(H * 0.1, H * 0.45),
      });
    };
    const explode = (r: Rocket) => {
      const n = 34 + ((Math.random() * 24) | 0);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const sp = rand(1.4, 5.6);
        parts.push({
          x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          sprite: r.sprite, life: 1, decay: rand(0.008, 0.02),
        });
      }
    };

    const drawSnow = () => {
      ctx.fillStyle = "#ffffff";
      for (const f of flakes) {
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // Modo reducido: escena estática (nieve + unas explosiones) y listo.
    if (reduce) {
      ctx.clearRect(0, 0, W, H);
      drawSnow();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 5; k++) {
        const cx = rand(W * 0.15, W * 0.85);
        const cy = rand(H * 0.15, H * 0.5);
        const sprite = pickSprite();
        for (let i = 0; i < 34; i++) {
          const a = (Math.PI * 2 * i) / 34;
          const d = rand(12, 60);
          ctx.globalAlpha = rand(0.3, 0.9);
          ctx.drawImage(sprite, cx + Math.cos(a) * d - 6, cy + Math.sin(a) * d - 6, 12, 12);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      return () => window.removeEventListener("resize", resize);
    }

    let raf = 0;
    let last = 0;
    let acc = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);

      // Nieve
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(t / 1000 + f.o) * 0.3;
        if (f.y > H + 3) {
          f.y = -3;
          f.x = rand(0, W);
        }
      }
      drawSnow();

      // Lanzar cohetes cada ~680ms
      if (!last) last = t;
      acc += t - last;
      last = t;
      if (acc > 680) {
        acc = 0;
        launch();
        if (Math.random() < 0.4) launch();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.08;
        ctx.globalAlpha = 1;
        ctx.drawImage(r.sprite, r.x - 5, r.y - 5, 10, 10);
        if (r.vy >= 0 || r.y <= r.target) {
          explode(r);
          rockets.splice(i, 1);
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.045;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        const sz = 14 * (0.35 + 0.65 * p.life);
        ctx.globalAlpha = p.life;
        ctx.drawImage(p.sprite, p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <main className="relative overflow-hidden bg-[#070a1f] text-white">
      <style>{CSS}</style>

      {/* ===================== ESCENA (hero animado) ===================== */}
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-10">
        {/* Cielo nocturno */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#1b1145] via-[#3b1d6e] to-[#0b1437]" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(60rem 40rem at 50% -10%, rgba(168,85,247,0.35), transparent 60%)" }}
        />

        {/* Fuegos artificiales + nieve */}
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 z-[2] h-full w-full" />

        {/* Montañas + refugio + araucarias */}
        <Scenery />

        {/* Gente buscando con linternas (guiño) */}
        <SearchParty />

        {/* Guerra de bolas de nieve entre cracks */}
        <SnowballFight />

        {/* Helicóptero de rescate con foco */}
        <Heli />

        {/* Contenido */}
        <div className="relative z-20 w-full max-w-3xl text-center">
          <p className="gz-rise text-[11px] font-black uppercase tracking-[0.35em] text-amber-300" style={{ animationDelay: "0.05s" }}>
            Polla Mundialera 2026
          </p>
          <h1 className="gz-rise gz-title mt-2 text-4xl font-black leading-[0.95] sm:text-6xl" style={{ animationDelay: "0.15s" }}>
            LOS REYES<br />DE LA POLLA
          </h1>
          <p className="gz-rise mt-3 text-sm text-white/75 sm:text-base" style={{ animationDelay: "0.25s" }}>
            Tres cracks, un Mundial y un podio en los Andes 🏔️
          </p>

          {/* Podio */}
          {first ? (
            <div className="mt-10 flex items-end justify-center gap-2 sm:gap-4">
              <PodiumCol place={2} medal="🥈" w={second} h="h-28 sm:h-36" delay="0.5s" />
              <PodiumCol place={1} medal="🥇" w={first} h="h-40 sm:h-52" champion delay="0.35s" />
              <PodiumCol place={3} medal="🥉" w={third} h="h-20 sm:h-28" delay="0.65s" />
            </div>
          ) : (
            <p className="mt-10 text-white/60">Aún no hay tabla que mostrar.</p>
          )}

          {/* Botellas de pisco */}
          <div className="mt-5 flex justify-center gap-4 text-3xl">
            <span className="gz-float inline-block" style={{ animationDelay: "0s" }}>🍾</span>
            <span className="gz-float inline-block" style={{ animationDelay: "0.4s" }}>🥃</span>
            <span className="gz-float inline-block" style={{ animationDelay: "0.8s" }}>🍾</span>
          </div>

          {/* CTA principal */}
          <div className="gz-rise mt-7 flex justify-center" style={{ animationDelay: "0.9s" }}>
            <Link
              href="/resultados"
              className="rounded-full bg-white px-7 py-3 text-sm font-black text-[#3b1d6e] shadow-xl shadow-black/30 transition hover:scale-105"
            >
              📊 Ver resultados
            </Link>
          </div>

          <p className="gz-rise mt-5 text-[11px] uppercase tracking-widest text-white/40" style={{ animationDelay: "1.05s" }}>
            ▼ sigue el hueveo ▼
          </p>
        </div>
      </section>

      {/* ===================== POST-FIESTA ===================== */}
      <section className="relative z-10 mx-auto max-w-2xl px-4 py-14">
        <TicketGag />

        <h2 className="mt-14 text-center text-lg font-black">🎖️ Premios Especiales</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Award
            grad="from-fuchsia-500/20 to-purple-600/10 border-fuchsia-400/40"
            emoji="🕳️"
            title="Los Desaparecidos"
            text="NADIE le achuntó a Rodri (Mejor Jugador) ni a Ferran Torres (goleador de la Final). Se los tragó la cordillera."
          />
          <Award
            grad="from-emerald-500/20 to-teal-600/10 border-emerald-400/40"
            emoji="🦟"
            title="Balón de Mosquito"
            text="Para el fenómeno que escribió “Mosquito Dembélé”. Un grande."
          />
          <Award
            grad="from-sky-500/20 to-blue-600/10 border-sky-400/40"
            emoji="🎤"
            title="Kiki, do you love me?"
            text="Alguien puso “kiki do you love me (kylian mbappe)”. Sí, contó. Sí, te vimos. 👀"
          />
          <Award
            grad="from-amber-500/20 to-orange-600/10 border-amber-400/40"
            emoji="✍️"
            title="Muro de la Vergüenza"
            text="cuortois · thibaut curtois · bruno fernández… el diccionario pidió licencia."
          />
        </div>

        <p className="mt-12 text-center text-xs text-white/45">
          Hecho con puro hueveo para la polla · Mundial 2026 🇨🇱
        </p>
        <div className="mt-5 text-center">
          <Link href="/resultados" className="text-sm font-semibold text-amber-300 hover:underline">
            ← Volver a la tabla
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ------------------------- Sub-componentes ------------------------- */

function PodiumCol({
  place,
  medal,
  w,
  h,
  champion,
  delay,
}: {
  place: number;
  medal: string;
  w?: Winner;
  h: string;
  champion?: boolean;
  delay: string;
}) {
  return (
    <div className="gz-pop flex w-24 flex-col items-center sm:w-32" style={{ animationDelay: delay }}>
      {champion && <span className="mb-0.5 text-2xl">👑</span>}
      <span className="text-3xl sm:text-4xl">{medal}</span>
      <div
        className={`mt-1 w-full rounded-lg border px-1 py-1.5 ${
          champion ? "border-amber-300/70 bg-amber-400/25" : "border-white/20 bg-white/15"
        }`}
      >
        <p className="truncate text-[13px] font-black sm:text-sm">{w?.full_name ?? "—"}</p>
        <p className={`text-[11px] font-bold ${champion ? "text-amber-200" : "text-white/70"}`}>
          {w ? `${w.points_total} pts` : ""}
        </p>
      </div>
      <div
        className={`mt-2 flex w-full ${h} items-start justify-center rounded-t-md bg-gradient-to-b shadow-lg ${
          champion ? "from-amber-400 to-amber-800" : "from-amber-600 to-amber-900"
        }`}
      >
        <span className="mt-2 text-3xl font-black text-black/35 drop-shadow-sm sm:text-4xl">{place}</span>
      </div>
    </div>
  );
}

function Award({
  grad,
  emoji,
  title,
  text,
}: {
  grad: string;
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${grad}`}>
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1 font-black text-white">{title}</p>
      <p className="mt-0.5 text-sm text-white/80">{text}</p>
    </div>
  );
}

function TicketGag() {
  return (
    <div className="relative mx-auto max-w-md -rotate-2">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-[3px] shadow-2xl shadow-amber-500/30">
        <div className="rounded-[14px] bg-[#120a2a] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-amber-300">🎟️ Pase dorado</p>
            <p className="font-mono text-[10px] text-white/50">N° 2026</p>
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">Refugio del Amor</h3>
          <p className="text-xs text-white/60">Valle de Colina · Cordillera de los Andes</p>
          <div className="my-3 border-t border-dashed border-white/25" />
          <ul className="space-y-1 text-sm text-white/85">
            <li>👥 Admite: <b>3 personas</b></li>
            <li>🔥 Incluye: fogata, 🥃 pisco y rescate en 🚁 garantizado</li>
            <li>❄️ Válido toda la temporada de nieve</li>
          </ul>
          <p className="mt-3 text-[11px] italic text-white/45">
            * No válido para quienes le achuntaron a Rodri (no existen). Intransferible… o no 😏
          </p>
        </div>
      </div>
    </div>
  );
}

function Heli() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-0 top-[13%] z-[5] w-full">
      <div className="gz-heli relative inline-block">
        {/* Foco de búsqueda */}
        <div
          className="gz-beam absolute left-1/2 top-7 -z-10 h-44 w-44 origin-top -translate-x-1/2"
          style={{
            clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
            background: "radial-gradient(circle at 50% 0, rgba(255,247,200,0.5), transparent 70%)",
          }}
        />
        <span className="text-4xl" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))" }}>
          🚁
        </span>
      </div>
    </div>
  );
}

function SnowballFight() {
  // Camiseta de su selección + número + bandera + nombre = se nota quién es cada uno.
  const players = [
    { name: "Mbappé", flag: "🇫🇷", num: 10, head: "🧑🏾", jersey: "#1d4ed8", txt: "#fff", delay: "0s" },
    { name: "Neymar", flag: "🇧🇷", num: 10, head: "🧑🏽", jersey: "#facc15", txt: "#1a1a1a", delay: "0.25s" },
    { name: "Yamal", flag: "🇪🇸", num: 19, head: "🧑🏻", jersey: "#dc2626", txt: "#fff", delay: "0.1s" },
    { name: "Dembélé", flag: "🦟", num: 11, head: "🧑🏿", jersey: "#1d4ed8", txt: "#fff", delay: "0.4s" },
    { name: "Alexis", flag: "🇨🇱", num: 7, head: "🧑🏽", jersey: "#b91c1c", txt: "#fff", delay: "0.15s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[7%] z-[7] h-44">
      {/* Bolas de nieve cruzando de un lado a otro */}
      <span className="gz-snowball gz-sbR" style={{ animationDelay: "0s" }} />
      <span className="gz-snowball gz-sbL" style={{ animationDelay: "0.7s" }} />
      <span className="gz-snowball gz-sbR" style={{ animationDelay: "1.4s" }} />
      <span className="gz-snowball gz-sbL" style={{ animationDelay: "2.1s" }} />

      {/* Jugadores */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-around px-1 sm:px-10">
        {players.map((p, i) => (
          <div key={i} className="gz-kick flex flex-col items-center" style={{ animationDelay: p.delay }}>
            <span className="text-4xl leading-none drop-shadow-md sm:text-6xl">{p.head}</span>
            <div
              className="-mt-1 flex h-6 w-9 items-center justify-center rounded-b-md text-[11px] font-black shadow sm:h-8 sm:w-12 sm:text-sm"
              style={{ background: p.jersey, color: p.txt }}
            >
              {p.num}
            </div>
            <span className="mt-1 whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white sm:text-xs">
              {p.flag} {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchParty() {
  const spots = [
    { left: "10%", delay: "0s" },
    { left: "30%", delay: "0.6s" },
    { left: "66%", delay: "0.3s" },
    { left: "84%", delay: "0.9s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[8%] z-[4]">
      {spots.map((s, i) => (
        <div key={i} className="gz-bob absolute" style={{ left: s.left, animationDelay: s.delay }}>
          <div
            className="gz-beam h-14 w-9 origin-top"
            style={{
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              background: "radial-gradient(circle at 50% 0, rgba(255,240,170,0.7), transparent 72%)",
            }}
          />
          <span className="-mt-1 block text-center text-base opacity-80">🧍</span>
        </div>
      ))}
    </div>
  );
}

function Scenery() {
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 z-[3]">
      <svg viewBox="0 0 1200 340" className="w-full" preserveAspectRatio="xMidYMax meet">
        {/* Montañas */}
        <polygon points="0,220 220,90 400,220 380,340 0,340" fill="#241a52" />
        <polygon points="300,240 520,70 760,240" fill="#2c2166" />
        <polygon points="700,240 950,60 1200,240 1200,340 700,340" fill="#241a52" />
        {/* Nieve en las cimas */}
        <polygon points="520,70 470,120 500,118 520,95 545,120 575,116" fill="#e8ecff" opacity="0.9" />
        <polygon points="950,60 905,105 935,103 950,82 970,103 1000,100" fill="#e8ecff" opacity="0.9" />
        {/* Araucarias */}
        {[
          { x: 60, s: 1 },
          { x: 300, s: 0.8 },
          { x: 1010, s: 0.9 },
          { x: 1130, s: 1.05 },
        ].map((t, i) => (
          <g key={i} transform={`translate(${t.x},${230 - 70 * t.s}) scale(${t.s})`}>
            <polygon points="15,0 30,40 0,40" fill="#12351f" />
            <polygon points="15,20 33,60 -3,60" fill="#164a29" />
            <polygon points="15,42 36,86 -6,86" fill="#0f3a21" />
            <rect x="12" y="86" width="6" height="14" fill="#3a2a17" />
          </g>
        ))}
        {/* Suelo nevado */}
        <path d="M0,250 Q300,215 600,245 T1200,240 L1200,340 L0,340 Z" fill="#c9d4ff" />
        <path d="M0,272 Q300,247 600,270 T1200,264 L1200,340 L0,340 Z" fill="#eef1ff" />
        {/* Refugio */}
        <g transform="translate(150,150)">
          <polygon points="-4,64 60,16 124,64" fill="#8a5a2b" />
          <polygon points="4,60 60,20 116,60" fill="#e8ecff" opacity="0.85" />
          <rect x="12" y="62" width="96" height="72" fill="#6b4423" />
          <rect x="50" y="96" width="22" height="38" fill="#3b2513" />
          <rect x="20" y="76" width="20" height="18" fill="#ffd77a" />
          <rect x="82" y="76" width="20" height="18" fill="#ffd77a" />
          {/* Cartelito */}
          <rect x="30" y="140" width="60" height="16" rx="2" fill="#2a1a0d" />
          <text x="60" y="152" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffd77a">
            REFUGIO ❤
          </text>
        </g>
      </svg>
    </div>
  );
}

const CSS = `
.gz-title{background:linear-gradient(90deg,#f59e0b,#f43f5e,#a855f7,#22d3ee,#f59e0b);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gz-shine 6s linear infinite;filter:drop-shadow(0 3px 12px rgba(0,0,0,.45))}
@keyframes gz-shine{to{background-position:200% center}}
.gz-rise{opacity:0;animation:gz-rise .8s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes gz-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.gz-pop{opacity:0;animation:gz-pop .7s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes gz-pop{from{opacity:0;transform:translateY(28px) scale(.92)}to{opacity:1;transform:none}}
.gz-float{animation:gz-float 3s ease-in-out infinite;will-change:transform}
@keyframes gz-float{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-7px) rotate(4deg)}}
.gz-heli{animation:gz-heli 16s linear infinite;will-change:transform}
@keyframes gz-heli{from{transform:translateX(105vw)}to{transform:translateX(-25vw)}}
.gz-beam{animation:gz-beam 3.2s ease-in-out infinite;will-change:transform}
@keyframes gz-beam{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
.gz-bob{animation:gz-bob 2.4s ease-in-out infinite;will-change:transform}
@keyframes gz-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.gz-kick{animation:gz-kick .7s ease-in-out infinite;will-change:transform}
@keyframes gz-kick{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-5px) rotate(4deg)}}
.gz-snowball{position:absolute;bottom:10px;left:6%;height:13px;width:13px;border-radius:9999px;background:radial-gradient(circle at 35% 30%,#fff,#c7d2fe);box-shadow:0 0 8px 2px rgba(255,255,255,.55)}
.gz-sbR{animation:gz-sbR 2.8s ease-in-out infinite;will-change:left,bottom,transform}
.gz-sbL{animation:gz-sbL 2.8s ease-in-out infinite;will-change:left,bottom,transform}
@keyframes gz-sbR{0%{left:6%;bottom:12px;opacity:0;transform:rotate(0)}8%{opacity:1}50%{bottom:96px}92%{opacity:1}100%{left:90%;bottom:10px;opacity:0;transform:rotate(540deg)}}
@keyframes gz-sbL{0%{left:90%;bottom:14px;opacity:0;transform:rotate(0)}8%{opacity:1}50%{bottom:88px}92%{opacity:1}100%{left:6%;bottom:12px;opacity:0;transform:rotate(-540deg)}}
`;
