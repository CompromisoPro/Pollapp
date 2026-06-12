/**
 * Logo de Pollapp — placa blanca con el "26" y el trofeo dorado, inspirado en
 * la identidad del Mundial 2026 (versión propia: NO es el logo oficial FIFA,
 * que es marca registrada).
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Placa blanca con sombra suave */}
      <rect width="48" height="48" rx="14" fill="#FFFFFF" />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="13.25"
        stroke="#0B1437"
        strokeOpacity="0.08"
        strokeWidth="1.5"
      />

      {/* Numerales 26: 2 rojo arriba-izquierda, 6 morado abajo-derecha */}
      <text
        x="13"
        y="22"
        textAnchor="middle"
        fontFamily="var(--font-display), Arial, sans-serif"
        fontWeight="900"
        fontSize="21"
        fill="#E4002B"
      >
        2
      </text>
      <text
        x="35"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display), Arial, sans-serif"
        fontWeight="900"
        fontSize="21"
        fill="#6D28D9"
      >
        6
      </text>

      {/* Trofeo dorado al centro */}
      <g transform="translate(24.5 24.5) scale(0.78) translate(-24 -20)">
        <g fill="#D9A514">
          <path d="M18 12h12v2.2c0 4.5-2.4 7.6-6 7.6s-6-3.1-6-7.6V12Z" />
          <path
            d="M30 13.4h2.8c0 3-1.1 4.8-3.2 5.3"
            stroke="#D9A514"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M18 13.4h-2.8c0 3 1.1 4.8 3.2 5.3"
            stroke="#D9A514"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="22.7" y="21.4" width="2.6" height="4" rx="1" />
          <rect x="19.5" y="25" width="9" height="2.4" rx="1.2" />
        </g>
      </g>
    </svg>
  );
}

export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-black tracking-tight text-[1.15em] leading-none">
        Poll<span className="text-grad">app</span>
      </span>
    </span>
  );
}
