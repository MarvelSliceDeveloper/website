"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconEdit, IconTrash, IconX, IconRefresh } from "@tabler/icons-react";

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endDateTime: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batch: { id: string; name: string; course: { title: string } };
  recording: { id: string } | null;
};

type SessionsResponse = {
  sessions?: Session[];
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSessions = () => {
    setLoading(true);
    api.get<SessionsResponse>("/api/sessions")
      .then((response) => {
        setSessions(Array.isArray(response.sessions) ? response.sessions : []);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const now = Date.now();

  const upcoming = sessions.filter((s) => {
    const end = s.endDateTime ? new Date(s.endDateTime).getTime() : NaN;
    return !s.endedAt && (isNaN(end) || end > now);
  });
  const past = sessions.filter((s) => {
    const end = s.endDateTime ? new Date(s.endDateTime).getTime() : NaN;
    return s.endedAt || (!isNaN(end) && end <= now);
  });

  const openEdit = (session: Session) => {
    setEditingSession(session);
    setEditTitle(`${session.batch.course.title} — ${session.batch.name}`);
    setEditStart(new Date(session.scheduledAt).toISOString().slice(0, 16));
    setEditEnd(new Date(new Date(session.scheduledAt).getTime() + 3600000).toISOString().slice(0, 16));
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      await api.patch(`/api/sessions/${editingSession.id}`, {
        title: editTitle,
        startDateTime: new Date(editStart).toISOString(),
        endDateTime: new Date(editEnd).toISOString(),
      });
      setEditingSession(null);
      fetchSessions();
    } catch (err: any) {
      setEditError(err.message || "Failed to update session");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to permanently delete this session? This will remove all associated data (attendance, calendar events, recordings).")) return;
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      fetchSessions();
    } catch (err: any) {
      alert(err.message || "Failed to cancel session");
    }
  };

  const handleSync = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      alert("Recording synced successfully!");
      fetchSessions();
    } catch (err: any) {
      alert(err.message || "No recording found yet. Teams recordings may take a few minutes to become available.");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sessions.length} total sessions</p>
        </div>
        <Link href="/admin/sessions/new" className="btn-primary">+ Schedule Session</Link>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">🎥</div>
          <p className="text-lg font-semibold text-foreground">No sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule a live session for a batch.</p>
          <Link href="/admin/sessions/new" className="btn-primary mt-4 inline-flex">+ Schedule Session</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    upcoming
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted mb-3">
                Past ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    upcoming={false}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onSync={handleSync}
                    syncing={syncingId === session.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="font-bold text-foreground">Edit Session</h3>
              <button onClick={() => setEditingSession(null)} className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              {editError && <div className="rounded-lg bg-danger/10 border border-danger/25 p-3 text-xs text-danger">{editError}</div>}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Session Title</label>
                <input type="text" className="field" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Start</label>
                  <input type="datetime-local" className="field" value={editStart} onChange={(e) => setEditStart(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">End</label>
                  <input type="datetime-local" className="field" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSession(null)} className="btn-secondary text-xs px-4">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="btn-primary text-xs px-4">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  upcoming,
  onEdit,
  onDelete,
  onSync,
  syncing,
}: {
  session: Session;
  upcoming: boolean;
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
  onSync?: (id: string) => void;
  syncing?: boolean;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${upcoming ? "bg-primary/20" : "bg-muted/10"
          }`}>
          {upcoming ? "📅" : "🎬"}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {new Date(session.scheduledAt).toLocaleString("en-IN", {
              weekday: "short", day: "numeric", month: "short",
              year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.batch.course.title} · {session.batch.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] uppercase font-medium bg-accent/15 text-accent px-1.5 py-0.5 rounded">
              {session.createdFrom}
            </span>
            {session.recording && (
              <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">
                Recording
              </span>
            )}
            {!upcoming && !session.recording && (
              <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                No Recording
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Sync Recording (past sessions without recording) */}
        {!upcoming && !session.recording && onSync && (
          <button
            onClick={() => onSync(session.id)}
            disabled={syncing}
            className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
            title="Sync recording from Teams"
          >
            <IconRefresh size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing" : "Sync"}
          </button>
        )}

        {/* Edit */}
        <button
          onClick={() => onEdit(session)}
          className="p-1.5 rounded-lg border border-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
          title="Edit session"
        >
          <IconEdit size={15} />
        </button>

        {/* Delete / Cancel */}
        <button
          onClick={() => onDelete(session.id)}
          className="btn-danger p-1.5"
          title="Delete session"
        >
          <IconTrash size={15} />
        </button>

        {/* Join / View */}
        <a
          href={session.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs shrink-0"
        >
          {upcoming ? "Join →" : "View Details"}
        </a>
      </div>
    </div>
  );
}
