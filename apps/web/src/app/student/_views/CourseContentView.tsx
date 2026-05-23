"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconBook2,
  IconVideo,
  IconFileText,
  IconBookmark,
  IconPlayerPlay,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconCalendarEvent,
  IconCircleCheck,
  IconCircleDashed,
  IconLock,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { MOCK_ENABLED } from "@/lib/student-mock-data";
import type { ViewState } from "../_types/student-portal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: any;
  completionPercent: number;
  recordingsCount: number;
  sessionsCount: number;
  hasQuiz: boolean;
}

interface CourseSession {
  id: string;
  moduleId: string | null;
  moduleTitle: string | null;
  scheduledAt: string;
  endedAt: string | null;
  joinUrl: string;
  isLive: boolean;
  isUpcoming: boolean;
  hasRecording: boolean;
}

interface CourseRecording {
  id: string;
  sessionId: string;
  moduleId: string | null;
  moduleTitle: string;
  dayLabel: string;
  title: string;
  scheduledAt: string;
  duration: number;
  durationLabel: string;
  watchedPercent: number;
  isCompleted: boolean;
}

interface CourseContentData {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    status: string;
  };
  batch: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  modules: CourseModule[];
  sessions: CourseSession[];
  recordings: CourseRecording[];
  overallProgress: number;
}

interface CourseContentViewProps {
  courseId: string;
  navigate: (v: ViewState) => void;
}

