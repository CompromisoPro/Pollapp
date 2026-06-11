import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente ADMIN de Supabase (service role). Pasa POR ENCIMA de las reglas de
 * seguridad (RLS). SOLO debe usarse en el servidor, dentro de acciones que ya
 * verificaron que quien las ejecuta es administrador (ver requireAdmin()).
 *
 * NUNCA importar este archivo desde un componente con "use client".
 * La variable SUPABASE_SERVICE_ROLE_KEY NO lleva el prefijo NEXT_PUBLIC_,
 * por lo que jamás llega al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
