/**
 * Badge de estado de un partido/bono, coherente en toda la app.
 * Resuelve la inconsistencia "En juego" vs "EN JUEGO" y unifica el color/emoji
 * de cada estado en un solo lugar.
 */
export type Status = "en-juego" | "finalizado" | "cerrado" | "abierto";

const STYLES: Record<Status, { label: string; className: string }> = {
  "en-juego": { label: "🔴 En juego", className: "text-red-600" },
  finalizado: { label: "🏁 Finalizado", className: "text-gray-500" },
  cerrado: { label: "🔒 Cerrado", className: "text-red-600" },
  abierto: { label: "🎯 Abierto", className: "text-green-700" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = STYLES[status];
  return (
    <span
      className={`text-xs font-bold uppercase tracking-wide ${s.className}`}
    >
      {s.label}
    </span>
  );
}
