/**
 * Estado vacío coherente para toda la app. Antes el patrón
 * "rounded-xl border-dashed … emoji + texto" estaba copiado en 5 páginas
 * con copys sueltos.
 */
export default function EmptyState({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  /** Texto secundario opcional (next step / contexto). */
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="font-semibold text-gray-600">{title}</p>
      {children && <p className="text-sm mt-1">{children}</p>}
    </div>
  );
}
