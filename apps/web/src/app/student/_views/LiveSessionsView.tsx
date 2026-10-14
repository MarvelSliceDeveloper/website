"use client";

import { useState, useMemo } from "react";
import type { LiveSession } from "@/lib/api-types";
import { api } from "@/lib/api";
import { useLiveSessionPresence } from "@/hooks/use-live-session-presence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";

function downloadIcs(event: {
  title: string;
  start: string;
  end: string;
  joinUrl?: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIcsDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const now = new Date();
  const uid = `${Date.now()}@lms`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LMS//Session//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(new Date(event.start))}`,
    `DTEND:${toIcsDate(new Date(event.end))}`,
    `SUMMARY:${event.title}`,
    event.joinUrl ? `URL:${event.joinUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
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

function getComputedStatus(session: LiveSession): ComputedStatus {
  const now = Date.now();
  const start = new Date(session.scheduledAt).getTime();
  const end = new Date(session.endDateTime).getTime();

  if (isNaN(start)) return "UPCOMING";
  if (now >= start && now < end) return "LIVE";
  if (now >= end) return "PAST";
  return "UPCOMING";
}

function getTimeGroup(scheduledAt: string): string {
  const now = new Date();
  const start = new Date(scheduledAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  if (start >= today && start < tomorrow) return "Today";
  if (start >= tomorrow && start < weekEnd) return "This Week";
  return "Later";
}

export default function LiveSessionsView({ sessions }: LiveSessionsViewProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<LiveSession | null>(null);

  // ✅ Group using real time — not stale server status
  const liveNow = sessions.filter((s) => getComputedStatus(s) === "LIVE");
  const upcoming = sessions.filter((s) => getComputedStatus(s) === "UPCOMING");
  const past = sessions.filter((s) => getComputedStatus(s) === "PAST");

  const timeGroups = useMemo(() => {
    const upcomingToday = upcoming.filter(
      (s) => getTimeGroup(s.scheduledAt) === "Today",
    );
    const upcomingWeek = upcoming.filter(
      (s) => getTimeGroup(s.scheduledAt) === "This Week",
    );
    const upcomingLater = upcoming.filter(
      (s) => getTimeGroup(s.scheduledAt) === "Later",
    );

    if (filter === "ALL") {
      return [
        ...(liveNow.length > 0
          ? [{ label: "🔴 Live Now", items: liveNow }]
          : []),
        ...(upcomingToday.length > 0
          ? [{ label: "Today", items: upcomingToday }]
          : []),
        ...(upcomingWeek.length > 0
          ? [{ label: "This Week", items: upcomingWeek }]
          : []),
        ...(upcomingLater.length > 0
          ? [{ label: "Later", items: upcomingLater }]
          : []),
        ...(past.length > 0
          ? [{ label: "Past", items: past.slice(0, 5) }]
          : []),
      ];
    }
    return [
      {
        label:
          filter === "LIVE"
            ? "🔴 Live Now"
            : filter === "UPCOMING"
              ? "Upcoming"
              : "Past",
        items: sessions.filter((s) => getComputedStatus(s) === filter),
      },
    ];
  }, [liveNow, upcoming, past, filter, sessions]);

  return (
    <div className="sp-view-enter space-y-6">
      <div>
        <p className="sp-eyebrow">Sessions</p>
        <h1 className="text-xl font-bold text-foreground">Live Sessions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {liveNow.length} active &middot; {upcoming.length} upcoming
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
              filter === f.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {timeGroups.every((g) => g.items.length === 0) ? (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">📅</span>
          <p className="font-semibold text-foreground">No sessions found</p>
          <p className="text-sm text-muted-foreground">
            No live sessions scheduled today. Check back later.
          </p>
        </div>
      ) : (
        timeGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            {group.label && <p className="sp-eyebrow">{group.label}</p>}
            {group.items.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                status={getComputedStatus(session)}
                onSelect={() => setSelected(session)}
              />
            ))}
          </div>
        ))
      )}

      {/* ── Session detail popup ── */}
      <SessionDetailDialog
        session={selected}
        status={selected ? getComputedStatus(selected) : "UPCOMING"}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function formatCountdown(targetIso: string): string {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return "Starting now";
  const mins = Math.floor(diff / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${remMins}m`;
  if (mins >= 60) return `Starts in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `Starts in ${mins}m`;
}

function SessionDetailDialog({
  session,
  status,
  onClose,
}: {
  session: LiveSession | null;
  status: ComputedStatus;
  onClose: () => void;
}) {
  const [joining, setJoining] = useState(false);
  const presence = useLiveSessionPresence();

  if (!session) return null;

  const isLive = status === "LIVE";
  const isPast = status === "PAST";
  const start = new Date(session.scheduledAt);
  const end = new Date(session.endDateTime);
  const durationMins = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000),
  );

  const handleJoin = async () => {
    if (!session.joinUrl) return;
    setJoining(true);
    try {
      await api.post(`/api/attendance/${session.id}/join`);
      presence.start(session.id);
    } catch (err) {
      console.error("Failed to log attendance:", err);
    } finally {
      setJoining(false);
      window.open(session.joinUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-danger">
                <span className="live-pulse h-2 w-2 rounded-full bg-danger" />
                Live Now
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center rounded-full bg-muted/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Ended
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-accent">
                Scheduled
              </span>
            )}
            {session.recordingSyncingIn && (
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                Recording syncing in {session.recordingSyncingIn}
              </span>
            )}
          </div>
          <DialogTitle className="mt-2">{session.title}</DialogTitle>
          <DialogDescription>
            {session.courseTitle} &middot; {session.batchLabel}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/10 p-4 text-sm">
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Instructor
            </dt>
            <dd className="mt-0.5 truncate font-semibold text-foreground">
              {session.instructor}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Duration
            </dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {durationMins > 0 ? `${durationMins} min` : "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Starts
            </dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {start.toLocaleString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ends
            </dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {end.toLocaleString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>
        </dl>

        {!isPast && !isLive && (
          <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-center text-xs font-semibold text-accent">
            {formatCountdown(session.scheduledAt)}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {status === "UPCOMING" && (
            <button
              className="btn-secondary text-sm"
              onClick={() =>
                downloadIcs({
                  title: session.title,
                  start: session.scheduledAt,
                  end: session.endDateTime,
                  joinUrl: session.joinUrl,
                })
              }
            >
              Add to Calendar
            </button>
          )}
          {isLive && session.joinUrl && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary flex items-center justify-center gap-1.5 text-sm"
            >
              {joining ? "Joining..." : "Join on Teams"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionCard({
  session,
  status,
  onSelect,
}: {
  session: LiveSession;
  status: ComputedStatus;
  onSelect: () => void;
}) {
  const isLive = status === "LIVE";
  const isPast = status === "PAST";
  const [joining, setJoining] = useState(false);
  const presence = useLiveSessionPresence();

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
    Math.floor((Date.now() - new Date(session.scheduledAt).getTime()) / 60_000),
  );

  const handleJoin = async () => {
    if (!session.joinUrl) return;
    setJoining(true);
    try {
      await api.post(`/api/attendance/${session.id}/join`);
      presence.start(session.id);
    } catch (err) {
      console.error("Failed to log attendance:", err);
    } finally {
      setJoining(false);
      window.open(session.joinUrl, "_blank", "noopener,noreferrer");
    }
  };

  const borderColor = isLive
    ? "border-l-danger/50"
    : status === "UPCOMING"
      ? "border-l-accent/40"
      : "border-l-muted/20";

  const badgeDate = new Date(session.scheduledAt);
  const dateNum = badgeDate.getDate();
  const dateMonth = badgeDate.toLocaleDateString("en-IN", { month: "short" });

  return (
    <div
      role="button"
      tabIndex={0}
      title="View session details"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`glass-card p-5 border-l-4 transition-all cursor-pointer hover:shadow-md hover:-translate-y-px ${borderColor} ${isLive ? "bg-danger/5" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-start gap-4">
          {/* Date badge */}
          {!isLive && (
            <div className="hidden sm:flex flex-col items-center justify-center w-12 h-14 rounded-lg bg-card border border-border shrink-0">
              <span className="text-[11px] font-bold uppercase text-primary">
                {dateMonth}
              </span>
              <span className="text-lg font-black text-foreground">
                {dateNum}
              </span>
            </div>
          )}
          <div>
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
                  Recording syncing in {session.recordingSyncingIn}
                </span>
              )}
            </div>

            <p className="font-semibold text-foreground">{session.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {session.courseTitle} &middot; {session.instructor}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {session.batchLabel}
              {!isLive && ` · ${scheduledStr}`}
              {isLive && ` · Started ${minutesRunning} min ago`}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 pl-0 sm:pl-4">
          {isLive && session.joinUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
              disabled={joining}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              {joining ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Joining...
                </>
              ) : (
                "Join on Teams"
              )}
            </button>
          )}
          {status === "UPCOMING" && (
            <button
              className="btn-secondary text-sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadIcs({
                  title: session.title,
                  start: session.scheduledAt,
                  end: session.endDateTime,
                  joinUrl: session.joinUrl,
                });
              }}
            >
              Add to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
