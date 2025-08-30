"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function OrgEvents() {
  const router = useRouter();
  const cursorRef = useRef<string>(new Date(Date.now() - 60_000).toISOString());
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const url = `/api/events/stream?since=${encodeURIComponent(cursorRef.current)}`;
    const es = new EventSource(url, { withCredentials: true });
    sseRef.current = es;

    es.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data);
        cursorRef.current = new Date(e.createdAt).toISOString();
        router.refresh();
      } catch {}
    };
    es.onerror = () => {
      es.close();
      // fallback to polling
      if (!pollRef.current) {
        pollRef.current = setInterval(async () => {
          const res = await fetch(`/api/events?since=${encodeURIComponent(cursorRef.current)}`, { cache: "no-store" });
          if (res.ok) {
            const { items, nextCursor } = await res.json();
            if (items?.length) router.refresh();
            cursorRef.current = nextCursor ?? cursorRef.current;
          }
        }, 60_000);
      }
    };

    return () => {
      es.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router]);

  return null;
}
