import Link from "next/link";
import { getProfile } from "@/lib/auth";

export default async function Nav() {
  const profile = await getProfile();

  // Sin sesión: barra mínima (la pantalla de login ya tiene su título).
  if (!profile) return null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-3xl flex items-center gap-1 px-3 h-14">
        <Link href="/partidos" className="font-black text-lg mr-2">
          ⚽ Pollapp
        </Link>

        <NavLink href="/partidos">Partidos</NavLink>
        <NavLink href="/bonos">Bonos</NavLink>
        <NavLink href="/tabla">Tabla</NavLink>
        {profile.is_admin && <NavLink href="/admin">Admin</NavLink>}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-semibold text-blue-600">
            {profile.points_total} pts
          </span>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-gray-500 hover:text-gray-800">
              Salir
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </Link>
  );
}
