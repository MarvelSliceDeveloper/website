"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";

type Instructor = {
  id: string;
  name: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  url?: string;
};

const COURSE_COLORS = [
  "#6d7dff", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#a855f7",
];

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseColorMap, setCourseColorMap] = useState<Record<string, string>>({});

  const fetchInstructors = useCallback(async () => {
    try {
      const data = await api.get<Instructor[]>("/api/admin/batches/instructors");
      setInstructors(data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedInstructor) params.instructorId = selectedInstructor;

      const data = await api.get<{ sessions: any[] }>("/api/sessions", params);
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];

      const colorMap: Record<string, string> = {};
      let colorIdx = 0;

      const mapped = sessions.map((s: any) => {
        const courseTitle = s.batch?.course?.title || "Unknown";
        if (!colorMap[courseTitle]) {
          colorMap[courseTitle] = COURSE_COLORS[colorIdx % COURSE_COLORS.length];
          colorIdx++;
        }
        const color = colorMap[courseTitle];

        const startStr = s.scheduledAt;
        const endMs = s.endedAt
          ? new Date(s.endedAt).getTime()
          : new Date(startStr).getTime() + 3600000;

        return {
          id: s.id,
          title: `${courseTitle} - ${s.batch?.name || ""}`,
          start: startStr,
          end: new Date(endMs).toISOString(),
          backgroundColor: color,
          borderColor: color,
          url: s.joinUrl,
        };
      });

      setEvents(mapped);
      setCourseColorMap(colorMap);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [selectedInstructor]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleEventClick(info: EventClickArg) {
    if (info.event.url) {
      info.jsEvent.preventDefault();
      window.open(info.event.url, "_blank");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} session{events.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">Filter by Instructor:</label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="field max-w-[220px]"
          >
            <option value="">All Instructors</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color legend */}
      {Object.keys(courseColorMap).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Courses:</span>
          {Object.entries(courseColorMap).map(([course, color]) => (
            <span key={course} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              {course}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading calendar...</p>
        </div>
      ) : (
        <div className="glass-card p-4 overflow-hidden">
          <div className="fc-sp">
            <style>{`
              .fc-sp .fc { font-family: inherit; color: var(--foreground); }
              .fc-sp .fc-toolbar { gap: 0.5rem; flex-wrap: wrap; }
              .fc-sp .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: var(--foreground); }
              .fc-sp .fc-button-group { gap: 4px; }
              .fc-sp .fc-button {
                background: var(--card) !important;
                border: 1px solid var(--border) !important;
                color: var(--muted-foreground) !important;
                border-radius: 10px !important;
                font-size: 0.75rem !important;
                padding: 0.3rem 0.65rem !important;
                box-shadow: none !important;
                transition: border-color 0.15s, color 0.15s;
              }
              .fc-sp .fc-button:hover { border-color: var(--border-hover) !important; color: var(--foreground) !important; }
              .fc-sp .fc-button-primary:not(:disabled).fc-button-active,
              .fc-sp .fc-button-primary:not(:disabled):active {
                background: color-mix(in srgb, var(--primary) 18%, var(--card)) !important;
                border-color: color-mix(in srgb, var(--primary) 60%, transparent) !important;
                color: var(--primary) !important;
              }
              .fc-sp .fc-col-header-cell-cushion { color: var(--muted); font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
              .fc-sp .fc-daygrid-day-number { color: var(--muted-foreground); font-size: 0.75rem; }
              .fc-sp .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame { background: color-mix(in srgb, var(--primary) 7%, transparent); }
              .fc-sp .fc-scrollgrid, .fc-sp td, .fc-sp th { border-color: var(--border) !important; }
              .fc-sp .fc-event { border-radius: 6px !important; font-size: 0.71rem !important; padding: 2px 5px !important; border: none !important; cursor: pointer; }
              .fc-sp .fc-list-event:hover td { background: var(--card-hover) !important; }
              .fc-sp .fc-list-day-cushion { background: var(--card) !important; color: var(--muted-foreground) !important; font-size: 0.75rem; }
              .fc-sp .fc-list-event-title a { color: var(--foreground) !important; }
              .fc-sp .fc-timegrid-slot { height: 2.5rem; }
              .fc-sp .fc-timegrid-slot-label { color: var(--muted); font-size: 0.72rem; }
              .fc-sp .fc-daygrid-event-dot { display: none !important; }
              .fc-sp .fc-list-event-dot { display: none !important; }
            `}</style>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listWeek",
              }}
              events={events}
              height="auto"
              eventClick={handleEventClick}
              eventDisplay="block"
            />
          </div>
        </div>
      )}
    </div>
  );
}
