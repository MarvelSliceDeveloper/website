"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
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

  useEffect(() => {
    api.get<SessionsResponse>("/api/sessions")
      .then((response) => {
        setSessions(Array.isArray(response.sessions) ? response.sessions : []);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const upcoming = sessions.filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now);
  const past = sessions.filter((s) => s.endedAt || new Date(s.scheduledAt) < now);

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
                  <SessionCard key={session.id} session={session} upcoming />
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
                  <SessionCard key={session.id} session={session} upcoming={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, upcoming }: { session: Session; upcoming: boolean }) {
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
      <a
        href={session.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary text-xs shrink-0"
      >
        {upcoming ? "Join →" : "View Details"}
      </a>
    </div>
  );
}
