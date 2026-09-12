import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicQueueEntry {
  id: string;
  code: string;
  name: string;
  status: "waiting" | "called";
  position: number;
  joinedAt: string;
  calledAt: string | null;
}

interface QueueSnapshot {
  called: PublicQueueEntry | null;
  waiting: PublicQueueEntry[];
  updatedAt: string;
}

const emptySnapshot: QueueSnapshot = { called: null, waiting: [], updatedAt: "" };

export function usePublicQueue() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<QueueSnapshot>("queue-read", { body: {} });
    if (!mounted.current) return;
    if (!error && data) {
      setSnapshot(data);
      setConnected(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const poller = window.setInterval(refresh, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase.channel("queue-public-refresh")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "queue_public_events" }, () => void refresh())
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      mounted.current = false;
      window.clearInterval(poller);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { ...snapshot, loading, connected, refresh };
}