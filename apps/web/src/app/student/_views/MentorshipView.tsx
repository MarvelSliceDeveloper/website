"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import type { MentorshipTicket } from "@/lib/api-types";
import type { EnrolledCourse } from "@/lib/api-types";
import {
  IconUsers,
  IconPlus,
  IconX,
  IconTicket,
  IconClock,
  IconVideo,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconUserCheck,
  IconCalendarEvent,
  IconMessageCircle,
  IconBook2,
} from "@tabler/icons-react";

interface MentorshipViewProps {
  tickets: MentorshipTicket[];
  enrolledCourses: EnrolledCourse[];
  onSubmit?: (
    courseId: string,
    topic: string,
    preferredDate: string,
  ) => Promise<void>;
}

const statusConfig: Record<
  MentorshipTicket["status"],
  {
    label: string;
    badgeClasses: string;
    iconBg: string;
    icon: React.ReactNode;
  }
> = {
  OPEN: {
    label: "Waiting review",
    badgeClasses: "border-warning/30 bg-warning/10 text-warning",
    iconBg: "bg-warning/15 text-warning",
    icon: <IconClock size={16} stroke={1.8} />,
  },
  ASSIGNED: {
    label: "Mentor assigned",
    badgeClasses: "border-accent/30 bg-accent/10 text-accent",
    iconBg: "bg-accent/15 text-accent",
    icon: <IconUserCheck size={16} stroke={1.8} />,
  },
  SCHEDULED: {
    label: "Scheduled",
    badgeClasses: "border-success/30 bg-success/10 text-success",
    iconBg: "bg-success/15 text-success",
    icon: <IconCalendarEvent size={16} stroke={1.8} />,
  },
  COMPLETED: {
    label: "Resolved",
    badgeClasses: "border-primary/30 bg-primary/10 text-primary",
    iconBg: "bg-primary/15 text-primary",
    icon: <IconCircleCheck size={16} stroke={1.8} />,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClasses: "border-danger/30 bg-danger/10 text-danger",
    iconBg: "bg-danger/15 text-danger",
    icon: <IconCircleX size={16} stroke={1.8} />,
  },
};

export default function MentorshipView({
  tickets,
  enrolledCourses,
  onSubmit,
}: MentorshipViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState(enrolledCourses[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const openTickets = tickets.filter(
    (t) =>
      t.status === "OPEN" ||
      t.status === "ASSIGNED" ||
      t.status === "SCHEDULED",
  );
  const pastTickets = tickets.filter(
    (t) => t.status === "COMPLETED" || t.status === "CANCELLED",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit?.(courseId, topic, preferredDate);
      toast.success("Request submitted");
      setSubmitted(true);
      setShowForm(false);
      setTopic("");
      setPreferredDate("");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconUsers size={22} stroke={1.8} />
          </div>
          <div>
            <p className="sp-eyebrow">Support</p>
            <h1 className="text-2xl font-bold text-foreground">
              1-on-1 Mentorship
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Need focused help? Request a private session with your instructor.
            </p>
          </div>
        </div>
        <button
          id="sp-request-session-btn"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary shrink-0"
        >
          {showForm ? (
            <>
              <IconX size={15} stroke={2} />
              Cancel
            </>
          ) : (
            <>
              <IconPlus size={15} stroke={2} />
              Request New Session
            </>
          )}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-md">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Open
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {openTickets.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Resolved
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {tickets.filter((t) => t.status === "COMPLETED").length}
          </p>
        </div>
        <div className="hidden rounded-xl border border-border bg-card p-3.5 sm:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Total
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {tickets.length}
          </p>
        </div>
      </div>

      {submitted && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <IconCircleCheck size={18} stroke={1.8} className="shrink-0" />
          Your request was submitted! Admin will review and assign a mentor.
        </div>
      )}

      {/* Inline Request Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <IconMessageCircle size={16} stroke={1.8} />
            </div>
            <p className="font-semibold text-foreground">New Session Request</p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <IconBook2 size={14} /> Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="field"
              required
            >
              {enrolledCourses
                .filter((c) => c.status === "ACTIVE")
                .map((c) => (
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
              placeholder="Describe your doubt or blocker in detail…"
              rows={3}
              className="field resize-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <IconCalendarEvent size={14} /> Preferred Date (optional)
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
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
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      {/* Open / Assigned Tickets */}
      <div>
        <p className="sp-eyebrow mb-3">Open Requests</p>
        {openTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/10 text-muted">
              <IconTicket size={22} stroke={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">
              No open or assigned tickets.
            </p>
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
        <p className="sp-eyebrow mb-3">Past Sessions</p>
        {pastTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions yet.</p>
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
  const cfg = statusConfig[ticket.status];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}
          >
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {ticket.topic}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {ticket.courseTitle}
              {ticket.instructor && ` · Instructor: ${ticket.instructor}`}
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
        <div className="flex items-center gap-2 shrink-0">
          {ticket.status === "SCHEDULED" && ticket.joinUrl && (
            <a
              href={ticket.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs"
            >
              <IconVideo size={13} className="inline mr-1" />
              Join Now
            </a>
          )}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badgeClasses}`}
          >
            {cfg.label}
          </span>
        </div>
      </div>
      {showNotes && ticket.notes && (
        <div className="mt-3 pl-13">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? "Hide Notes" : "View Notes"}
            <IconChevronDown
              size={13}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
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
