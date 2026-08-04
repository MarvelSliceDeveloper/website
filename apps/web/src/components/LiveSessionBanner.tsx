"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { IconRadio, IconClock, IconArrowRight } from "@tabler/icons-react";
import { api } from "@/lib/api";
import type { LiveSession } from "@/lib/api-types";

const POLL_INTERVAL_MS = 60_000;
const DEFAULT_END_FALLBACK_MS = 2 * 60 * 60 * 1000;

function resolveEndTime(session: LiveSession): number {
  const start = new Date(session.scheduledAt).getTime();
  const end = session.endDateTime
    ? new Date(session.endDateTime).getTime()
    : start + DEFAULT_END_FALLBACK_MS;
  return end;
}

function getSessionStatus(
  session: LiveSession,
  upcomingWindowMinutes: number,
  nowMs: number,
): "live" | "scheduled" | "hidden" {
  if (!session.scheduledAt) return "hidden";
  const start = new Date(session.scheduledAt).getTime();
  const end = resolveEndTime(session);

  if (nowMs >= start && nowMs < end) return "live";
  if (nowMs < start && start - nowMs <= upcomingWindowMinutes * 60 * 1000)
    return "scheduled";
  return "hidden";
}

function pickBestSession(
  sessions: LiveSession[],
  upcomingWindowMinutes: number,
  nowMs: number,
): LiveSession | null {
  for (const s of sessions) {
    if (getSessionStatus(s, upcomingWindowMinutes, nowMs) !== "hidden")
      return s;
  }
  return null;
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveSessionBanner({
  sessions,
  upcomingWindowMinutes = 30,
  onJoin,
}: {
  sessions: LiveSession[];
  upcomingWindowMinutes?: number;
  onJoin?: (session: LiveSession) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(sessions);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLiveSessions(sessions);
  }, [sessions]);

  const pollSessions = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: LiveSession[] }>(
        "/api/sessions",
      );
      setLiveSessions(data.sessions || []);
    } catch {
      // Silent fail — banner will hide if sessions become stale
    }
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    pollRef.current = setInterval(pollSessions, POLL_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollSessions]);

  const bestSession = pickBestSession(liveSessions, upcomingWindowMinutes, now);
  if (!bestSession) return null;

  const status = getSessionStatus(bestSession, upcomingWindowMinutes, now);
  const isLive = status === "live";
  const start = new Date(bestSession.scheduledAt).getTime();
  const msUntilStart = start - now;

  const handleJoin = () => {
    if (onJoin) onJoin(bestSession);
    else if (bestSession.joinUrl)
      window.open(bestSession.joinUrl, "_blank", "noopener,noreferrer");
  };

  const bg = isLive ? "bg-danger" : "bg-warning";
  const textAccent = isLive ? "text-danger" : "text-warning";

  return (
    <div
      className={`w-full rounded-2xl px-5 py-4.5 text-white flex items-center gap-4 ${bg}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        {isLive ? (
          <IconRadio className="w-5 h-5" />
        ) : (
          <IconClock className="w-5 h-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wide opacity-90 mb-0.5">
          {isLive ? "Live now" : "Starting soon"}
          {bestSession.courseTitle
            ? ` · ${bestSession.courseTitle}`
            : ""}
        </p>
        <p className="text-[15px] font-bold truncate">{bestSession.title}</p>
        {!isLive && (
          <p className="text-xs opacity-90 mt-0.5">
            Starts in {formatCountdown(msUntilStart)}
          </p>
        )}
      </div>

      <button
        onClick={handleJoin}
        className={`shrink-0 inline-flex items-center gap-1.5 bg-white ${textAccent} rounded-xl px-4 py-2.5 text-sm font-extrabold active:scale-95 transition-transform`}
      >
        {isLive ? (
          "Join now"
        ) : (
          <>
            Join <IconArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
