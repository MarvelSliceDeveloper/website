"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type TicketStatus = "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

type MentorshipTicket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  preferredDate: string | null;
  preferredTime: string | null;
  scheduledAt: string | null;
  joinUrl: string | null;
  teamsMeetingId: string | null;
  createdAt: string;
  student: { id: string; name: string; email: string };
  mentor: { id: string; name: string } | null;
};

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: "Waiting Review", className: "bg-warning/15 text-warning border-warning/25" },
  ASSIGNED: { label: "Assigned to You", className: "bg-accent/15 text-accent border-accent/25" },
  SCHEDULED: { label: "Scheduled", className: "bg-success/15 text-success border-success/25" },
  COMPLETED: { label: "Completed", className: "bg-primary/15 text-primary border-primary/25" },
  CANCELLED: { label: "Cancelled", className: "bg-muted/15 text-muted border-muted/25" },
};

const statusFilterOrder: (TicketStatus | "all")[] = ["all", "OPEN", "ASSIGNED", "SCHEDULED", "COMPLETED"];

export default function InstructorMentorshipPage() {
  return (
    <Suspense fallback={<div className="glass-card p-12 text-center"><p className="text-muted animate-pulse">Loading...</p></div>}>
      <InstructorMentorshipContent />
    </Suspense>
  );
}

function InstructorMentorshipContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as TicketStatus) || "all";

  const [tickets, setTickets] = useState<MentorshipTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">(initialStatus);
  const [actionTicket, setActionTicket] = useState<MentorshipTicket | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ tickets: MentorshipTicket[] }>("/api/mentorship/tickets");
      const myTickets = (data.tickets || []).filter(
        (t: MentorshipTicket) => t.status !== "OPEN" && t.mentor
      );
      setTickets(myTickets);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = statusFilter === "all"
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const openSchedule = (ticket: MentorshipTicket) => {
    setActionTicket(ticket);
    if (ticket.scheduledAt) {
      const d = new Date(ticket.scheduledAt);
      setScheduleDate(d.toISOString().slice(0, 10));
      setScheduleTime(d.toTimeString().slice(0, 5));
    } else {
      setScheduleDate("");
      setScheduleTime("");
    }
    setJoinUrl(ticket.joinUrl || "");
  };

  const handleSchedule = async () => {
    if (!actionTicket) return;
    setProcessing(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await api.patch(`/api/mentorship/tickets/${actionTicket.id}/schedule`, {
        scheduledAt,
        joinUrl: joinUrl || undefined,
      });
      setActionTicket(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to schedule");
    } finally { setProcessing(false); }
  };

  const handleComplete = async (ticketId: string) => {
    if (!confirm("Mark this mentorship session as completed?")) return;
    setProcessing(true);
    try {
      await api.patch(`/api/mentorship/tickets/${ticketId}/complete`);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to complete");
    } finally { setProcessing(false); }
  };

  const handleCancel = async (ticketId: string) => {
    if (!confirm("Cancel this mentorship request?")) return;
    setProcessing(true);
    try {
      await api.patch(`/api/mentorship/tickets/${ticketId}/cancel`);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to cancel");
    } finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Instructor</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Mentorship</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tickets.length} assigned ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {statusFilterOrder.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-primary/15 text-primary-hover border border-primary/25"
                : "text-muted-foreground hover:bg-card-hover border border-transparent"
            }`}
          >
            {s === "all" ? "All" : statusConfig[s as TicketStatus].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading tickets...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">\uD83D\uDCAC</div>
          <p className="text-lg font-semibold text-foreground">No tickets found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === "all"
              ? "You have no assigned mentorship tickets yet."
              : `No tickets with status "${statusConfig[statusFilter as TicketStatus]?.label || statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <div key={ticket.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusConfig[ticket.status].className}`}>
                      {statusConfig[ticket.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>Student: <strong>{ticket.student.name}</strong></span>
                    {ticket.preferredDate && (
                      <span>Preferred: {new Date(ticket.preferredDate).toLocaleDateString()} {ticket.preferredTime || ""}</span>
                    )}
                    {ticket.scheduledAt && (
                      <span>Scheduled: {new Date(ticket.scheduledAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ticket.status === "ASSIGNED" && (
                    <button onClick={() => openSchedule(ticket)} className="btn-primary text-xs">Schedule</button>
                  )}
                  {ticket.status === "SCHEDULED" && (
                    <>
                      <button onClick={() => handleComplete(ticket.id)} className="btn-primary text-xs">Mark Complete</button>
                      <button onClick={() => openSchedule(ticket)} className="btn-secondary text-xs">Edit</button>
                      {ticket.joinUrl && (
                        <a href={ticket.joinUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">Join</a>
                      )}
                    </>
                  )}
                  {(ticket.status === "ASSIGNED" || ticket.status === "SCHEDULED") && (
                    <button onClick={() => handleCancel(ticket.id)} className="btn-danger text-xs">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {actionTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-bold text-foreground">Schedule Mentorship Session</h3>
              <button onClick={() => setActionTicket(null)} className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground">
                \u2715
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Schedule a session with <strong>{actionTicket.student.name}</strong> for &quot;{actionTicket.title}&quot;
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Date</label>
                  <input type="date" className="field" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Time</label>
                  <input type="time" className="field" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Meeting Join URL</label>
                <input type="url" className="field" value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="Teams / Zoom / Google Meet link" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActionTicket(null)} className="btn-secondary text-sm">Cancel</button>
                <button type="button" onClick={handleSchedule} disabled={processing || !scheduleDate || !scheduleTime} className="btn-primary text-sm">
                  {processing ? "Scheduling..." : "Schedule Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
