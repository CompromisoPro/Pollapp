import { useSyncExternalStore } from "react";

/**
 * Devuelve la hora actual (ms) en el cliente, refrescada cada `intervalMs`.
 * En el servidor devuelve 0 (valor estable) para evitar desajustes de
 * hidratación. Usa useSyncExternalStore, el patrón recomendado en React 19
 * (sin Date.now() durante el render ni setState dentro de un efecto).
 */
export function useNow(intervalMs = 30000): number {
  return useSyncExternalStore(
    (onChange) => {
      const t = setInterval(onChange, intervalMs);
      return () => clearInterval(t);
    },
    () => Date.now(),
    () => 0
  );
}
