"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Cuántos están mirando la polla AHORA, en vivo (Supabase Realtime Presence).
 * No usa base de datos ni SQL: cada pestaña abierta se "anuncia" en un canal y
 * contamos las presencias. Si Realtime no conecta, simplemente no se muestra.
 */
export default function OnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

    const channel = supabase.channel("pollapp-online", {
      config: { presence: { key } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ at: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span
      title={`${count} ${count === 1 ? "persona" : "personas"} mirando ahora`}
      className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-1 text-sm font-bold text-white"
    >
      <span className="dot-live" style={{ background: "#bbf7d0" }} aria-hidden />
      👀 {count}
    </span>
  );
}
