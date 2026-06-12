/** Bloques placeholder con pulso suave, para estados de carga. */
export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="h-4 flex-1 rounded bg-gray-200" />
        <div className="h-9 w-20 rounded bg-gray-200" />
        <div className="h-4 flex-1 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/** Lista de tarjetas skeleton (para listados de partidos/bonos). */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
