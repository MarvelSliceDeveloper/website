"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconCalendarEvent,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconMessageCircle,
  IconTicket,
  IconX,
} from "@tabler/icons-react";

type MentorshipTicket = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  joinUrl?: string;
  notes?: string;
  student: { id: string; name: string; email: string };
  mentor?: { id: string; name: string; email: string } | null;
  course?: { id: string; title: string } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; classes: string; border: string }
> = {
  OPEN: {
    label: "Waiting review",
    icon: <IconClock size={12} />,
    classes: "border-warning/30 bg-warning/10 text-warning",
    border: "border-l-warning/50",
  },
  ASSIGNED: {
    label: "Mentor assigned",
    icon: <IconMessageCircle size={12} />,
    classes: "border-brand-blue/20 bg-brand-blue-tint text-brand-blue",
    border: "border-l-accent/40",
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: <IconCalendarEvent size={12} />,
    classes: "border-success/30 bg-success/10 text-success",
    border: "border-l-success/40",
  },
  COMPLETED: {
    label: "Resolved",
    icon: <IconCheck size={12} />,
    classes: "border-primary/30 bg-primary/10 text-primary",
    border: "border-l-primary/40",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <IconX size={12} />,
    classes: "border-danger/30 bg-danger/10 text-danger",
    border: "border-l-danger/40",
  },
};

export default function StudentMentorshipPage() {
  usePageTitle("Mentorship");
  const [tickets, setTickets] = useState<MentorshipTicket[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api
        .get<{ tickets: MentorshipTicket[] }>("/api/mentorship/tickets/my")
        .catch(() => ({ tickets: [] })),
      api
        .get<{
          courses: { id: string; title: string }[];
        }>("/api/courses/enrolled")
        .catch(() => ({ courses: [] })),
    ])
      .then(([ticketsRes, coursesRes]) => {
        setTickets(ticketsRes.tickets || []);
        setCourses(coursesRes.courses || []);
        if ((coursesRes.courses || []).length > 0)
          setCourseId(coursesRes.courses[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      const { tickets: updated } = await api.post<{
        ticket: MentorshipTicket;
        tickets: MentorshipTicket[];
      }>("/api/mentorship/tickets", {
        title: topic.length > 50 ? topic.slice(0, 50) + "..." : topic,
        description: topic,
        courseId,
        preferredDate: preferredDate || undefined,
      });
      if (updated) setTickets(updated);
      else {
        const res = await api.get<{ tickets: MentorshipTicket[] }>(
          "/api/mentorship/tickets/my",
        );
        setTickets(res.tickets || []);
      }
      toast.success("Request submitted");
      setShowForm(false);
      setTopic("");
      setPreferredDate("");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  const openTickets = tickets.filter(
    (t) =>
      t.status === "OPEN" ||
      t.status === "ASSIGNED" ||
      t.status === "SCHEDULED",
  );
  const pastTickets = tickets.filter(
    (t) => t.status === "COMPLETED" || t.status === "CANCELLED",
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-card-hover" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-card-hover"
            />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-card-hover" />
      </div>
    );
  }

  const resolvedCount = tickets.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-blue/20 bg-linear-to-r from-accent/15 via-accent/5 to-primary/10 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,192,232,0.12),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent to-cyan-500 text-xl font-bold text-white shadow-lg shadow-accent/30">
            <IconMessageCircle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
              Student
            </p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              1-on-1 Mentorship
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Need focused help? Request a private session with your instructor.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary shrink-0 text-sm"
          >
            {showForm ? "Cancel" : "Request Session"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Open Requests",
            value: openTickets.length,
            icon: IconTicket,
            bg: "bg-warning/15",
            text: "text-warning",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            icon: IconCheck,
            bg: "bg-success/15",
            text: "text-success",
          },
          {
            label: "Total Sessions",
            value: tickets.length,
            icon: IconCalendarEvent,
            bg: "bg-primary/15",
            text: "text-primary",
          },
          {
            label: "Courses",
            value: courses.length,
            icon: IconMessageCircle,
            bg: "bg-brand-blue-tint",
            text: "text-brand-blue",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-4 group hover:-translate-y-0.5 transition-all cursor-default"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
                <p className={`text-2xl font-black ${stat.text}`}>
                  {loading ? "\u2014" : stat.value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform`}
              >
                <stat.icon size={18} stroke={1.8} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New session form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-brand-blue/20 bg-brand-blue-tint p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue-tint text-brand-blue">
              <IconCalendarPlus size={16} />
            </div>
            <p className="font-semibold text-foreground">New Session Request</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="field"
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Topic / Blocker
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your doubt or blocker in detail..."
              rows={3}
              className="field resize-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Preferred Date (optional)
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="field"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      {/* Open Requests */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="sp-eyebrow">Open Requests</p>
          {openTickets.length > 0 && (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning border border-warning/20">
              {openTickets.length}
            </span>
          )}
        </div>
        {openTickets.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue-tint text-brand-blue">
              <IconMessageCircle size={28} />
            </div>
            <p className="font-semibold text-foreground">No open requests</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              All caught up! Create a new request if you need help with a topic.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm mt-1"
            >
              Request Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {openTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="sp-eyebrow">Past Sessions</p>
          {pastTickets.length > 0 && (
            <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] font-semibold text-muted border border-muted/20">
              {pastTickets.length}
            </span>
          )}
        </div>
        {pastTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No past sessions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {pastTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} showNotes />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  showNotes = false,
}: {
  ticket: MentorshipTicket;
  showNotes?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

  return (
    <div
      className={`glass-card border-l-4 p-5 transition-all hover:-translate-y-0.5 cursor-default ${cfg.border}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.classes}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="font-semibold text-foreground">{ticket.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ticket.course?.title || "General"}
            {ticket.mentor?.name && (
              <span> &middot; Mentor: {ticket.mentor.name}</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      {showNotes && ticket.notes && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {expanded ? "Hide Notes" : "View Notes"}
          </button>
          {expanded && (
            <div className="mt-2 rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
              {ticket.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
