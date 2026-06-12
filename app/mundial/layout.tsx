import PageHeader from "@/components/PageHeader";
import SubTabs from "@/components/SubTabs";

const TABS = [
  { href: "/mundial", label: "Fixture", emoji: "📅" },
  { href: "/mundial/grupos", label: "Grupos", emoji: "📊" },
];

export default function MundialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-3 py-6">
      <PageHeader
        title="Mundial"
        emoji="🌎"
        subtitle="El calendario oficial y las tablas de cada grupo."
      />
      <SubTabs tabs={TABS} />
      {children}
    </main>
  );
}
