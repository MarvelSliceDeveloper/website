"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Session } from "./types";

export default function SessionsTab({ courseId }: { courseId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: Session[] }>(
        `/api/admin/courses/${courseId}/sessions`,
      );
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSync = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully!");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No recording found yet.",
      );
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Live Sessions ({sessions.length})
        </h2>
        <Link href="/admin/sessions/new" className="btn-primary text-xs">
          + Schedule Session
        </Link>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted animate-pulse text-sm">
            Loading sessions...
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No sessions scheduled for this course yet.
          </p>
          <Link
            href="/admin/sessions/new"
            className="btn-primary mt-4 inline-flex text-sm"
          >
            + Schedule Session
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
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
                  {session.batch?.name ?? "Unknown Batch"}
                  {session.module && ` \u00B7 ${session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {session.recording ? (
                    <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">
                      Recording
                    </span>
                  ) : new Date(session.scheduledAt) > new Date() ? (
                    <span className="text-[10px] uppercase font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                      Upcoming
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                      No Recording
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {!session.recording &&
                  new Date(session.scheduledAt) <= new Date() && (
                    <button
                      onClick={() => handleSync(session.id)}
                      disabled={syncingId === session.id}
                      className="btn-secondary text-xs px-2.5 py-1.5"
                    >
                      {syncingId === session.id ? "Syncing..." : "Sync"}
                    </button>
                  )}
                {new Date(session.scheduledAt) > new Date() ? (
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
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
