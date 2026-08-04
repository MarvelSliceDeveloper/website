"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Batch } from "@/lib/api-types";

interface RecordingPlayerViewProps {
  batch: Batch;
  recordingId: string;
  onSelectRecording?: (recordingId: string) => void;
}

export default function RecordingPlayerView({
  batch,
  recordingId,
  onSelectRecording,
}: RecordingPlayerViewProps) {
  const recording =
    batch.recordings.find((r) => r.id === recordingId) ?? batch.recordings[0];
  const [openModuleId, setOpenModuleId] = useState(batch.modules[0]?.id ?? "");
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastReportedRef = useRef(0);

  const persistProgress = (watchedSeconds: number, completed?: boolean) => {
    if (!recording) return;
    const now = Date.now();
    if (!completed && now - lastReportedRef.current < 10_000) return;
    lastReportedRef.current = now;

    api
      .post("/api/recordings/progress", {
        recordingId: recording.id,
        watchedSeconds,
        completed,
      })
      .catch((err: unknown) => {
        console.error("Failed to save recording progress:", err);
      });

    const video = videoRef.current;
    const total = video?.duration ?? 0;
    const current = progressMap[recording.id] ?? recording.watchedPercent;
    const percent = completed
      ? 100
      : total > 0
        ? Math.min(100, Math.round((watchedSeconds / total) * 100))
        : current;
    if (percent > current) {
      setProgressMap((prev) => ({ ...prev, [recording.id]: percent }));
    }
  };

  if (!recording) {
    return (
      <div className="sp-view-enter glass-card flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl">🎬</span>
        <p className="text-sm text-muted-foreground">Recording not found.</p>
      </div>
    );
  }

  const watchedPct = progressMap[recording.id] ?? recording.watchedPercent;
  const modules =
    batch.modules.length > 0
      ? batch.modules
      : [
          {
            id: "default-module",
            title: "Session Recordings",
            completionPercent: 0,
          },
        ];

  const recordingsByModule = modules.map((module) => ({
    module,
    recordings: batch.recordings.filter((item) => item.moduleId === module.id),
  }));

  const unassignedRecordings = batch.recordings.filter(
    (item) =>
      !item.moduleId || !modules.some((module) => module.id === item.moduleId),
  );

  const groups =
    unassignedRecordings.length > 0
      ? [
          ...recordingsByModule,
          {
            module: {
              id: "unassigned",
              title: "Unassigned",
              completionPercent: 0,
            },
            recordings: unassignedRecordings,
          },
        ]
      : recordingsByModule;

  return (
    <div className="sp-view-enter grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
      <div className="space-y-4">
        <div className="glass-card overflow-hidden">
          {recording.videoUrl ? (
            <video
              ref={videoRef}
              className="w-full"
              controls
              src={recording.videoUrl}
              onTimeUpdate={(e) => persistProgress(e.currentTarget.currentTime)}
              onEnded={(e) =>
                persistProgress(
                  e.currentTarget.duration || e.currentTarget.currentTime,
                  true,
                )
              }
            />
          ) : (
            <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-linear-to-br from-card to-background">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary backdrop-blur-sm transition-transform hover:scale-105">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-8 w-8 translate-x-0.5"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${watchedPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Recording preview — real URL required</span>
                  <span>{watchedPct}% watched</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {recording.dayLabel} — {recording.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {batch.courseTitle} · {batch.batchLabel} · Duration:{" "}
              {recording.duration}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm">
              Download Attachment
            </button>
            <button
              className="btn-primary text-sm"
              onClick={() => {
                const video = videoRef.current;
                persistProgress(video?.duration ?? 0, true);
                toast.success("Recording marked as complete");
              }}
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>

      <aside className="glass-card p-4">
        <p className="sp-eyebrow mb-3">Online Session Recordings</p>
        <div className="space-y-3">
          {groups.map(({ module, recordings }) => {
            const expanded = openModuleId === module.id;
            return (
              <div
                key={module.id}
                className="rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => setOpenModuleId(expanded ? "" : module.id)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="font-medium text-foreground">
                    {module.title}
                  </span>
                  <span className="text-xs text-muted">
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded ? (
                  <div className="space-y-2 border-t border-border p-2">
                    {recordings.length === 0 ? (
                      <p className="px-2 py-2 text-xs text-muted-foreground">
                        No recordings in this module.
                      </p>
                    ) : (
                      recordings.map((rec) => {
                        const active = rec.id === recording.id;
                        return (
                          <button
                            key={rec.id}
                            onClick={() => onSelectRecording?.(rec.id)}
                            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                              active
                                ? "border-primary/30 bg-primary/15 text-primary"
                                : "border-border bg-card hover:bg-card-hover"
                            }`}
                          >
                            <span
                              className={`mt-1 h-2 w-2 rounded-full ${active ? "bg-primary" : "bg-muted/70"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {rec.dayLabel} — {rec.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {rec.duration} ·{" "}
                                {progressMap[rec.id] ?? rec.watchedPercent}%
                                watched
                              </span>
                              <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border">
                                <span
                                  className="block h-full rounded-full bg-linear-to-r from-primary to-accent"
                                  style={{
                                    width: `${progressMap[rec.id] ?? rec.watchedPercent}%`,
                                  }}
                                />
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
