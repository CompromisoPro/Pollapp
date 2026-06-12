import PageHeader from "@/components/PageHeader";
import SubTabs from "@/components/SubTabs";

const TABS = [
  { href: "/apuestas", label: "Partidos", emoji: "⚽" },
  { href: "/apuestas/bonos", label: "Bonos", emoji: "🎯" },
];

export default function ApuestasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Apuestas"
        emoji="🎯"
        subtitle="Pronostica los partidos del día y los bonos por fase."
      />
      <SubTabs tabs={TABS} />
      {children}
    </main>
  );
}
