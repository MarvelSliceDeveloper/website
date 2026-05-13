"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, LiveBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

type Session = {
  id: string;
  title?: string;
  scheduledAt?: string;
  createdFrom?: string;
  joinUrl?: string;
  course?: { title?: string };
  module?: { title?: string };
  recording?: { id?: string } | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await api.get<{ sessions?: Session[] }>("/api/sessions");

        if (!active) return;
        setSessions(data.sessions || []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load sessions");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadSessions();

    return () => {
      active = false;
    };
  }, []);

  const liveSessions = sessions.filter((session) => Boolean(session.joinUrl));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Sessions</h1>
          <p className="mt-1 text-sm text-muted">Upcoming and past sessions loaded from the API</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {liveSessions.length > 0 && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-5">
          {liveSessions.map((session) => (
            <div key={session.id} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-xl">🎥</div>
                <div>
                  <LiveBadge size="lg" />
                  <p className="mt-1 text-base font-semibold text-foreground">{session.title || "Live session"}</p>
                  <p className="text-xs text-muted">{session.course?.title || "Course"} {session.module?.title ? `· ${session.module.title}` : ""}</p>
                </div>
              </div>
              <Link href={session.joinUrl || `/student/learn/${session.id}`} className="btn-primary text-sm">
                Join →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted">Session</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted">Date</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted">Status</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={4}>Loading sessions…</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={4}>No sessions found.</td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const status = session.joinUrl ? "live" : session.recording ? "completed" : "scheduled";

                  return (
                    <tr key={session.id} className="transition-colors hover:bg-card-hover/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">{session.title || "Live session"}</p>
                        <p className="text-xs text-muted">{session.course?.title || "Course"}{session.module?.title ? ` · ${session.module.title}` : ""}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "TBD"}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={status} /></td>
                      <td className="px-6 py-4">
                        {status === "live" ? (
                          <Link href={session.joinUrl || `/student/learn/${session.id}`} className="btn-primary px-3 py-1.5 text-xs">Join</Link>
                        ) : status === "completed" ? (
                          <Link href={`/student/learn/${session.id}`} className="text-xs text-primary hover:text-primary-hover">Recording</Link>
                        ) : (
                          <span className="text-xs text-muted">Upcoming</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
