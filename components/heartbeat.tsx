"use client";
import { useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";

export default function Heartbeat() {
  const supabase = createClientComponentClient();

  useEffect(() => {
    let timer: any;
    const ping = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id);
    };
    ping();                        // immediately on mount
    timer = setInterval(ping, 300_000); // then every 5 minutes
    return () => clearInterval(timer);
  }, [supabase]);

  return null;
}
