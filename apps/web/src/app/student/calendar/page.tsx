"use client";

import { useState, useEffect } from "react";
import { LiveBadge } from "@/components/ui/Badge";

type ViewMode = "month" | "week" | "day";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  day: number;
  hour: number;
  duration: number;
  isLive: boolean;
  joinUrl?: string;
  color: string;
  type: "session" | "mentorship";
  mentorName?: string;
}

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const [sessionsRes, ticketsRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/mentorship/tickets/my"),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Process live sessions
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        const sessions = sessionsData.sessions || [];
        
        sessions.forEach((session: any) => {
          const date = new Date(session.scheduledAt);
          calendarEvents.push({
            id: `session-${session.id}`,
            title: session.title || "Live Session",
            time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            day: date.getDay(),
            hour: date.getHours(),
            duration: 1, // Default 1 hour
            isLive: isSessionLive(session.scheduledAt, session.endedAt),
            joinUrl: session.joinUrl,
            color: "bg-primary/20 border-primary/30 text-primary-hover",
            type: "session",
          });
        });
      }

      // Process scheduled mentorship sessions
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        const tickets = ticketsData.tickets || [];
        
        tickets
          .filter((t: any) => t.status === "SCHEDULED" && t.scheduledAt)
          .forEach((ticket: any) => {
            const date = new Date(ticket.scheduledAt);
            calendarEvents.push({
              id: `mentorship-${ticket.id}`,
              title: `1-on-1: ${ticket.title}`,
              time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
              day: date.getDay(),
              hour: date.getHours(),
              duration: 1, // Default 1 hour
              isLive: isSessionLive(ticket.scheduledAt, null),
              joinUrl: ticket.joinUrl,
              color: "bg-success/20 border-success/30 text-success",
              type: "mentorship",
              mentorName: ticket.mentor?.name,
            });
          });
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSessionLive = (scheduledAt: string, endedAt: string | null) => {
    const now = new Date();
    const start = new Date(scheduledAt);
    const end = endedAt ? new Date(endedAt) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted mt-1">Your schedule at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-4 mr-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-primary/50" />
              <span className="text-xs text-muted">Live Sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-success/50" />
              <span className="text-xs text-muted">Mentorship</span>
            </div>
          </div>
          <button
            onClick={fetchCalendarData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoading ? "Loading..." : "Refresh"}
          </button>
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view === v
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-card border border-border text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div className="glass-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="px-3 py-3 text-xs text-muted font-medium border-r border-border">Time</div>
            {days.map((day, i) => (
              <div key={day} className={`px-3 py-3 text-center text-xs font-medium border-r border-border last:border-r-0 ${i === new Date().getDay() ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>
                <div>{day}</div>
                <div className={`mt-1 text-lg font-bold ${i === new Date().getDay() ? "text-primary" : "text-foreground"}`}>
                  {new Date(Date.now() - (new Date().getDay() - i) * 86400000).getDate()}
                </div>
              </div>
            ))}
          </div>
          {/* Time Grid */}
          <div className="relative max-h-[600px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[60px]">
                <div className="px-3 py-1 text-xs text-muted border-r border-border flex items-start pt-2">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="relative border-r border-border/30 last:border-r-0 hover:bg-card-hover/30 transition-colors">
                    {events
                      .filter((e) => e.day === dayIdx && e.hour === hour)
                      .map((event) => (
                        <div
                          key={event.id}
                          className={`absolute inset-x-1 top-1 rounded-lg border px-2 py-1.5 cursor-pointer transition-all hover:scale-[1.02] ${event.color}`}
                          style={{ height: `${event.duration * 58}px` }}
                        >
                          <div className="flex items-center gap-1.5">
                            {event.isLive && <span className="h-2 w-2 rounded-full bg-success live-pulse" />}
                            <span className="text-xs font-semibold truncate">{event.title}</span>
                          </div>
                          <span className="text-[10px] opacity-70">{event.time}</span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {days.map((day) => (
              <div key={day} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1;
              const isToday = dayNum === new Date().getDate();
              const isCurrentMonth = dayNum > 0 && dayNum <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
              const dayEvents = events.filter(e => dayNum === new Date().getDate() + (e.day - new Date().getDay()));

              return (
                <div key={i} className={`min-h-[100px] border-r border-b border-border/50 p-2 last:border-r-0 ${!isCurrentMonth ? "opacity-30" : ""} ${isToday ? "bg-primary/5" : "hover:bg-card-hover/30"} transition-colors`}>
                  <span className={`text-xs font-medium ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white" : "text-muted-foreground"}`}>
                    {isCurrentMonth ? dayNum : ""}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(e => (
                      <div key={e.id} className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate ${e.color}`}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === "day" && (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          {events
            .filter((e) => e.day === new Date().getDay())
            .sort((a, b) => a.hour - b.hour)
            .map((event) => (
              <div key={event.id} className="glass-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-foreground">{event.time.split(" ")[0]}</p>
                    <p className="text-xs text-muted">{event.time.split(" ")[1]}</p>
                  </div>
                  <div className={`w-1 h-12 rounded-full ${event.isLive ? "bg-success" : "bg-primary"}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="text-xs text-muted">{event.duration}hr session</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {event.isLive && <LiveBadge size="lg" />}
                  <a href={event.joinUrl} className={event.isLive ? "btn-primary text-sm" : "btn-secondary text-sm"}>
                    {event.isLive ? "Join Now" : "View Details"}
                  </a>
                </div>
              </div>
            ))}
          {events.filter((e) => e.day === new Date().getDay()).length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-sm text-muted-foreground">No sessions scheduled for today</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
