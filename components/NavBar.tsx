"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const LINKS = [
  ["/partidos", "Partidos", "⚽"],
  ["/bonos", "Bonos", "🎯"],
  ["/tabla", "Tabla", "🏆"],
] as const;

export default function NavBar({
  isAdmin,
  points,
}: {
  isAdmin: boolean;
  points: number;
}) {
  const path = usePathname();

  return (
    <header className="grad-night text-white sticky top-0 z-30 shadow-lg shadow-indigo-900/20">
      <nav className="mx-auto max-w-3xl flex items-center gap-1 px-3 h-14">
        <Link href="/partidos" className="mr-1 shrink-0 text-white">
          <Logo size={30} />
        </Link>

        <div className="flex items-center gap-0.5 ml-1">
          {LINKS.map(([href, label, icon]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="mr-1">{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                path.startsWith("/admin")
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              🛠️ <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-sm font-bold">
            <span className="text-[color:var(--color-gold)]">★</span>
            {points}
            <span className="hidden sm:inline text-white/60 font-medium">pts</span>
          </span>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-white/60 hover:text-white">
              Salir
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
