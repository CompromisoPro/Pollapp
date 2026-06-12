/**
 * Marca de Pollapp en la barra: emblema oficial del Mundial 2026 (chico) +
 * wordmark. El emblema es blanco, así que está pensado para fondos oscuros.
 */
export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mundial26.svg"
        alt=""
        aria-hidden
        style={{ height: size + 6 }}
        className="w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
      />
      <span className="font-black tracking-tight text-[1.15em] leading-none">
        Poll<span className="text-grad">app</span>
      </span>
    </span>
  );
}
