import Link from "next/link";

/**
 * Link "ver apuestas de todos" coherente. Antes había 3 variantes del mismo
 * concepto ("👀 Ver apuestas de todos", "Ver apuestas de todos", "👀").
 */
export default function DetailLink({
  matchId,
  label = "👀 Ver apuestas de todos",
}: {
  matchId: number;
  label?: string;
}) {
  return (
    <Link
      href={`/partido/${matchId}`}
      className="text-xs font-bold text-brand-600 hover:underline"
    >
      {label}
    </Link>
  );
}
