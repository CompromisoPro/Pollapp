import { getProfile } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function Nav() {
  const profile = await getProfile();

  // Sin sesión: no se muestra barra (la pantalla de login tiene su propio logo).
  if (!profile) return null;

  return <NavBar isAdmin={profile.is_admin} points={profile.points_total} />;
}
