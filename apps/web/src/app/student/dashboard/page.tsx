"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LiveBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

type LiveSession = {
  id: string;
  title?: string;
  joinUrl?: string;
  scheduledAt?: string;
  course?: { title?: string };
};

type MentorshipTicket = {
  id: string;
  title: string;
  status: "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

const ticketStatusLabels: Record<MentorshipTicket["status"], string> = {
  OPEN: "Waiting review",
  ASSIGNED: "Mentor assigned",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ticketStatusClasses: Record<MentorshipTicket["status"], string> = {
  OPEN: "border-warning/20 bg-warning/10 text-warning",
  ASSIGNED: "border-accent/20 bg-accent/10 text-accent",
  SCHEDULED: "border-success/20 bg-success/10 text-success",
  COMPLETED: "border-primary/20 bg-primary/10 text-primary",
  CANCELLED: "border-danger/20 bg-danger/10 text-danger",
};

const fallbackStats = [
  { label: "Enrolled Courses", value: "12", icon: "📚", color: "from-primary to-violet-500" },
  { label: "Completed", value: "8", icon: "✅", color: "from-success to-emerald-400" },
  { label: "Live Sessions Today", value: "2", icon: "🎥", color: "from-accent to-cyan-400" },
  { label: "Certificates", value: "5", icon: "🏆", color: "from-warning to-amber-400" },
];

const fallbackSessions = [
  { id: "1", title: "Advanced TypeScript Patterns", course: "TS Mastery", time: "10:00 AM", isLive: true },
  { id: "2", title: "React Server Components Deep Dive", course: "React Pro", time: "2:00 PM", isLive: false },
  { id: "3", title: "Database Design Principles", course: "Backend 101", time: "4:30 PM", isLive: false },
];

export default function DashboardPage() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [mentorshipTickets, setMentorshipTickets] = useState<MentorshipTicket[]>([]);
  const [todayEventCount, setTodayEventCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [liveData, ticketsData, todayData] = await Promise.all([
          api.get<{ sessions?: LiveSession[] }>("/api/calendar/live"),
          api.get<{ tickets?: MentorshipTicket[] }>("/api/mentorship/tickets/my"),
          api.get<{ events?: unknown[] }>("/api/calendar/events/today"),
        ]);

        if (!active) return;

        setLiveSessions(liveData.sessions || []);
        setMentorshipTickets(ticketsData.tickets || []);
        setTodayEventCount(todayData.events?.length || 0);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const liveCount = liveSessions.length;
    const mentorshipCount = mentorshipTickets.length;

    return [
      fallbackStats[0],
      fallbackStats[1],
      { ...fallbackStats[2], value: String(liveCount || 0) },
      { label: "Mentorship Requests", value: String(mentorshipCount || 0), icon: "🤝", color: "from-warning to-amber-400" },
    ];
  }, [liveSessions.length, mentorshipTickets.length]);

  const upcomingSessions = liveSessions.length
    ? liveSessions.map((session) => ({
      id: session.id,
      title: session.title || "Live session",
      course: session.course?.title || "Course session",
      time: session.scheduledAt
        ? new Date(session.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "Soon",
      isLive: Boolean(session.joinUrl),
    }))
    : fallbackSessions;

  const openMentorshipCount = mentorshipTickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "ASSIGNED").length;
  const latestMentorshipTickets = mentorshipTickets.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Learning Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track sessions, progress, and mentorship in one place.</p>
        </div>
        <Link href="/student/courses" className="btn-secondary">
          Browse Courses
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Today</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Your schedule snapshot</h2>
            </div>
            <span className="text-xs text-muted">{isLoading ? "Loading…" : `${todayEventCount} events`}</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-medium text-foreground">Live sessions</p>
              <p className="mt-1 text-xs text-muted-foreground">{liveSessions.length} sessions returned from <span className="font-medium">/api/calendar/live</span></p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-medium text-foreground">Mentorship requests</p>
              <p className="mt-1 text-xs text-muted-foreground">{openMentorshipCount} open or assigned tickets from <span className="font-medium">/api/mentorship/tickets/my</span></p>
            </div>
          </div>
        </div>

        <div className="glass-card border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Mentorship</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Need personalized support?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Request a 1-on-1 session with an instructor and get focused guidance on your blockers.
              </p>
            </div>
            <Link href="/student/mentorship" className="btn-primary w-fit">Request Session</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Mentorship</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Your request output</h2>
            </div>
            <Link href="/student/mentorship" className="text-xs font-medium text-primary transition-colors hover:text-primary-hover">
              Open page →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {latestMentorshipTickets.length > 0 ? (
              latestMentorshipTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${ticketStatusClasses[ticket.status]}`}>
                      {ticketStatusLabels[ticket.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                No mentorship requests yet. Submit one from the mentorship page and it will appear here.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Live</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">API session output</h2>
            </div>
            <Link href="/student/sessions" className="text-xs font-medium text-primary transition-colors hover:text-primary-hover">
              Open sessions →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{session.course} · {session.time}</p>
                    </div>
                    {session.isLive ? (
                      <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                        Live now
                      </span>
                    ) : (
                      <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                No live sessions are available right now.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Upcoming Live Sessions</h2>
            <Link href="/student/sessions" className="text-xs font-medium text-primary transition-colors hover:text-primary-hover">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex flex-col items-start gap-3 px-5 py-4 transition-colors hover:bg-card-hover/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-sm text-primary">
                    🎥
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.title}</p>
                    <p className="text-xs text-muted">{session.course} · {session.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {session.isLive ? (
                    <>
                      <LiveBadge />
                      <Link href="/student/sessions" className="btn-primary px-4 py-1.5 text-xs">Join</Link>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-4">
            {["Completed Module 3 in React Pro", "Earned certificate for Backend 101", "Joined live session: TS Patterns"].map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Course Progress</h3>
          <div className="space-y-4">
            {[
              { name: "TypeScript Mastery", progress: 75 },
              { name: "React Pro", progress: 45 },
              { name: "Backend 101", progress: 90 },
            ].map((course) => (
              <div key={course.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-foreground">{course.name}</span>
                  <span className="text-xs text-muted">{course.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Pages</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">Implemented student pages</h3>
            </div>
            <span className="text-xs text-muted">Real routes</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PageLinkCard href="/student/courses" title="My Courses" description="Browse enrolled courses and progress." />
            <PageLinkCard href="/student/sessions" title="Live Sessions" description="View live, upcoming, and past sessions." />
            <PageLinkCard href="/student/calendar" title="Calendar" description="See sessions and mentorship on the calendar." />
            <PageLinkCard href="/student/mentorship" title="1-on-1 Mentorship" description="Request and track support sessions." />
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-hover">Detail route</p>
            <p className="mt-1 text-sm text-foreground">Open a video session from <span className="font-medium">/student/learn/[sessionId]</span> when you want to watch a recording.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageLinkCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/30 hover:bg-card-hover/40">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  );
}
