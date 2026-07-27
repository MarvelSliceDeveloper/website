"use client";

import { useState, useEffect } from "react";
import { IconRadio, IconClock, IconArrowRight } from "@tabler/icons-react";

type Session = {
  title: string;
  courseName: string;
  startTime: string;
  endTime: string;
  joinUrl?: string;
};

function getStatus(
  session: Session,
  upcomingWindowMinutes: number,
  now: Date,
): "live" | "scheduled" | "hidden" {
  if (!session || !session.startTime || !session.endTime) return "hidden";
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  const nowMs = now.getTime();

  if (nowMs >= start && nowMs <= end) return "live";
  if (nowMs < start && start - nowMs <= upcomingWindowMinutes * 60 * 1000)
    return "scheduled";
  return "hidden";
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveSessionBanner({
  session,
  upcomingWindowMinutes = 30,
  onJoin,
}: {
  session: Session;
  upcomingWindowMinutes?: number;
  onJoin?: () => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = getStatus(session, upcomingWindowMinutes, now);
  if (status === "hidden") return null;

  const isLive = status === "live";
  const start = new Date(session.startTime);
  const msUntilStart = start.getTime() - now.getTime();

  const handleJoin = () => {
    if (onJoin) onJoin();
    else if (session.joinUrl)
      window.open(session.joinUrl, "_blank", "noopener,noreferrer");
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
          {session.courseName ? ` · ${session.courseName}` : ""}
        </p>
        <p className="text-[15px] font-bold truncate">{session.title}</p>
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
