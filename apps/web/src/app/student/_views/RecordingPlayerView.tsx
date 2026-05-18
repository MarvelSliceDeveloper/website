"use client";

import { useEffect, useRef, useState } from "react";
import type { Batch } from "@/lib/student-mock-data";

interface RecordingPlayerViewProps {
  batch: Batch;
  recordingId: string;
}

export default function RecordingPlayerView({ batch, recordingId }: RecordingPlayerViewProps) {
  const recording = batch.recordings.find((r) => r.id === recordingId) ?? batch.recordings[0];
  const otherRecordings = batch.recordings.filter((r) => r.id !== recording?.id);
  const [watchedSecs, setWatchedSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated playback timer (auto-save every 10s)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setWatchedSecs((s) => s + 10);
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!recording) {
    return (
      <div className="sp-view-enter glass-card flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl">🎬</span>
        <p className="text-sm text-muted-foreground">Recording not found.</p>
      </div>
    );
  }

  const watchedPct = recording.watchedPercent;

  return (
    <div className="sp-view-enter space-y-6">
      {/* ── Video Player ─────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {recording.videoUrl ? (
          <video
            className="w-full"
            controls
            src={recording.videoUrl}
          />
        ) : (
          /* Mock player when no real URL */
          <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-card to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary backdrop-blur-sm transition-transform hover:scale-105">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 translate-x-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Mock progress bar */}
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

      {/* ── Recording Info ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {recording.dayLabel} — {recording.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {batch.courseTitle} · {batch.batchLabel} · Duration: {recording.duration}
        </p>
        {watchedSecs > 0 && (
          <p className="mt-1 text-xs text-success">
            ✅ Progress auto-saving every 10 seconds
          </p>
        )}
      </div>

      {/* ── Next Up ───────────────────────────────────────────────────────── */}
      {otherRecordings.length > 0 && (
        <div>
          <p className="sp-eyebrow mb-3">Next Up</p>
          <div className="space-y-2">
            {otherRecordings.map((rec) => (
              <div
                key={rec.id}
                className="glass-card flex items-center gap-4 p-4"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {rec.dayLabel} — {rec.title}
                  </p>
                  <p className="text-xs text-muted">{rec.duration} · {rec.watchedPercent}% watched</p>
                </div>
                <span className="text-xs text-primary">
                  {rec.watchedPercent > 0 && rec.watchedPercent < 100 ? "Resume →" : "Watch →"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
