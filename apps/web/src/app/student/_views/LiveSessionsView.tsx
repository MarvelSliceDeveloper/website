"use client";

import { useState } from "react";
import type { LiveSession } from "@/lib/student-mock-data";
import { api } from "@/lib/api";
interface LiveSessionsViewProps {
  sessions: LiveSession[];
}

type Filter = "ALL" | "LIVE" | "UPCOMING" | "PAST";
type ComputedStatus = "LIVE" | "UPCOMING" | "PAST";
const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "🔴 Live Now", value: "LIVE" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Past", value: "PAST" },
];

// ✅ Compute status from real time — never trust s.status from server
function getComputedStatus(session: LiveSession): ComputedStatus {
  const now = Date.now();
  const start = new Date(session.scheduledAt).getTime();

  const rawEnd = session.endDateTime ?? (session as LiveSession & { endAt?: string }).endAt;
  let end = new Date(rawEnd).getTime();

  // Fallback: if no valid end time, assume session lasts 1 hour
  if (isNaN(end)) {
    end = start + 60 * 60 * 1000;
  }

  if (isNaN(start)) return "UPCOMING"; // safety fallback
  if (now >= start && now < end) return "LIVE";
  if (now >= end) return "PAST";
  return "UPCOMING";
}

export default function LiveSessionsView({ sessions }: LiveSessionsViewProps) {
  const [filter, setFilter] = useState<Filter>("ALL");

  // ✅ Group using real time — not stale server status
  const liveNow = sessions.filter((s) => getComputedStatus(s) === "LIVE");
  const upcoming = sessions.filter((s) => getComputedStatus(s) === "UPCOMING");
  const past = sessions.filter((s) => getComputedStatus(s) === "PAST");

  const grouped =
    filter === "ALL"
      ? [
        { label: "🔴 Live Now", items: liveNow },
        { label: "Upcoming", items: upcoming },
        { label: "Past", items: past },
      ].filter((g) => g.items.length > 0)
      : [
        {
          label: "",
          // ✅ Filter using real time — not stale server status
          items: sessions.filter((s) => getComputedStatus(s) === filter),
        },
      ];

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Sessions</p>
        <h1 className="text-2xl font-bold text-foreground">Live Sessions</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${filter === f.value
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Session Groups */}
      {grouped.every((g) => g.items.length === 0) ? (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">📅</span>
          <p className="font-semibold text-foreground">No sessions found</p>
          <p className="text-sm text-muted-foreground">
            No live sessions scheduled today. Check back later.
          </p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.label} className="space-y-3">
            {group.label && <p className="sp-eyebrow">{group.label}</p>}
            {group.items.map((session) => (
              <SessionCard key={session.id} session={session} status={getComputedStatus(session)} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function SessionCard({ session, status }: { session: LiveSession; status: ComputedStatus }) {
  const isLive = status === "LIVE";
  const isPast = status === "PAST";
  const [joining, setJoining] = useState(false);

  const scheduledStr = new Date(session.scheduledAt).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  const minutesRunning = Math.max(
    0,
    // eslint-disable-next-line react-hooks/purity
    Math.floor((Date.now() - new Date(session.scheduledAt).getTime()) / 60_000)
  );

  const handleJoin = async () => {
    if (!session.joinUrl) return;
    setJoining(true);
    try {
      await api.post(`/api/attendance/${session.id}/join`);
    } catch (err) {
      console.error("Failed to log attendance:", err);
    } finally {
      setJoining(false);
      window.open(session.joinUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`glass-card p-5 transition-all ${isLive ? "border-danger/30 bg-danger/5" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5">
                <span className="live-pulse h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="text-xs font-bold uppercase tracking-widest text-danger">
                  Live Now
                </span>
              </span>
            )}
            {isPast && session.recordingSyncingIn && (
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                ⏳ Recording syncing in {session.recordingSyncingIn}
              </span>
            )}
          </div>

          <p className="font-semibold text-foreground">{session.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.courseTitle} · Instructor: {session.instructor}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Batch: {session.batchLabel}
            {!isLive && ` · ${scheduledStr}`}
            {isLive && ` · Started ${minutesRunning} min ago`}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isLive && session.joinUrl && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              {joining ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Joining...
                </>
              ) : (
                "Join on Teams →"
              )}
            </button>
          )}
          {status === "UPCOMING" && (
            <button className="btn-secondary text-sm">Add to Calendar</button>
          )}
        </div>
      </div>
    </div>
  );
}