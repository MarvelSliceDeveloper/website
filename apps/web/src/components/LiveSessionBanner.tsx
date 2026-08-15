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
  if (session.status === "PAST") {
    return "hidden";
  }
  if (!session.scheduledAt) return "hidden";

  const start = new Date(session.scheduledAt).getTime();
  if (Number.isNaN(start)) return "hidden";

  const end = resolveEndTime(session);
  if (Number.isNaN(end)) return "hidden";

  if (nowMs >= end) return "hidden";

  if (session.status === "LIVE") return "live";
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
  // First check if there is an ongoing live session
  const ongoing = sessions.find(
    (s) => getSessionStatus(s, upcomingWindowMinutes, nowMs) === "live",
  );
  if (ongoing) return ongoing;

  // Otherwise pick any upcoming scheduled session starting within window
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
  const hasUrl = !!bestSession.joinUrl;

  const handleJoin = () => {
    if (!hasUrl && !onJoin) return;
    if (onJoin) onJoin(bestSession);
    else if (bestSession.joinUrl)
      window.open(bestSession.joinUrl, "_blank", "noopener,noreferrer");
  };

  const cardBg = isLive
    ? "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 shadow-lg shadow-red-500/20 border border-red-400/30"
    : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-lg shadow-amber-500/20 border border-amber-300/30";

  return (
    <div
      className={`w-full rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${cardBg}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
          {isLive ? (
            <>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
              </span>
              <IconRadio className="w-6 h-6 animate-pulse" />
            </>
          ) : (
            <IconClock className="w-6 h-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/25">
              {isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              )}
              {isLive ? "Live Session" : "Upcoming Class"}
            </span>
            {bestSession.courseTitle && (
              <span className="text-xs font-semibold opacity-90 truncate max-w-[240px]">
                · {bestSession.courseTitle}
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-bold tracking-tight truncate drop-shadow-sm">
            {bestSession.title}
          </h4>

          {!isLive && (
            <p className="text-xs font-medium opacity-90 mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80" />
              Starts in{" "}
              <span className="font-mono font-bold">{formatCountdown(msUntilStart)}</span>
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleJoin}
        disabled={!hasUrl && !onJoin}
        className={`shrink-0 inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-50 font-extrabold rounded-xl px-5 py-2.5 text-sm shadow-md transition-all duration-200 active:scale-95 ${!hasUrl && !onJoin
          ? "opacity-75 cursor-not-allowed"
          : "cursor-pointer hover:shadow-lg hover:translate-y-[-1px]"
          }`}
        title={!hasUrl ? "Meeting link pending instructor release" : undefined}
      >
        {isLive ? (
          hasUrl ? (
            <>
              Join Live Class
              <IconArrowRight className="w-4 h-4 text-red-600" />
            </>
          ) : (
            "Link Pending"
          )
        ) : (
          <>
            {hasUrl ? "Join Class" : "Link Pending"}
            {hasUrl && <IconArrowRight className="w-4 h-4 text-amber-600" />}
          </>
        )}
      </button>
    </div>
  );
}
