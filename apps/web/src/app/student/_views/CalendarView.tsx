"use client";

import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/lib/api-types";

const CalendarWidget = dynamic(() => import("./CalendarWidget"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Loading calendar…
    </div>
  ),
});

interface CalendarViewProps {
  events: CalendarEvent[];
}

type SessionStatus = "past" | "present" | "upcoming" | "unknown";

// Cohesive palette: rose (live), sky (upcoming), violet (mentorship), slate (past/unknown)
const COLORS = {
  live: "#f43f5e", // rose-500
  upcoming: "#0ea5e9", // sky-500
  mentorship: "#8b5cf6", // violet-500
  past: "#94a3b8", // slate-400
  unknown: "#cbd5e1", // slate-300
};

function eventColor(type: CalendarEvent["type"]): string {
  if (type === "live") return COLORS.live;
  if (type === "mentorship") return COLORS.mentorship;
  return COLORS.upcoming;
}

function getSessionStatus(start: string, end: string): SessionStatus {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  // Guard against invalid/unparseable dates so they don't silently
  // fall through to "present" (NaN comparisons are always false).
  if (isNaN(startTime) || isNaN(endTime)) return "unknown";

  const now = Date.now();
  if (now < startTime) return "upcoming";
  if (now > endTime) return "past";
  return "present";
}

function statusLabel(status: SessionStatus): string {
  if (status === "present") return "Live Now";
  if (status === "past") return "Past";
  if (status === "unknown") return "Date TBD";
  return "Upcoming";
}

function statusColor(status: SessionStatus): string {
  if (status === "present") return COLORS.live;
  if (status === "past") return COLORS.past;
  if (status === "unknown") return COLORS.unknown;
  return COLORS.upcoming;
}

// Start-of-week (Monday) through end-of-week (Sunday) for "This Week" filtering.
function getWeekRange(reference: Date): { start: number; end: number } {
  const day = reference.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start: start.getTime(), end: end.getTime() };
}

export default function CalendarView({ events }: CalendarViewProps) {
  const fcEvents = Array.isArray(events)
    ? events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startAt,
        end: e.endAt,
        backgroundColor: eventColor(e.type),
        borderColor: eventColor(e.type),
        url: e.joinUrl,
      }))
    : [];

  const { start: weekStart, end: weekEnd } = getWeekRange(new Date());

  const thisWeekEvents = events
    .filter((e) => {
      const t = new Date(e.startAt).getTime();
      return !isNaN(t) && t >= weekStart && t < weekEnd;
    })
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Schedule</p>
        <h1 className="text-2xl font-bold text-foreground">My Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your live sessions and mentorship slots in one place.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { color: COLORS.live, label: "Live Session" },
          { color: COLORS.upcoming, label: "Upcoming Session" },
          { color: COLORS.mentorship, label: "Mentorship" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* FullCalendar */}
      <div className="glass-card p-4">
        {events.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No events to display.
          </div>
        ) : (
          <CalendarWidget events={fcEvents} />
        )}
      </div>

      {/* This Week List */}
      <div>
        <p className="sp-eyebrow mb-3">This Week</p>
        {thisWeekEvents.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-sm text-muted-foreground">
              No sessions this week.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {thisWeekEvents.map((e) => {
              const start = new Date(e.startAt);
              const isValid = !isNaN(start.getTime());
              const status = getSessionStatus(e.startAt, e.endAt);

              return (
                <div
                  key={e.id}
                  className="glass-card flex items-center gap-4 p-4"
                >
                  <div
                    className="h-8 w-1 flex-shrink-0 rounded-full"
                    style={{ background: eventColor(e.type) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted">
                      {isValid
                        ? start.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Date not available"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "present" && e.joinUrl && (
                      <a
                        href={e.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-3 py-1 text-xs"
                      >
                        Join Now
                      </a>
                    )}
                    {status === "upcoming" && e.joinUrl && (
                      <a
                        href={e.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary px-3 py-1 text-xs"
                      >
                        Open Link
                      </a>
                    )}
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: statusColor(status) }}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
