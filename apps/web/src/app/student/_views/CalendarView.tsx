"use client";

import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/lib/student-mock-data";

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

type SessionStatus = "past" | "present" | "upcoming";

function eventColor(type: CalendarEvent["type"]): string {
  if (type === "live") return "#ef4444";
  if (type === "mentorship") return "#6366f1";
  return "#25c0e8";
}

function getSessionStatus(start: string, end: string): SessionStatus {
  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now < startTime) return "upcoming";
  if (now > endTime) return "past";
  return "present";
}

function statusLabel(status: SessionStatus): string {
  if (status === "present") return "Live Now";
  if (status === "past") return "Past";
  return "Upcoming";
}

function statusColor(status: SessionStatus): string {
  if (status === "present") return "#ef4444";
  if (status === "past") return "#9ca3af";
  return "#25c0e8";
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
          { color: "#ef4444", label: "Live Session" },
          { color: "#25c0e8", label: "Upcoming Session" },
          { color: "#6366f1", label: "Mentorship" },
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
        {events.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-sm text-muted-foreground">
              No sessions this week.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
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
