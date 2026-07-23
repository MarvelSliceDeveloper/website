"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUsers,
  IconBook,
  IconVideo,
  IconPlayerPlay,
  IconRefresh,
  IconEdit,
  IconLink,
  IconId,
} from "@tabler/icons-react";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";

type Instructor = {
  id: string;
  name: string;
  email: string;
};

type Batch = {
  id: string;
  name: string;
  instructorId: string | null;
  courseId: string | null;
  course: { id: string; title: string } | null;
};

type Module = {
  id: string;
  title: string;
};

type Recording = {
  id: string;
  duration: number;
  syncedAt: string;
  sharePointUrl: string;
};

type CalendarEvent = {
  id: string;
};

type SessionDetail = {
  id: string;
  title: string;
  joinUrl: string;
  teamsMeetingId: string;
  scheduledAt: string;
  scheduledEndAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  instructorId: string | null;
  instructor: Instructor | null;
  batch: Batch | null;
  module: Module | null;
  recording: Recording | null;
  calendarEvent: CalendarEvent | null;
};

export default function SessionDetailPage() {
  usePageTitle("Session Details");
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(false);
  const [nowMs] = useState(() => Date.now());

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.get<{ session: SessionDetail }>(
        `/api/sessions/${sessionId}`,
      );
      setSession(data.session);
    } catch {
      setError(true);
      toast.error("Failed to load session details");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const recordingId = session?.recording?.id;

  useEffect(() => {
    if (recordingId) {
      setLoadingUrl(true);
      api
        .get<{ url: string }>(`/api/recordings/${recordingId}/url`)
        .then((data) => setPlaybackUrl(data.url))
        .catch(() => setPlaybackUrl(null))
        .finally(() => setLoadingUrl(false));
    } else {
      setPlaybackUrl(null);
    }
  }, [recordingId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully!");
      fetchSession();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No recording found yet. Teams recordings may take a few minutes to become available.",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-card-hover" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/sessions"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <IconArrowLeft size={14} /> Back to Sessions
        </Link>
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Session not found.</p>
          <Link
            href="/admin/sessions"
            className="btn-primary mt-4 inline-flex text-sm"
          >
            View All Sessions
          </Link>
        </div>
      </div>
    );
  }

  const startMs = new Date(session.scheduledAt).getTime();
  const endMs = new Date(session.scheduledEndAt).getTime();
  const isUpcoming = startMs > nowMs;
  const isLive = startMs <= nowMs && endMs >= nowMs && !session.endedAt;

  const statusLabel = session.endedAt
    ? "Cancelled"
    : isLive
      ? "Live"
      : isUpcoming
        ? "Upcoming"
        : "Completed";
  const statusColor = session.endedAt
    ? "bg-danger/15 text-danger border-danger/25"
    : isLive
      ? "bg-success/15 text-success border-success/25"
      : isUpcoming
        ? "bg-primary/15 text-primary border-primary/25"
        : "bg-muted/15 text-muted-foreground border-muted/25";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const durationMinutes = Math.round((endMs - startMs) / 60000);

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/sessions"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <IconArrowLeft size={14} /> Back to Sessions
        </Link>
        <Link
          href="/admin/sessions"
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <IconEdit size={14} /> Edit Details
        </Link>
      </div>

      {/* Title Card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {session.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono flex items-center gap-1.5">
              <IconId size={12} />
              {session.id}
              <span className="text-muted ml-2">
                &middot; Created{" "}
                {new Date(
                  parseInt(session.id.substring(0, 8), 36) * 1000 || nowMs,
                ).toLocaleDateString("en-IN")}
              </span>
            </p>
          </div>
          <span
            className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex items-center gap-1.5">
              <IconCalendar size={14} /> Date &amp; Time
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="text-foreground font-medium">
                  {formatDate(session.scheduledAt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ends</span>
                <span className="text-foreground font-medium">
                  {formatDate(session.scheduledEndAt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground font-medium">
                  {durationMinutes} min
                </span>
              </div>
              {session.endedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Actual end</span>
                  <span className="text-foreground font-medium">
                    {formatDate(session.endedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Course Context */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex items-center gap-1.5">
              <IconBook size={14} /> Course Context
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Batch</span>
                <span className="text-foreground font-medium">
                  {session.batch?.name ?? <span className="text-muted">—</span>}
                </span>
              </div>
              {session.batch?.course && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course</span>
                  <span className="text-foreground font-medium">
                    {session.batch.course.title}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Module</span>
                <span className="text-foreground font-medium">
                  {session.module?.title ?? (
                    <span className="text-muted">—</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex items-center gap-1.5">
              <IconUsers size={14} /> Instructor
            </h3>
            {session.instructor ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">
                    {session.instructor.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium">
                    {session.instructor.email}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No instructor assigned</p>
            )}
          </div>

          {/* Meeting Details */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex items-center gap-1.5">
              <IconVideo size={14} /> Meeting
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground font-medium">
                  {session.createdFrom}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Join URL</span>
                <a
                  href={session.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
                >
                  Open Link <IconLink size={12} />
                </a>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teams ID</span>
                <span className="text-foreground font-mono text-[11px]">
                  {session.teamsMeetingId}
                </span>
              </div>
              {session.calendarEvent && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calendar</span>
                  <span className="text-foreground font-medium">
                    Event synced
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Video Player + Actions */}
        <div className="space-y-6">
          {/* Recording Video Player */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex items-center gap-1.5">
                <IconPlayerPlay size={14} /> Recording
              </h3>
            </div>
            <div className="p-4">
              {session.recording ? (
                <div className="space-y-3">
                  {loadingUrl ? (
                    <div className="aspect-video rounded-lg bg-card-hover animate-pulse flex items-center justify-center">
                      <span className="text-xs text-muted">
                        Loading video...
                      </span>
                    </div>
                  ) : playbackUrl ? (
                    <video
                      controls
                      className="w-full aspect-video rounded-lg bg-black"
                      src={playbackUrl}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <div className="aspect-video rounded-lg bg-accent/10 flex flex-col items-center justify-center gap-2">
                      <IconVideo
                        size={32}
                        className="text-muted-foreground/40"
                      />
                      <p className="text-xs text-muted-foreground">
                        Playback URL unavailable
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Duration: {formatDuration(session.recording.duration)}
                    </span>
                    <span>
                      Synced{" "}
                      {new Date(session.recording.syncedAt).toLocaleDateString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
              ) : isUpcoming ? (
                <div className="aspect-video rounded-lg bg-accent/10 flex flex-col items-center justify-center gap-2">
                  <IconClock size={32} className="text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Recording will be available after the session
                  </p>
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-accent/10 flex flex-col items-center justify-center gap-3">
                  <IconVideo size={32} className="text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground text-center px-4">
                    No recording available
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <IconRefresh
                      size={14}
                      className={syncing ? "animate-spin" : ""}
                    />
                    {syncing ? "Syncing..." : "Sync Recording"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
              Quick Actions
            </h3>
            <a
              href={session.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-xs flex items-center justify-center gap-1.5"
            >
              <IconVideo size={14} />{" "}
              {isUpcoming ? "Join Session" : "Open Meeting Link"}
            </a>
            <button
              onClick={handleSync}
              disabled={syncing || !!session.recording}
              className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <IconRefresh
                size={14}
                className={syncing ? "animate-spin" : ""}
              />
              {syncing ? "Syncing..." : "Sync Recording"}
            </button>
            <Link
              href="/admin/sessions"
              className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
            >
              <IconEdit size={14} /> Edit Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
