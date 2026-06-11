import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en el SERVIDOR (Server Components, Server
 * Actions, Route Handlers). Usa la sesión del usuario logueado (respeta las
 * reglas de seguridad RLS). En Next.js 16 `cookies()` es asíncrono.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll puede fallar si se llama desde un Server Component;
            // el refresco de sesión lo maneja proxy.ts, así que es seguro ignorar.
          }
        },
      },
    }
  );
}
