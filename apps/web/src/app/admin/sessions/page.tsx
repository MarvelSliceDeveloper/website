"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCalendar,
  IconMovie,
  IconVideo,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  _count?: { attendance: number };
  attendance?: { _avg: { durationSeconds: number | null } } | null;
};

type SessionsResponse = {
  sessions?: Session[];
};

export default function AdminSessionsPage() {
  usePageTitle("Sessions");

  // Edit modal state
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const confirmDelete = useConfirmDialog();

  const sessionsQuery = useApiQuery<SessionsResponse>(
    ["admin", "sessions"],
    "/api/sessions",
  );
  const sessions = sessionsQuery.data?.sessions ?? [];
  const loading = sessionsQuery.isPending;

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const upcoming = sessions.filter((s) => {
    const end = new Date(s.scheduledEndAt).getTime();
    return !s.endedAt && end > now;
  });
  const past = sessions.filter((s) => {
    const end = new Date(s.scheduledEndAt).getTime();
    return s.endedAt || end <= now;
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
    setEditEnd(new Date(session.scheduledEndAt).toISOString().slice(0, 16));
  };

  const editMutation = useMutation({
    mutationFn: ({
      id,
      title,
      startDateTime,
      endDateTime,
    }: {
      id: string;
      title: string;
      startDateTime: string;
      endDateTime: string;
    }) =>
      api.patch(`/api/sessions/${id}`, {
        title,
        startDateTime,
        endDateTime,
      }),
    onSuccess: () => {
      toast.success("Session updated successfully");
      setEditingSession(null);
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    editMutation.mutate({
      id: editingSession.id,
      title: editTitle,
      startDateTime: new Date(editStart).toISOString(),
      endDateTime: new Date(editEnd).toISOString(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/sessions/${sessionId}`),
    onSuccess: () => {
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (sessionId: string) => {
    if (
      !(await confirmDelete({
        title: "Delete Session",
        message:
          "Are you sure you want to permanently delete this session? This will remove all associated data (attendance, calendar events, recordings).",
      }))
    )
      return;
    deleteMutation.mutate(sessionId);
  };

  const syncMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/api/recordings/${sessionId}/sync`),
    onSuccess: () => {
      toast.success("Recording synced successfully!");
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Sessions"
        description={`${sessions.length} total sessions`}
        breadcrumbs={[{ label: "Sessions", href: "/admin/sessions" }]}
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
                    onSync={(id) => syncMutation.mutate(id)}
                    syncing={
                      syncMutation.isPending &&
                      syncMutation.variables === session.id
                    }
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
              disabled={editMutation.isPending}
              className="btn-primary text-xs px-4"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
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
            {!upcoming && (
              <span className="text-[10px] uppercase font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {session._count?.attendance ?? 0} attended
                {session.attendance?._avg?.durationSeconds
                  ? ` · avg ${Math.round(
                      session.attendance._avg.durationSeconds / 60,
                    )}m`
                  : ""}
              </span>
            )}
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
        {upcoming ? (
          <a
            href={session.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs shrink-0"
          >
            Join &rarr;
          </a>
        ) : (
          <Link
            href={`/admin/sessions/${session.id}`}
            className="btn-secondary text-xs shrink-0"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}
