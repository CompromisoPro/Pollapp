import SubTabs from "@/components/SubTabs";
import SectionBanner from "@/components/SectionBanner";

const TABS = [
  { href: "/mundial", label: "Llaves", emoji: "🏆", badge: "new", badgeUntil: "2026-07-06" },
  { href: "/mundial/fixture", label: "Fixture", emoji: "📅" },
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
      <SectionBanner
        emoji="🌎"
        title={
          <>
            Mundial <span className="text-amber-300">26</span>
          </>
        }
        subtitle="Calendario oficial, tablas de grupos y los partidos de hoy."
      />
      <SubTabs tabs={TABS} />
      <div className="relative">{children}</div>
    </main>
  );
}
