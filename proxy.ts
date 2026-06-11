import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// En Next.js 16 el antiguo "middleware.ts" se llama "proxy.ts" y la función
// se llama "proxy". Corre en runtime Node.js.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Corre en todo, menos archivos estáticos e imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
