"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCalendar,
  IconMovie,
  IconVideo,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

type Session = {
  id: string;
  title?: string;
  joinUrl: string;
  scheduledAt: string;
  scheduledEndAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batch: { id: string; name: string; course: { title: string } } | null;
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
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSessions = () => {
    setLoading(true);
    api
      .get<SessionsResponse>("/api/sessions")
      .then((response) => {
        setSessions(Array.isArray(response.sessions) ? response.sessions : []);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchSessions());
  }, []);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const upcoming = sessions.filter((s) => {
    const end = s.scheduledEndAt ? new Date(s.scheduledEndAt).getTime() : NaN;
    return !s.endedAt && (isNaN(end) || end > now);
  });
  const past = sessions.filter((s) => {
    const end = s.scheduledEndAt ? new Date(s.scheduledEndAt).getTime() : NaN;
    return s.endedAt || (!isNaN(end) && end <= now);
  });

  const openEdit = (session: Session) => {
    setEditingSession(session);
    setEditTitle(
      session.batch?.course
        ? `${session.batch.course.title} — ${session.batch.name}`
        : session.batch
          ? `${session.batch.name}`
          : "Mentorship Session",
    );
    setEditStart(new Date(session.scheduledAt).toISOString().slice(0, 16));
    setEditEnd(
      session.scheduledEndAt
        ? new Date(session.scheduledEndAt).toISOString().slice(0, 16)
        : new Date(new Date(session.scheduledAt).getTime() + 3600000)
            .toISOString()
            .slice(0, 16),
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditSubmitting(true);
    try {
      await api.patch(`/api/sessions/${editingSession.id}`, {
        title: editTitle,
        startDateTime: new Date(editStart).toISOString(),
        endDateTime: new Date(editEnd).toISOString(),
      });
      toast.success("Session updated successfully");
      setEditingSession(null);
      fetchSessions();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update session",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this session? This will remove all associated data (attendance, calendar events, recordings).",
      )
    )
      return;
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      fetchSessions();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel session",
      );
    }
  };

  const handleSync = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully!");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No recording found yet. Teams recordings may take a few minutes to become available.",
      );
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Sessions"
        description={`${sessions.length} total sessions`}
        action={
          <Link href="/admin/sessions/new" className="btn-primary">
            + Schedule Session
          </Link>
        }
      />

      {loading ? (
        <CardSkeleton count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconVideo}
          title="No sessions yet"
          description="Schedule a live session for a batch."
          action={
            <Link
              href="/admin/sessions/new"
              className="btn-primary inline-flex"
            >
              + Schedule Session
            </Link>
          }
        />
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
      <FormModal
        open={editingSession !== null}
        onClose={() => setEditingSession(null)}
        title="Edit Session"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingSession(null)}
              className="btn-secondary text-xs px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-session-form"
              disabled={editSubmitting}
              className="btn-primary text-xs px-4"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form
          id="edit-session-form"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Session Title
            </label>
            <input
              type="text"
              className="field"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Start
              </label>
              <input
                type="datetime-local"
                className="field"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                End
              </label>
              <input
                type="datetime-local"
                className="field"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </FormModal>
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
    <div className="glass-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
            upcoming ? "bg-primary/20" : "bg-muted/10"
          }`}
        >
          {upcoming ? <IconCalendar size={20} /> : <IconMovie size={20} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {new Date(session.scheduledAt).toLocaleString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.batch?.course
              ? `${session.batch.course.title} · ${session.batch.name}`
              : session.batch
                ? `${session.batch.name}`
                : "Standalone Session"}
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
