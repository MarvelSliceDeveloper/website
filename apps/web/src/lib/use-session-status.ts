import { useState, useEffect } from "react";
import type { LiveSession } from "@/lib/student-mock-data";

export type ComputedStatus = "LIVE" | "UPCOMING" | "PAST";

// Hook that computes LIVE/UPCOMING/PAST status every 30s
export function useComputedStatus(session: LiveSession): ComputedStatus {
  const getStatus = (): ComputedStatus => {
    const now = Date.now();
    const start = new Date(session.scheduledAt).getTime();

    const rawEnd = (session as any).endDateTime ?? (session as any).endAt;
    let end = new Date(rawEnd).getTime();

    // Fallback: if no valid end time, assume session lasts 1 hour
    if (isNaN(end)) {
      end = start + 60 * 60 * 1000;
    }

    if (isNaN(start)) return "UPCOMING";
    if (now >= start && now < end) return "LIVE";
    if (now >= end) return "PAST";
    return "UPCOMING";
  };

  const [status, setStatus] = useState<ComputedStatus>(getStatus);

  useEffect(() => {
    const interval = setInterval(() => setStatus(getStatus()), 30_000);
    return () => clearInterval(interval);
  }, [session.scheduledAt, (session as any).endDateTime, (session as any).endAt]);

  return status;
}
