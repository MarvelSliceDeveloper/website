"use client";

import { useState } from "react";
import { IconCalendarPlus, IconPlayerPlay } from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type { Batch } from "@/lib/student-mock-data";

interface BatchDetailViewProps {
  batch: Batch;
  navigate: (v: ViewState) => void;
}

type Tab = "sessions" | "recordings" | "progress";

const sessionStatusConfig = {
  LIVE: { label: "🔴 LIVE NOW", classes: "border-danger/30 bg-danger/10 text-danger" },
  UPCOMING: { label: "📅 UPCOMING", classes: "border-accent/30 bg-accent/10 text-accent" },
  PAST: { label: "Past", classes: "border-border bg-card text-muted" },
};

export default function BatchDetailView({ batch, navigate }: BatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const tabs: { id: Tab; label: string }[] = [
    { id: "sessions", label: "Sessions" },
    { id: "recordings", label: "Recordings" },
    { id: "progress", label: "Progress" },
  ];

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Course</p>
        <h1 className="text-2xl font-bold text-foreground">{batch.courseTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {batch.batchLabel} · Instructor: {batch.instructor} · {batch.startDate} – {batch.endDate}
        </p>
      </div>

      {/* Tab Row */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "sessions" && (
        <div className="space-y-3">
          {batch.sessions.length === 0 ? (
            <EmptyState icon="📅" message="No sessions scheduled yet for this batch." />
          ) : (
            batch.sessions.map((session) => {
              const cfg = sessionStatusConfig[session.status];
              return (
                <div key={session.id} className="glass-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                      <p className="font-semibold text-foreground">
                        {session.dayLabel} — {session.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {session.status === "LIVE"
                          ? `Started ${Math.floor((Date.now() - new Date(session.scheduledAt).getTime()) / 60000)} min ago`
                          : new Date(session.scheduledAt).toLocaleString("en-IN", {
                              weekday: "short", day: "numeric", month: "short",
                              hour: "numeric", minute: "2-digit",
                            })}
                        {" "} · Instructor: {session.instructor}
                      </p>
                    </div>
                    {session.status === "LIVE" && session.joinUrl && (
                      <a href={session.joinUrl} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                        Join Session →
                      </a>
                    )}
                    {session.status === "UPCOMING" && (
                      <button className="btn-secondary flex items-center gap-2 text-sm">
                        <IconCalendarPlus size={15} /> Add to Calendar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "recordings" && (
        <div className="space-y-2">
          {batch.recordings.length === 0 ? (
            <EmptyState icon="🎬" message="No recordings available yet for this batch." />
          ) : (
            batch.recordings.map((rec) => (
              <button
                key={rec.id}
                onClick={() => navigate({ view: "RECORDING_PLAYER", params: { batchId: batch.id, sessionId: rec.id } })}
                className="glass-card group flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary opacity-80 group-hover:opacity-100">
                  <IconPlayerPlay size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {rec.dayLabel} — {rec.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">{rec.duration}</span>
                      {rec.watchedPercent === 100 && (
                        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] text-success">
                          ✅ Done
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${rec.watchedPercent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-muted">{rec.watchedPercent}%</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {rec.watchedPercent > 0 && rec.watchedPercent < 100 ? "Resume →" : "Watch →"}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-4">
          {/* Overall */}
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-foreground">Overall Completion</p>
              <span className="text-2xl font-bold text-primary">{batch.overallProgress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${batch.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Per-module */}
          <div className="glass-card divide-y divide-border/60 overflow-hidden">
            {batch.modules.map((mod) => (
              <div key={mod.id} className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{mod.title}</p>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {mod.completionPercent === 100 ? "✅ " : ""}{mod.completionPercent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      mod.completionPercent === 100
                        ? "bg-success"
                        : mod.completionPercent > 0
                        ? "bg-gradient-to-r from-primary to-accent"
                        : "bg-border"
                    }`}
                    style={{ width: `${mod.completionPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
