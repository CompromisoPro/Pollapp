/**
 * Gráfico simple de las apuestas de un partido: barras con los marcadores más
 * apostados y cuánta gente los puso. Componente puro (sirve en server o client).
 */
export default function BetChart({
  bets,
  max = 6,
}: {
  bets: { home: number; away: number }[];
  max?: number;
}) {
  if (bets.length === 0) {
    return <p className="text-xs text-gray-400">Nadie apostó este partido.</p>;
  }

  const counts = new Map<string, number>();
  for (const b of bets) {
    const k = `${b.home}-${b.away}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, max);
  const otros = sorted.slice(max).reduce((s, [, n]) => s + n, 0);
  const maxN = top[0][1];

  return (
    <div className="space-y-1.5">
      {top.map(([score, n]) => (
        <div key={score} className="flex items-center gap-2 text-xs">
          <span className="w-9 text-right font-bold tabular-nums">{score}</span>
          <div className="flex-1 h-3.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="grad-brand h-full rounded-full"
              style={{ width: `${Math.max((n / maxN) * 100, 6)}%` }}
            />
          </div>
          <span className="w-5 text-right text-gray-500 tabular-nums">{n}</span>
        </div>
      ))}
      {otros > 0 && (
        <p className="text-[0.7rem] text-gray-400 pl-11">
          +{otros} en otros marcadores
        </p>
      )}
    </div>
  );
}
