import SubTabs from "@/components/SubTabs";
import SectionBanner, { SectionWatermark } from "@/components/SectionBanner";

const TABS = [
  { href: "/resultados", label: "Tabla", emoji: "🏆" },
  { href: "/resultados/mis-resultados", label: "Mis resultados", emoji: "📈" },
];

export default function ResultadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex-1 mx-auto w-full max-w-3xl px-3 py-6 overflow-x-clip">
      <SectionWatermark />
      <SectionBanner
        emoji="🏅"
        title="Resultados de la polla"
        subtitle="Cómo va el ranking general y cómo te fue a ti."
      />
      <SubTabs tabs={TABS} />
      <div className="relative">{children}</div>
    </main>
  );
}
