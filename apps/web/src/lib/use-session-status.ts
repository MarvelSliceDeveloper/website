import { useState, useEffect } from "react";
import type { LiveSession } from "@/lib/student-mock-data";

export type ComputedStatus = "LIVE" | "UPCOMING" | "PAST";

export function useComputedStatus(session: LiveSession): ComputedStatus {
  const getStatus = (): ComputedStatus => {
    const now = Date.now();
    const start = new Date(session.scheduledAt).getTime();
    const end = new Date(session.endDateTime).getTime(); // ✅ uses endDateTime directly

    if (now >= start && now < end) return "LIVE";
    if (now >= end) return "PAST";
    return "UPCOMING";
  };

  const [status, setStatus] = useState<ComputedStatus>(getStatus);

  useEffect(() => {
    const interval = setInterval(() => setStatus(getStatus()), 30_000);
    return () => clearInterval(interval);
  }, [session.scheduledAt, session.endDateTime]); // ✅ depend on endDateTime

  return status;
}