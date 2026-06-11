/**
 * Logo de Pollapp — emblema "trofeo dentro del 26" (guiño a la identidad
 * oficial del Mundial 2026) + tipografía de la marca.
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
      <defs>
        <linearGradient id="pollappBrand" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#4F46E5" />
          <stop offset="0.5" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      {/* Placa */}
      <rect width="48" height="48" rx="13" fill="url(#pollappBrand)" />
      {/* Trofeo */}
      <g fill="#FBBF24">
        <path d="M18 12h12v2.2c0 4.5-2.4 7.6-6 7.6s-6-3.1-6-7.6V12Z" />
        <path
          d="M30 13.4h2.8c0 3-1.1 4.8-3.2 5.3"
          stroke="#FBBF24"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M18 13.4h-2.8c0 3 1.1 4.8 3.2 5.3"
          stroke="#FBBF24"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="22.7" y="21.4" width="2.6" height="4" rx="1" />
        <rect x="19.5" y="25" width="9" height="2.4" rx="1.2" />
      </g>
      {/* 26 */}
      <text
        x="24"
        y="40"
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="800"
        fontSize="11"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        26
      </text>
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
