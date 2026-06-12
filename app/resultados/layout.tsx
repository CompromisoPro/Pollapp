import PageHeader from "@/components/PageHeader";
import SubTabs from "@/components/SubTabs";

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
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Resultados de la polla"
        emoji="🏅"
        subtitle="Cómo va el ranking general y cómo te fue a ti."
      />
      <SubTabs tabs={TABS} />
      {children}
    </main>
  );
}
