/**
 * Banner de sección estilo "Mundial 26": fondo noche, emblema oficial a la
 * derecha y franja de bloques de color abajo. Usar dentro de un contenedor
 * con `relative` si se combina con <SectionWatermark />.
 */
export default function SectionBanner({
  title,
  emoji,
  subtitle,
}: {
  title: React.ReactNode;
  emoji?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative card overflow-hidden mb-6">
      <div className="grad-night text-white px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {emoji && <span className="mr-1">{emoji}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-white/75 mt-0.5">{subtitle}</p>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mundial26.svg"
          alt="Mundial 2026"
          className="h-16 w-auto shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]"
        />
      </div>
      <div aria-hidden className="h-1.5 stripe-mundial" />
    </div>
  );
}

/** Emblema gigante como marca de agua (poner dentro de un main `relative`). */
export function SectionWatermark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mundial26.svg"
      alt=""
      aria-hidden
      className="pointer-events-none select-none absolute -right-12 top-44 h-96 w-auto opacity-[0.05] rotate-6"
    />
  );
}
