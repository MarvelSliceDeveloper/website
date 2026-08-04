"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import type { Recording } from "./types";

export default function RecordingsTab({ courseId }: { courseId: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = useCallback(async () => {
    try {
      const data = await api.get<{ recordings: Recording[] }>(
        `/api/admin/courses/${courseId}/recordings`,
      );
      setRecordings(data.recordings || []);
    } catch {
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Recordings ({recordings.length})
      </h2>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted animate-pulse text-sm">
            Loading recordings...
          </p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No recordings available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordings.map((rec) => (
            <div
              key={rec.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(rec.session.scheduledAt).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rec.session.batch?.name ?? "Unknown Batch"}
                  {rec.session.module && ` \u00B7 ${rec.session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    {rec.duration > 0
                      ? `${Math.floor(rec.duration / 60)}m ${rec.duration % 60}s`
                      : "Duration unknown"}
                  </span>
                  <span className="text-xs text-muted">\u00B7</span>
                  <span className="text-xs text-muted">
                    Synced {new Date(rec.syncedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <a
                href={rec.session.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs shrink-0 ml-2"
              >
                View Recording
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
