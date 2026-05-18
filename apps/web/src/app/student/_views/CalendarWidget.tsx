"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";

interface CalendarWidgetProps {
  events: {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    url?: string;
  }[];
}

export default function CalendarWidget({ events }: CalendarWidgetProps) {
  function handleEventClick(info: EventClickArg) {
    if (info.event.url) {
      info.jsEvent.preventDefault();
      window.open(info.event.url, "_blank");
    }
  }

  return (
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
        .fc-sp .fc-event { border-radius: 6px !important; font-size: 0.71rem !important; padding: 2px 5px !important; border: none !important; }
        .fc-sp .fc-list-event:hover td { background: var(--card-hover) !important; }
        .fc-sp .fc-list-day-cushion { background: var(--card) !important; color: var(--muted-foreground) !important; font-size: 0.75rem; }
        .fc-sp .fc-list-event-title a { color: var(--foreground) !important; }
        .fc-sp .fc-list-event-dot { border-radius: 50%; }
        .fc-sp .fc-timegrid-slot { height: 2.5rem; }
        .fc-sp .fc-timegrid-slot-label { color: var(--muted); font-size: 0.72rem; }
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
  );
}
