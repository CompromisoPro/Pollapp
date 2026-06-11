import { useSyncExternalStore } from "react";

/**
 * Reloj compartido: una sola fuente de "ahora" (ms) para todos los componentes,
 * refrescada cada 30s. En el servidor devuelve 0 (estable) para no romper la
 * hidratación.
 *
 * Clave: `subscribe` y `getSnapshot` son referencias ESTABLES a nivel de módulo.
 * Si fueran funciones nuevas en cada render, React re-suscribiría sin parar y se
 * caería con "Maximum update depth exceeded" (error #185).
 */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function start() {
  if (timer) return;
  now = Date.now();
  timer = setInterval(() => {
    now = Date.now();
    for (const l of listeners) l();
  }, 30000);
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
