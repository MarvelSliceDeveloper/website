"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CalendarWidget = dynamic(() => import("./CalendarWidget"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Loading calendar…
    </div>
  ),
});

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "live" | "mentorship" | "upcoming";
  joinUrl?: string;
}

function eventColor(type: CalendarEvent["type"]): string {
  if (type === "live") return "#ef4444";
  if (type === "mentorship") return "#6366f1";
  return "#25c0e8";
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  async function fetchEvents() {
    try {
      const res = await fetch("/api/calendar/events");
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();

      console.log("API response:", data, typeof data); // 👈 check browser console

      const list = Array.isArray(data) ? data : data.events ?? data.data ?? [];
      setEvents(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  fetchEvents();
}, []);
  const fcEvents = Array.isArray(events) ? events.map((e) => ({
  id: e.id,
  title: e.title,
  start: e.start,
  end: e.end,
  backgroundColor: eventColor(e.type),
  borderColor: eventColor(e.type),
  url: e.joinUrl,
})) : [];

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
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* FullCalendar */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Loading events…
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : (
          <CalendarWidget events={fcEvents} />
        )}
      </div>

      {/* This Week List */}
      <div>
        <p className="sp-eyebrow mb-3">This Week</p>
        {loading ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading sessions…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-sm text-muted-foreground">No sessions this week.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
              const start = new Date(e.start);
              const isValid = !isNaN(start.getTime());
              return (
                <div key={e.id} className="glass-card flex items-center gap-4 p-4">
                  {/* Colored type indicator — thin left bar, no image/square */}
                  <div
                    className="h-8 w-1 flex-shrink-0 rounded-full"
                    style={{ background: eventColor(e.type) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
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
                  {/* Type badge */}
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ background: eventColor(e.type) }}
                  >
                    {e.type === "live" ? "Live" : e.type === "mentorship" ? "Mentorship" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}