"use client";

import { useMemo, useState } from "react";
import { IconCalendarPlus } from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type { Batch, BatchRecording } from "@/lib/api-types";
import StudentTable, {
  type StudentTableColumn,
} from "@/components/student/StudentTable";
import PaginationBar from "@/components/student/PaginationBar";
import { useLiveSessionPresence } from "@/hooks/use-live-session-presence";

function downloadIcs(event: {
  title: string;
  start: string;
  end: string;
  joinUrl?: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIcsDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const now = new Date();
  const uid = `${Date.now()}@lms`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LMS//Session//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(new Date(event.start))}`,
    `DTEND:${toIcsDate(new Date(event.end))}`,
    `SUMMARY:${event.title}`,
    event.joinUrl ? `URL:${event.joinUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

interface BatchDetailViewProps {
  batch: Batch;
  navigate: (v: ViewState) => void;
}

type Tab = "sessions" | "recordings" | "progress";

const sessionStatusConfig = {
  LIVE: {
    label: "🔴 LIVE NOW",
    classes: "border-danger/30 bg-danger/10 text-danger",
  },
  UPCOMING: {
    label: "📅 UPCOMING",
    classes: "border-brand-blue/20 bg-brand-blue-tint text-brand-blue",
  },
  PAST: { label: "Past", classes: "border-border bg-card text-muted" },
};

export default function BatchDetailView({
  batch,
  navigate,
}: BatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [recordingsPage, setRecordingsPage] = useState(1);
  const presence = useLiveSessionPresence();

  const RECORDINGS_PAGE_SIZE = 6;

  const moduleTitleById = useMemo(
    () => new Map(batch.modules.map((mod) => [mod.id, mod.title])),
    [batch.modules],
  );

  const paginatedRecordings = useMemo(() => {
    const start = (recordingsPage - 1) * RECORDINGS_PAGE_SIZE;
    const end = start + RECORDINGS_PAGE_SIZE;
    return batch.recordings.slice(start, end);
  }, [batch.recordings, recordingsPage]);

  const recordingColumns: StudentTableColumn<BatchRecording>[] = [
    {
      key: "title",
      header: "Recording",
      render: (rec) => (
        <div>
          <p className="font-medium text-foreground">
            {rec.dayLabel} — {rec.title}
          </p>
          <p className="text-xs text-muted-foreground">
            Session ID: {rec.sessionId ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "module",
      header: "Module",
      render: (rec) => (
        <span className="text-sm text-muted-foreground">
          {(rec.moduleId && moduleTitleById.get(rec.moduleId)) || "Unassigned"}
        </span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "duration",
      header: "Duration",
      render: (rec) => (
        <span className="text-sm text-muted-foreground">{rec.duration}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "progress",
      header: "Progress",
      render: (rec) => (
        <div className="w-35">
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-700"
              style={{ width: `${rec.watchedPercent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {rec.watchedPercent}%
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "",
      render: (rec) => (
        <button
          onClick={() =>
            navigate({
              view: "RECORDING_PLAYER",
              params: { batchId: batch.id, sessionId: rec.id },
            })
          }
          className="btn-secondary text-xs"
        >
          {rec.watchedPercent > 0 && rec.watchedPercent < 100
            ? "Resume"
            : "Watch"}
        </button>
      ),
      className: "text-right",
    },
  ];

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
        <h1 className="text-2xl font-bold text-foreground">
          {batch.courseTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {batch.batchLabel} · Instructor: {batch.instructor} ·{" "}
          {batch.startDate} – {batch.endDate}
        </p>
      </div>

      {/* Tab Row */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
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
            <EmptyState
              icon="📅"
              message="No sessions scheduled yet for this batch."
            />
          ) : (
            batch.sessions.map((session) => {
              const cfg = sessionStatusConfig[session.status];
              return (
                <div key={session.id} className="glass-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.classes}`}
                      >
                        {cfg.label}
                      </span>
                      <p className="font-semibold text-foreground">
                        {session.dayLabel} — {session.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {session.status === "LIVE"
                          ? // eslint-disable-next-line react-hooks/purity
                            `Started ${Math.floor((Date.now() - new Date(session.scheduledAt).getTime()) / 60000)} min ago`
                          : new Date(session.scheduledAt).toLocaleString(
                              "en-IN",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}{" "}
                        · Instructor: {session.instructor}
                      </p>
                    </div>
                    {session.status === "LIVE" && session.joinUrl && (
                      <button
                        onClick={async () => {
                          try {
                            const { api } = await import("@/lib/api");
                            await api.post(
                              `/api/attendance/${session.id}/join`,
                            );
                            presence.start(session.id);
                          } catch (err) {
                            console.error("Failed to log attendance:", err);
                          } finally {
                            window.open(
                              session.joinUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                        }}
                        className="btn-primary text-sm"
                      >
                        Join Session →
                      </button>
                    )}
                    {session.status === "UPCOMING" && (
                      <button
                        className="btn-secondary flex items-center gap-2 text-sm"
                        onClick={() =>
                          downloadIcs({
                            title: session.title,
                            start: session.scheduledAt,
                            end: session.endDateTime,
                            joinUrl: session.joinUrl,
                          })
                        }
                      >
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
        <div className="space-y-3">
          {batch.recordings.length === 0 ? (
            <EmptyState
              icon="🎬"
              message="No recordings available yet for this batch."
            />
          ) : (
            <>
              <StudentTable
                columns={recordingColumns}
                rows={paginatedRecordings}
                rowKey={(rec) => rec.id}
                emptyText="No recordings found."
              />
              <PaginationBar
                page={recordingsPage}
                pageSize={RECORDINGS_PAGE_SIZE}
                totalItems={batch.recordings.length}
                onPageChange={setRecordingsPage}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-4">
          {/* Overall */}
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-foreground">
                Overall Completion
              </p>
              <span className="text-2xl font-bold text-primary">
                {batch.overallProgress}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${batch.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Per-module */}
          <div className="glass-card divide-y divide-border/60 overflow-hidden">
            {batch.modules.map((mod) => (
              <div key={mod.id} className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {mod.title}
                  </p>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {mod.completionPercent === 100 ? "✅ " : ""}
                    {mod.completionPercent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      mod.completionPercent === 100
                        ? "bg-success"
                        : mod.completionPercent > 0
                          ? "bg-linear-to-r from-primary to-accent"
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
