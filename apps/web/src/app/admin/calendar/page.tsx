"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Instructor = {
  id: string;
  name: string;
};

type SessionData = {
  id: string;
  scheduledAt: string;
  endedAt: string | null;
  joinUrl: string;
  batch?: { name: string; course?: { title: string } };
};

const COURSE_COLORS = [
  "#6d7dff",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#4F46E5",
  "#06b6d4",
  "#a855f7",
];

export default function AdminCalendarPage() {
  usePageTitle("Calendar");
  const [selectedInstructor, setSelectedInstructor] = useState("");

  const instructorsQuery = useApiQuery<Instructor[]>(
    ["admin", "batches", "instructors"],
    "/api/admin/batches/instructors",
  );

  const sessionsQuery = useApiQuery<{ sessions: SessionData[] }>(
    ["admin", "calendar", "sessions", selectedInstructor || "all"],
    "/api/sessions",
    selectedInstructor ? { instructorId: selectedInstructor } : undefined,
  );

  const { events, courseColorMap } = useMemo(() => {
    const sessions = Array.isArray(sessionsQuery.data?.sessions)
      ? sessionsQuery.data.sessions
      : [];
    const colorMap: Record<string, string> = {};
    let colorIdx = 0;
    const mapped = sessions.map((s: SessionData) => {
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
    return { events: mapped, courseColorMap: colorMap };
  }, [sessionsQuery.data]);

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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} session{events.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            Filter by Instructor:
          </label>
          <Select
            value={selectedInstructor}
            onValueChange={setSelectedInstructor}
          >
            <SelectTrigger className="field max-w-[220px]">
              <SelectValue placeholder="All Instructors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Instructors</SelectItem>
              {instructorsQuery.data?.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Color legend */}
      {Object.keys(courseColorMap).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Courses:</span>
          {Object.entries(courseColorMap).map(([course, color]) => (
            <span key={course} className="flex items-center gap-1">
              <span
                className="h-2.5 w-2.5 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              {course}
            </span>
          ))}
        </div>
      )}

      {sessionsQuery.isLoading ? (
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
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
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