type SidebarTab = "self-paced" | "live-classes" | "materials" | "notes";

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseContentView({ courseId, navigate }: CourseContentViewProps) {
  const [data, setData] = useState<CourseContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("self-paced");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // ── Fetch data ──────────────────────────────────────────────────────────

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (MOCK_ENABLED) {
        await new Promise((r) => setTimeout(r, 300));
        // No mock for this endpoint yet — will show empty state
        setError("Mock data not available for course content view");
        return;
      }
      const res = await api.get<CourseContentData>(`/api/courses/${courseId}/content`);
      setData(res);

      // Auto-select first module
      if (res.modules.length > 0) {
        setSelectedModuleId(res.modules[0].id);
        setExpandedModules(new Set([res.modules[0].id]));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const selectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };

  const selectRecording = (recordingId: string) => {
    setSelectedRecordingId(recordingId);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectedModule = data?.modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedRecording = data?.recordings.find((r) => r.id === selectedRecordingId) ?? null;
  const moduleRecordings = data?.recordings.filter((r) => r.moduleId === selectedModuleId) ?? [];

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="sp-view-enter flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading course content…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="sp-view-enter glass-card flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-4xl">📚</span>
        <p className="font-semibold text-foreground">Could not load course content</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchContent} className="btn-primary text-sm">
          Retry
        </button>
      </div>
    );
  }

  // ── Build video embed ───────────────────────────────────────────────────

  function renderVideoPlayer() {
    // If a recording is selected, show recording player
    if (selectedRecording) {
      return (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)] rounded-2xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 translate-x-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white/90">
              {selectedRecording.title}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${selectedRecording.watchedPercent}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{selectedRecording.durationLabel}</span>
              <span>{selectedRecording.watchedPercent}% watched</span>
            </div>
          </div>
        </div>
      );
    }

    // If module has a video, show module video
    if (selectedModule?.videoUrl || selectedModule?.videoEmbedId) {
      const embedId = selectedModule.videoEmbedId;
      const videoType = selectedModule.videoType;

      if (videoType === "youtube" && embedId) {
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${embedId}?rel=0`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={selectedModule.title}
            />
          </div>
        );
      }

      if (selectedModule.videoUrl) {
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
            <video className="w-full h-full" controls src={selectedModule.videoUrl} />
          </div>
        );
      }
    }

    // Default placeholder
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary backdrop-blur-sm">
            <IconVideo size={32} />
          </div>
        </div>
        <p className="absolute bottom-6 text-sm text-white/40">
          Select a module or recording to start learning
        </p>
      </div>
    );
  }

  // ── Sidebar tabs config ─────────────────────────────────────────────────

  const sidebarTabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: "self-paced", label: "SELF-PACED", icon: <IconBook2 size={20} /> },
    { id: "live-classes", label: "LIVE CLASSES", icon: <IconVideo size={20} /> },
    { id: "materials", label: "STUDY MATERIALS", icon: <IconFileText size={20} /> },
    { id: "notes", label: "NOTES / BOOKMARK", icon: <IconBookmark size={20} /> },
  ];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="sp-view-enter space-y-5">
      {/* Course header */}
      <div>
        <p className="sp-eyebrow">{data.batch?.name ?? "Course"}</p>
        <h1 className="text-2xl font-bold text-foreground">{data.course.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.course.description}
        </p>
        {/* Overall progress bar */}
        <div className="mt-3 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
              style={{ width: `${data.overallProgress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-primary">{data.overallProgress}%</span>
        </div>
      </div>

      {/* Main layout: Video + Sidebar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] lg:items-start">
        {/* Left: Video + Info */}
        <div className="space-y-4">
          {/* Video player */}
          <div className="glass-card overflow-hidden p-0">
            {renderVideoPlayer()}
          </div>

          {/* Below video: Module info + Actions */}
          {(selectedModule || selectedRecording) && (
            <div className="glass-card p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedRecording?.title ?? selectedModule?.title ?? "—"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.course.title} · {data.batch?.name ?? "—"}
                  {selectedModule?.durationSeconds && (
                    <> · Duration: {Math.floor(selectedModule.durationSeconds / 60)} min</>
                  )}
                </p>
                {selectedModule?.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {selectedModule.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary flex items-center gap-2 text-sm">
                  <IconDownload size={15} /> Download Attachment
                </button>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <IconCheck size={15} /> Mark as Complete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar with tabs */}
        <div className="space-y-0">
          {/* Tab strip (vertical icon tabs like reference) */}
          <div className="glass-card overflow-hidden">
            {/* Tab icons - horizontal strip at top */}
            <div className="flex border-b border-border">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-center transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                  }`}
                  title={tab.label}
                >
                  {tab.icon}
                  <span className="text-[9px] font-bold tracking-wider leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
              {/* ── Self-Paced: Module list ── */}
              {activeTab === "self-paced" && (
                <div className="divide-y divide-border/50">
                  {data.modules.length === 0 ? (
                    <EmptyTabState icon="📚" message="No modules have been added yet." />
                  ) : (
                    data.modules.map((mod, idx) => {
                      const isExpanded = expandedModules.has(mod.id);
                      const isSelected = selectedModuleId === mod.id;
                      const modRecordings = data.recordings.filter((r) => r.moduleId === mod.id);

                      return (
                        <div key={mod.id}>
                          {/* Module header */}
                          <button
                            onClick={() => {
                              selectModule(mod.id);
                              toggleModule(mod.id);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                              isSelected
                                ? "bg-primary/8"
                                : "hover:bg-card-hover"
                            }`}
                          >
                            {/* Completion indicator */}
                            <span className="shrink-0">
                              {mod.completionPercent === 100 ? (
                                <IconCircleCheck size={20} className="text-success" />
                              ) : mod.completionPercent > 0 ? (
                                <IconCircleDashed size={20} className="text-primary" />
                              ) : (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted text-[10px] font-bold text-muted">
                                  {idx + 1}
                                </span>
                              )}
                            </span>

                            {/* Title & meta */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {mod.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {mod.durationSeconds ? `${Math.floor(mod.durationSeconds / 60)} min` : "—"}
                                {mod.hasQuiz && " · Quiz"}
                                {mod.recordingsCount > 0 && ` · ${mod.recordingsCount} recording${mod.recordingsCount > 1 ? "s" : ""}`}
                              </p>
                            </div>

                            {/* Expand chevron */}
                            {isExpanded ? (
                              <IconChevronUp size={16} className="shrink-0 text-muted" />
                            ) : (
                              <IconChevronDown size={16} className="shrink-0 text-muted" />
                            )}
                          </button>

                          {/* Expanded: show video option + recordings */}
                          {isExpanded && (
                            <div className="space-y-0.5 bg-background/50 px-4 py-2">
                              {/* Module video */}
                              {(mod.videoUrl || mod.videoEmbedId) && (
                                <button
                                  onClick={() => {
                                    selectModule(mod.id);
                                    setSelectedRecordingId(null);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                    selectedModuleId === mod.id && !selectedRecordingId
                                      ? "bg-primary/15 text-primary border border-primary/25"
                                      : "hover:bg-card-hover border border-transparent"
                                  }`}
                                >
                                  <IconPlayerPlay size={14} className={selectedModuleId === mod.id && !selectedRecordingId ? "text-primary" : "text-muted"} />
                                  <span className="text-sm font-medium">
                                    {mod.videoType === "youtube" ? "Video Lesson" : "Module Video"}
                                  </span>
                                  {mod.durationSeconds && (
                                    <span className="ml-auto text-[11px] text-muted">
                                      {Math.floor(mod.durationSeconds / 60)}:{String(mod.durationSeconds % 60).padStart(2, "0")}
                                    </span>
                                  )}
                                </button>
                              )}

                              {/* Session recordings for this module */}
                              {modRecordings.map((rec) => (
                                <button
                                  key={rec.id}
                                  onClick={() => {
                                    selectModule(mod.id);
                                    selectRecording(rec.id);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                    selectedRecordingId === rec.id
                                      ? "bg-primary/15 text-primary border border-primary/25"
                                      : "hover:bg-card-hover border border-transparent"
                                  }`}
                                >
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                                    selectedRecordingId === rec.id ? "bg-primary" : rec.isCompleted ? "bg-success" : "bg-muted/60"
                                  }`} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {rec.dayLabel} — {rec.title}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {rec.durationLabel} · {rec.watchedPercent}% watched
                                    </p>
                                  </div>
                                  {rec.isCompleted && (
                                    <IconCircleCheck size={14} className="shrink-0 text-success" />
                                  )}
                                </button>
                              ))}

                              {modRecordings.length === 0 && !mod.videoUrl && !mod.videoEmbedId && (
                                <p className="px-3 py-2 text-xs text-muted-foreground italic">
                                  No content available yet for this module.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Live Classes ── */}
              {activeTab === "live-classes" && (
                <div className="space-y-0 divide-y divide-border/50">
                  {data.sessions.length === 0 ? (
                    <EmptyTabState icon="📅" message="No live classes scheduled yet." />
                  ) : (
                    data.sessions.map((session) => {
                      const date = new Date(session.scheduledAt);
                      const dateStr = date.toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      });
                      const timeStr = date.toLocaleTimeString("en-IN", {
                        hour: "numeric", minute: "2-digit",
                      });

                      return (
                        <div key={session.id} className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0">
                              {session.isLive ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/20">
                                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
                                </span>
                              ) : session.isUpcoming ? (
                                <IconCalendarEvent size={18} className="text-accent" />
                              ) : (
                                <IconCircleCheck size={18} className="text-muted" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {session.moduleTitle ?? "Live Session"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {dateStr} · {timeStr}
                              </p>
                              {session.isLive && (
                                <span className="mt-1.5 inline-flex rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                                  🔴 LIVE NOW
                                </span>
                              )}
                              {session.isUpcoming && (
                                <span className="mt-1.5 inline-flex rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                                  📅 UPCOMING
                                </span>
                              )}
                            </div>
                            {session.isLive && session.joinUrl && (
                              <a
                                href={session.joinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-primary shrink-0 text-xs"
                              >
                                Join Now
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Study Materials ── */}
              {activeTab === "materials" && (
                <div className="space-y-0 divide-y divide-border/50">
                  {data.modules.filter((m) => m.resources && (Array.isArray(m.resources) ? m.resources.length > 0 : false)).length === 0 ? (
                    <EmptyTabState icon="📂" message="No study materials uploaded yet." />
                  ) : (
                    data.modules
                      .filter((m) => m.resources && Array.isArray(m.resources) && m.resources.length > 0)
                      .map((mod) => (
                        <div key={mod.id} className="px-4 py-3.5">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            {mod.title}
                          </p>
                          <div className="space-y-1.5">
                            {(mod.resources as { name: string; url: string }[]).map((res, i) => (
                              <a
                                key={i}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                              >
                                <IconFileText size={15} className="text-primary shrink-0" />
                                <span className="truncate flex-1">{res.name}</span>
                                <IconDownload size={14} className="text-muted shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* ── Notes / Bookmarks ── */}
              {activeTab === "notes" && (
                <div className="p-4 space-y-4">
                  {/* Notes textarea */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Your Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Type your notes here for this course…"
                      className="field min-h-[120px] resize-y text-sm"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Notes are saved locally in your browser.
                    </p>
                  </div>

                  {/* Bookmarked modules */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bookmarked Modules
                    </p>
                    {bookmarks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Click the bookmark icon on a module to save it here.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {bookmarks.map((bId) => {
                          const mod = data.modules.find((m) => m.id === bId);
                          if (!mod) return null;
                          return (
                            <button
                              key={bId}
                              onClick={() => {
                                selectModule(bId);
                                setActiveTab("self-paced");
                              }}
                              className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground hover:bg-card-hover transition-colors"
                            >
                              <IconBookmark size={14} className="text-warning shrink-0" />
                              <span className="truncate">{mod.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyTabState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
