"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";

// Students ping every 45s; the API considers a user gone after 90s.
const HEARTBEAT_INTERVAL_MS = 45 * 1000;

/**
 * Keeps the student's live presence alive while they are in a session.
 * Start it right after a successful join; the interval stops automatically
 * on unmount. Fire-and-forget — a failed ping is never surfaced.
 */
export function useLiveSessionPresence() {
  const sessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    sessionIdRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (sessionId: string) => {
      sessionIdRef.current = sessionId;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        const id = sessionIdRef.current;
        if (!id) return;
        api.post(`/api/attendance/${id}/heartbeat`).catch(() => undefined);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [],
  );

  useEffect(() => stop, [stop]);

  return { start, stop };
}
