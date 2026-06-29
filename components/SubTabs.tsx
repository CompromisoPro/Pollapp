"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Pestañas secundarias (segmented control) dentro de una sección. */
export default function SubTabs({
  tabs,
}: {
  tabs: {
    href: string;
    label: string;
    emoji?: string;
    badge?: string;
    /** Fecha ISO; el globito se oculta solo después de esa fecha. */
    badgeUntil?: string;
  }[];
}) {
  const path = usePathname();

  // El globito "new" se muestra solo tras montar (evita desajuste de
  // hidratación) y mientras no haya pasado su fecha de expiración.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const showBadge = (t: { badge?: string; badgeUntil?: string }) =>
    mounted && !!t.badge && (!t.badgeUntil || Date.now() < Date.parse(t.badgeUntil));

  return (
    // Contenedor con scroll: si hay muchas pestañas, se desliza en celular en
    // vez de desbordar o apretarse.
    // pt-3 deja aire arriba para el globito "new"; overflow-x permite scroll si
    // hay muchas pestañas en celular.
    <div className="mb-5 -mx-3 overflow-x-auto px-3 pt-3">
      <nav
        aria-label="Secciones"
        className="inline-flex rounded-xl bg-gray-100 p-1"
      >
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative shrink-0 rounded-lg px-4 py-2 text-[15px] font-bold transition-colors ${
                active
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.emoji && (
                <span aria-hidden className="mr-1">
                  {t.emoji}
                </span>
              )}
              {t.label}
              {showBadge(t) && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2"
                >
                  <span className="relative block whitespace-nowrap rounded-md bg-amber-400 px-1.5 py-[1px] text-[9px] font-extrabold uppercase leading-none text-amber-950 shadow">
                    {t.badge}
                    {/* puntita del globo, apuntando a la pestaña */}
                    <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-amber-400" />
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
