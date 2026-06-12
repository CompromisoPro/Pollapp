"use client";

import { useState } from "react";

/**
 * Pestañas del panel de administración. El contenido viene renderizado del
 * servidor; aquí solo se alterna cuál se muestra (con `hidden` para no perder
 * el estado de los acordeones al cambiar de pestaña).
 */
export default function AdminTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 mb-6 sticky top-2 z-20 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            aria-pressed={active === t.id}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
              active === t.id
                ? "grad-brand text-white shadow"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div key={t.id} className={active === t.id ? "" : "hidden"}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
