import { useSyncExternalStore } from "react";

/**
 * Hora actual (ms) en el cliente, refrescada cada `intervalMs`.
 *
 * useSyncExternalStore exige que getSnapshot devuelva un valor ESTABLE entre
 * cambios reales (si devolviera Date.now() en cada llamada, React detectaría un
 * "cambio" infinito). Por eso cacheamos el valor en `cachedNow` y solo lo
 * actualizamos dentro del intervalo (o al suscribirse). En el servidor devuelve
 * 0 (estable) para evitar desajustes de hidratación.
 */
let cachedNow = 0;

function subscribe(onChange: () => void, intervalMs: number) {
  cachedNow = Date.now();
  onChange();
  const t = setInterval(() => {
    cachedNow = Date.now();
    onChange();
  }, intervalMs);
  return () => clearInterval(t);
}

export function useNow(intervalMs = 30000): number {
  return useSyncExternalStore(
    (onChange) => subscribe(onChange, intervalMs),
    () => cachedNow,
    () => 0
  );
}
