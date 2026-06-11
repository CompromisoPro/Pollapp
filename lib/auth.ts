import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Devuelve el usuario autenticado o null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Devuelve el perfil del usuario actual (o null si no hay sesión). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/**
 * Verifica que el usuario actual sea administrador. Lanza error si no lo es.
 * Usar al inicio de toda acción de admin.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.is_admin) {
    throw new Error("No autorizado: se requiere administrador.");
  }
  return profile;
}
