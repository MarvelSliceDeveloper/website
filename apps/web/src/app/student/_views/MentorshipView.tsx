"use client";

import { useState } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import type { MentorshipTicket } from "@/lib/student-mock-data";
import type { EnrolledCourse } from "@/lib/student-mock-data";

interface MentorshipViewProps {
  tickets: MentorshipTicket[];
  enrolledCourses: EnrolledCourse[];
  onSubmit?: (courseId: string, topic: string, preferredDate: string) => Promise<void>;
}

const statusConfig: Record<MentorshipTicket["status"], { label: string; classes: string }> = {
  OPEN:      { label: "Waiting review",  classes: "border-warning/30 bg-warning/10 text-warning" },
  ASSIGNED:  { label: "Mentor assigned", classes: "border-accent/30 bg-accent/10 text-accent" },
  SCHEDULED: { label: "Scheduled",       classes: "border-success/30 bg-success/10 text-success" },
  COMPLETED: { label: "Resolved",        classes: "border-primary/30 bg-primary/10 text-primary" },
  CANCELLED: { label: "Cancelled",       classes: "border-danger/30 bg-danger/10 text-danger" },
};

export default function MentorshipView({ tickets, enrolledCourses, onSubmit }: MentorshipViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState(enrolledCourses[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED" || t.status === "SCHEDULED");
  const pastTickets  = tickets.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sp-eyebrow">Support</p>
          <h1 className="text-2xl font-bold text-foreground">1-on-1 Mentorship</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Need focused help? Request a private session with your instructor.
          </p>
        </div>
        <button
          id="sp-request-session-btn"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Cancel" : "Request New Session"}
        </button>
      </div>

      {submitted && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Your request was submitted! Admin will review and assign a mentor.
        </div>
      )}

      {/* Inline Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
          <p className="font-semibold text-foreground">New Session Request</p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="field"
              required
            >
              {enrolledCourses.filter((c) => c.status === "ACTIVE").map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
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
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      {/* Open / Assigned Tickets */}
      <div>
        <p className="sp-eyebrow mb-3">Open Requests</p>
        {openTickets.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-10 text-center">
            <span className="text-3xl">🎫</span>
            <p className="text-sm text-muted-foreground">No open or assigned tickets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
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
            {pastTickets.map((t) => <TicketCard key={t.id} ticket={t} showNotes />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, showNotes = false }: { ticket: MentorshipTicket; showNotes?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[ticket.status];

  return (
    <div className="glass-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{ticket.topic}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ticket.courseTitle}
            {ticket.instructor && ` · Instructor: ${ticket.instructor}`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
          {cfg.label}
        </span>
      </div>
      {showNotes && ticket.notes && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {expanded ? "Hide Notes ↑" : "View Notes →"}
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
