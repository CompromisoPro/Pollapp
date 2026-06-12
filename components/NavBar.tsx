"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import OnlineCount from "@/components/OnlineCount";

// orden de la navegación principal (acción primero, consulta después).
const LINKS = [
  ["/apuestas", "Apuestas", "🎯"],
  ["/mundial", "Mundial", "🌎"],
  ["/resultados", "Resultados", "🏅"],
] as const;

export default function NavBar({
  isAdmin,
  points,
  rank,
}: {
  isAdmin: boolean;
  points: number;
  /** Puesto en el ranking (1 = líder). */
  rank: number;
}) {
  const path = usePathname();
  const links = isAdmin
    ? [...LINKS, ["/admin", "Admin", "🛠️"] as const]
    : LINKS;

  return (
    <>
      {/* ---------- Barra superior ---------- */}
      <header className="grad-night text-white sticky top-0 z-30 shadow-sm">
        <nav
          aria-label="Navegación principal"
          className="mx-auto max-w-5xl flex items-center gap-2 px-4 h-14"
        >
          <Link
            href="/apuestas"
            aria-label="Inicio"
            className="mr-2 shrink-0 text-white"
          >
            <Logo size={30} />
          </Link>

          {/* Links visibles solo en desktop; en mobile va la barra inferior */}
          <div className="hidden md:flex items-center gap-1.5">
            {links.map(([href, label, icon]) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={path === href || path.startsWith(`${href}/`)}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 md:border-l md:border-white/15 md:pl-4">
            <OnlineCount />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-sm font-bold tabular-nums">
              <span className="text-[color:var(--color-gold)]">#{rank}</span>
              <span aria-hidden className="text-white/30">·</span>
              {points}
              <span className="hidden sm:inline text-white/70 font-medium">
                pts
              </span>
            </span>
            <form action="/auth/signout" method="post">
              <button className="text-xs text-white/80 hover:text-white">
                Salir
              </button>
            </form>
          </div>
        </nav>
        {/* Franja de bloques de color estilo Mundial 26 */}
        <div aria-hidden className="h-1 stripe-mundial" />
      </header>

      {/* ---------- Barra inferior (mobile) ---------- */}
      <nav
        aria-label="Navegación inferior"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 grad-night text-white shadow-[0_-2px_8px_-4px_rgba(11,20,55,0.4)]"
      >
        <div aria-hidden className="h-0.5 stripe-mundial" />
        <div
          className="mx-auto flex max-w-3xl items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {links.map(([href, label, icon]) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[3.25rem] text-xs font-semibold leading-none transition-colors ${
                  active ? "text-white" : "text-white/75"
                }`}
              >
                <span aria-hidden className="text-lg">
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      <span aria-hidden className="mr-1">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
