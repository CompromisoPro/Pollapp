"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pestañas secundarias (segmented control) dentro de una sección. */
export default function SubTabs({
  tabs,
}: {
  tabs: { href: string; label: string; emoji?: string }[];
}) {
  const path = usePathname();

  return (
    // Contenedor con scroll: si hay muchas pestañas, se desliza en celular en
    // vez de desbordar o apretarse.
    <div className="mb-5 -mx-3 overflow-x-auto px-3">
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
              className={`shrink-0 rounded-lg px-4 py-2 text-[15px] font-bold transition-colors ${
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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
