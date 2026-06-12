import SubTabs from "@/components/SubTabs";

const TABS = [
  { href: "/mundial", label: "Fixture", emoji: "📅" },
  { href: "/mundial/grupos", label: "Grupos", emoji: "📊" },
  { href: "/mundial/en-vivo", label: "Hoy", emoji: "🔴" },
];

export default function MundialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex-1 mx-auto w-full max-w-3xl px-3 py-6 overflow-x-clip">
      {/* Emblema como marca de agua de fondo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mundial26.svg"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute -right-12 top-44 h-96 w-auto opacity-[0.05] rotate-6"
      />

      {/* Banner mundialista */}
      <div className="relative card overflow-hidden mb-6">
        <div className="grad-night text-white px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              🌎 Mundial <span className="text-amber-300">26</span>
            </h1>
            <p className="text-sm text-white/75 mt-0.5">
              Calendario oficial, tablas de grupos y los partidos de hoy.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mundial26.svg"
            alt="Mundial 2026"
            className="h-16 w-auto shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]"
          />
        </div>
        <div aria-hidden className="h-1.5 stripe-mundial" />
      </div>

      <SubTabs tabs={TABS} />
      <div className="relative">{children}</div>
    </main>
  );
}
