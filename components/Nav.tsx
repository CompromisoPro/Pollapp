import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

export default async function Nav() {
  const profile = await getProfile();

  // Sin sesión: no se muestra barra (la pantalla de login tiene su propio logo).
  if (!profile) return null;

  // Puesto en el ranking: 1 + cuántos tienen MÁS puntos (ranking estándar de
  // competición, mismo criterio que la tabla de Resultados). Un count liviano.
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("points_total", profile.points_total);
  const rank = (count ?? 0) + 1;

  return (
    <NavBar
      isAdmin={profile.is_admin}
      points={profile.points_total}
      rank={rank}
    />
  );
}
