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
  IconClock,
  IconX,
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

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

type SidebarTab = "curriculum" | "live" | "notes";

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseContentView({ courseId, navigate }: CourseContentViewProps) {
  const [data, setData] = useState<CourseContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("curriculum");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // ── Fetch data ──────────────────────────────────────────────────────────

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (MOCK_ENABLED) {
        await new Promise((r) => setTimeout(r, 300));
        setData({
          course: {
            id: courseId,
            title: "Python for Data Science",
            description: "Master Python programming and data analysis with hands-on projects. Covers NumPy, Pandas, Matplotlib, and real-world datasets.",
            thumbnailUrl: null,
            status: "PUBLISHED",
          },
          batch: {
            id: "b1",
            name: "Jan 2025",
            status: "ACTIVE",
            startDate: "2025-01-15T00:00:00.000Z",
            endDate: "2025-07-15T00:00:00.000Z",
          },
          modules: [
            { id: "m1", title: "Introduction to Python", description: "Variables, data types, and basic syntax", order: 1, videoType: "youtube", videoUrl: null, videoEmbedId: "dQw4w9WgXcQ", durationSeconds: 1800, isFreePreview: true, resources: [], completionPercent: 100, recordingsCount: 2, sessionsCount: 1, hasQuiz: true },
            { id: "m2", title: "Data Structures", description: "Lists, tuples, dictionaries, and sets", order: 2, videoType: "youtube", videoUrl: null, videoEmbedId: "R-HLU9Fl5ug", durationSeconds: 2400, isFreePreview: false, resources: [], completionPercent: 65, recordingsCount: 1, sessionsCount: 1, hasQuiz: true },
            { id: "m3", title: "NumPy Fundamentals", description: "Array operations and linear algebra", order: 3, videoType: null, videoUrl: null, videoEmbedId: null, durationSeconds: 3600, isFreePreview: false, resources: [{ name: "NumPy Cheatsheet.pdf", url: "#" }], completionPercent: 20, recordingsCount: 1, sessionsCount: 0, hasQuiz: false },
            { id: "m4", title: "Pandas for Data Analysis", description: "DataFrames, filtering, and group operations", order: 4, videoType: null, videoUrl: null, videoEmbedId: null, durationSeconds: 2700, isFreePreview: false, resources: [], completionPercent: 0, recordingsCount: 0, sessionsCount: 1, hasQuiz: false },
          ],
          sessions: [
            { id: "s1", moduleId: "m1", moduleTitle: "Introduction to Python", scheduledAt: new Date(Date.now() - 86400000).toISOString(), endedAt: new Date(Date.now() - 82800000).toISOString(), joinUrl: "#", isLive: false, isUpcoming: false, hasRecording: true },
            { id: "s2", moduleId: "m2", moduleTitle: "Data Structures", scheduledAt: new Date(Date.now() - 3600000).toISOString(), endedAt: null, joinUrl: "#", isLive: true, isUpcoming: false, hasRecording: false },
            { id: "s3", moduleId: "m4", moduleTitle: "Pandas for Data Analysis", scheduledAt: new Date(Date.now() + 86400000).toISOString(), endedAt: null, joinUrl: "#", isLive: false, isUpcoming: true, hasRecording: false },
          ],
          recordings: [
            { id: "r1", sessionId: "s1", moduleId: "m1", moduleTitle: "Introduction to Python", dayLabel: "Day 1", title: "Python Basics Live Session", scheduledAt: new Date(Date.now() - 86400000).toISOString(), duration: 3600, durationLabel: "1h 0m", watchedPercent: 100, isCompleted: true },
            { id: "r2", sessionId: "s1", moduleId: "m1", moduleTitle: "Introduction to Python", dayLabel: "Day 2", title: "Variables & Data Types Deep Dive", scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(), duration: 2700, durationLabel: "45m", watchedPercent: 100, isCompleted: true },
            { id: "r3", sessionId: "s2", moduleId: "m2", moduleTitle: "Data Structures", dayLabel: "Day 3", title: "Lists & Tuples Explained", scheduledAt: new Date(Date.now() - 3600000).toISOString(), duration: 3300, durationLabel: "55m", watchedPercent: 65, isCompleted: false },
            { id: "r4", sessionId: "s3", moduleId: "m3", moduleTitle: "NumPy Fundamentals", dayLabel: "Day 4", title: "Array Operations Workshop", scheduledAt: new Date(Date.now() - 86400000 * 3).toISOString(), duration: 3000, durationLabel: "50m", watchedPercent: 20, isCompleted: false },
          ],
          overallProgress: 46,
        });
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
    if (selectedRecording) {
      return (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
              <IconPlayerPlay size={24} className="text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute top-3 left-3 rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white/90">
            {selectedRecording.title}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${selectedRecording.watchedPercent}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>{selectedRecording.durationLabel}</span>
              <span>{selectedRecording.watchedPercent}% watched</span>
            </div>
          </div>
        </>
      );
    }

    if (selectedModule?.videoUrl || selectedModule?.videoEmbedId) {
      const embedId = selectedModule.videoEmbedId;
      const videoType = selectedModule.videoType;

      if (videoType === "youtube" && embedId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${embedId}?rel=0`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedModule.title}
          />
        );
      }

      if (selectedModule.videoUrl) {
        return (
          <video className="absolute inset-0 h-full w-full" controls src={selectedModule.videoUrl} />
        );
      }
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm">
          <IconVideo size={24} className="text-white" />
        </div>
        <p className="absolute bottom-4 text-xs text-white/40">Select a lesson to start learning</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const totalDuration = data.modules.reduce((sum, m) => sum + (m.durationSeconds || 0), 0);
  const currentModuleIndex = data.modules.findIndex((m) => m.id === selectedModuleId);
  const completedCount = data.modules.filter((m) => m.completionPercent === 100).length;

  return (
    <div className="flex min-h-screen bg-muted/5">
      {/* ── Sidebar ── */}
      <div className="w-[260px] flex-shrink-0 bg-background border-r border-border flex flex-col overflow-y-auto">
        {/* Sidebar header with progress */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-0.5">{data.course.title}</p>
          <p className="text-[11px] text-muted-foreground mb-3">{data.batch?.name ?? "Course"}</p>
          <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data.overallProgress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{completedCount} of {data.modules.length} modules complete</p>
        </div>

        {/* Tabs: Curriculum | Live | Notes */}
        <div className="flex border-b border-border">
          {(["curriculum", "live", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[11px] text-center cursor-pointer transition-colors ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "curriculum" ? "Curriculum" : tab === "live" ? "Live" : "Notes"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Curriculum ── */}
          {activeTab === "curriculum" && (
            <div>
              {data.modules.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No modules yet.</p>
              ) : (
                data.modules.map((mod, idx) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const isSelected = selectedModuleId === mod.id;
                  const isComplete = mod.completionPercent === 100;
                  const inProgress = mod.completionPercent > 0 && mod.completionPercent < 100;
                  const modRecordings = data.recordings.filter((r) => r.moduleId === mod.id);

                  return (
                    <div key={mod.id}>
                      {/* Module header */}
                      <div
                        onClick={() => { selectModule(mod.id); toggleModule(mod.id); }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/5"
                        }`}
                      >
                        {/* Icon: checkmark for complete, play for selected, number otherwise */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 border ${
                          isComplete ? "bg-primary border-primary text-white" :
                          isSelected ? "border-primary text-primary" :
                          inProgress ? "border-primary/50 text-primary" :
                          "border-border text-muted-foreground"
                        }`}>
                          {isComplete ? <IconCheck size={10} /> :
                           isSelected ? <IconPlayerPlay size={9} className="ml-0.5" /> :
                           idx + 1}
                        </div>
                        <span className={`text-xs font-medium flex-1 truncate ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}>
                          {mod.title}
                        </span>
                        <span className="text-[11px] text-muted shrink-0">
                          {mod.durationSeconds ? `${Math.floor(mod.durationSeconds / 60)}m` : "—"}
                        </span>
                        {isExpanded ? <IconChevronUp size={13} className="text-muted shrink-0" /> :
                                      <IconChevronDown size={13} className="text-muted shrink-0" />}
                      </div>

                      {/* Expanded: lessons */}
                      {isExpanded && (
                        <div className="pl-11 pr-3 pb-1.5 space-y-0.5">
                          {(mod.videoUrl || mod.videoEmbedId) && (
                            <div
                              onClick={() => { selectModule(mod.id); setSelectedRecordingId(null); }}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer transition-colors ${
                                selectedModuleId === mod.id && !selectedRecordingId
                                  ? "bg-primary/10" : "hover:bg-muted/5"
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                selectedModuleId === mod.id && !selectedRecordingId ? "bg-primary" : "bg-border"
                              }`} />
                              <span className={`text-xs flex-1 truncate ${
                                selectedModuleId === mod.id && !selectedRecordingId
                                  ? "text-primary font-medium" : "text-muted-foreground"
                              }`}>
                                Video Lesson
                              </span>
                              <span className="text-[11px] text-muted">
                                {mod.durationSeconds
                                  ? `${Math.floor(mod.durationSeconds / 60)}:${String(mod.durationSeconds % 60).padStart(2, "0")}`
                                  : "—"}
                              </span>
                            </div>
                          )}

                          {modRecordings.map((rec) => (
                            <div
                              key={rec.id}
                              onClick={() => { selectModule(mod.id); selectRecording(rec.id); }}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer transition-colors ${
                                selectedRecordingId === rec.id
                                  ? "bg-primary/10" : "hover:bg-muted/5"
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                selectedRecordingId === rec.id ? "bg-primary" :
                                rec.isCompleted ? "bg-primary" : "bg-border"
                              }`} />
                              <span className={`text-xs flex-1 truncate ${
                                selectedRecordingId === rec.id
                                  ? "text-primary font-medium" : "text-muted-foreground"
                              }`}>
                                {rec.dayLabel} — {rec.title}
                              </span>
                              <span className="text-[11px] text-muted">{rec.durationLabel}</span>
                            </div>
                          ))}

                          {modRecordings.length === 0 && !mod.videoUrl && !mod.videoEmbedId && (
                            <p className="py-1.5 text-[11px] text-muted italic">No content available</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Live ── */}
          {activeTab === "live" && (
            <div className="px-4 py-3 space-y-3">
              {data.sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No live classes scheduled.</p>
              ) : (
                data.sessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-2.5">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      session.isLive ? "bg-danger animate-pulse" :
                      session.isUpcoming ? "bg-accent" : "bg-muted"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {session.moduleTitle ?? "Live Session"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(session.scheduledAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })} · {new Date(session.scheduledAt).toLocaleTimeString("en-IN", {
                          hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                      {session.isLive && (
                        <span className="mt-1 inline-flex text-[10px] font-bold text-danger">LIVE NOW</span>
                      )}
                    </div>
                    {session.isLive && session.joinUrl && (
                      <a href={session.joinUrl} target="_blank" rel="noreferrer"
                         className="text-[10px] px-2 py-1 rounded-md bg-primary text-white shrink-0">
                        Join
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === "notes" && (
            <div className="p-4 space-y-4">
              {/* Add note input */}
              <div className="space-y-2">
                <input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="field text-xs px-2.5 py-1.5 w-full"
                />
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Write your notes here..."
                  className="field min-h-[80px] resize-y text-xs px-2.5 py-1.5 w-full"
                />
                <button
                  onClick={() => {
                    if (!noteTitle.trim() && !noteBody.trim()) return;
                    setSavedNotes((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), title: noteTitle.trim(), body: noteBody.trim(), createdAt: new Date().toISOString() },
                    ]);
                    setNoteTitle("");
                    setNoteBody("");
                  }}
                  className="btn-primary text-[11px] w-full"
                >
                  <IconCheck size={12} /> Add Note
                </button>
              </div>

              {/* Saved notes */}
              {savedNotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Saved notes ({savedNotes.length})</p>
                  {savedNotes.map((n) => (
                    <div key={n.id} className="glass-card p-2.5 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-medium text-foreground">{n.title || "Untitled"}</p>
                        <button
                          onClick={() => setSavedNotes((prev) => prev.filter((x) => x.id !== n.id))}
                          className="text-muted-foreground hover:text-danger transition-colors shrink-0"
                        >
                          <IconX size={13} />
                        </button>
                      </div>
                      {n.body && <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">{n.body}</p>}
                      <p className="text-[10px] text-muted">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookmarked modules */}
              {bookmarks.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Bookmarked</p>
                  <div className="space-y-1">
                    {bookmarks.map((bId) => {
                      const mod = data.modules.find((m) => m.id === bId);
                      if (!mod) return null;
                      return (
                        <button
                          key={bId}
                          onClick={() => { selectModule(bId); setActiveTab("curriculum"); }}
                          className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs hover:bg-muted/5 transition-colors"
                        >
                          <IconBookmark size={12} className="text-warning shrink-0" />
                          <span className="truncate text-muted-foreground">{mod.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-background border-b border-border">
          <nav className="text-xs text-muted-foreground">
            Courses / <span className="text-foreground">{data.course.title}</span>
          </nav>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs gap-1.5">
              <IconDownload size={13} /> Attachment
            </button>
            <button
              onClick={() => selectedModuleId && toggleBookmark(selectedModuleId)}
              className="btn-secondary text-xs gap-1.5"
            >
              <IconBookmark size={13} />
            </button>
          </div>
        </div>

        {/* Content: Video column + Info column */}
        <div className="flex-1 overflow-y-auto p-5 flex gap-5">
          {/* Video column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Video player with overlay */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
              {renderVideoPlayer()}
            </div>

            {/* Video meta */}
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {selectedRecording?.title ?? selectedModule?.title ?? "Select a lesson"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentModuleIndex >= 0 ? `Module ${currentModuleIndex + 1}` : ""}
                {selectedModule?.durationSeconds ? ` · ${Math.floor(selectedModule.durationSeconds / 60)} min` : ""}
                {selectedModule?.description ? ` · ${selectedModule.description.split(".")[0]}` : ""}
              </p>
            </div>

            {/* About this lesson */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-1.5">About this lesson</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedModule?.description ?? selectedRecording?.title ?? "Select a lesson from the sidebar to view details."}
              </p>
            </div>
          </div>

          {/* Info column */}
          <div className="w-[200px] flex-shrink-0 space-y-3">
            {/* Course details card */}
            <div className="glass-card p-3.5">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Course details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconClock size={14} className="text-primary shrink-0" />
                  {totalDuration > 0 ? `${(totalDuration / 3600).toFixed(1)} hrs total` : "—"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconBook2 size={14} className="text-primary shrink-0" />
                  {data.modules.length} modules
                </div>
              </div>
              <p className="text-[11px] text-muted mt-2">{data.batch?.name ?? ""}</p>
            </div>

            {/* Up next card */}
            <div className="glass-card p-3.5">
              <h4 className="text-[11px] text-muted-foreground mb-2 font-medium">Up next</h4>
              {(() => {
                const nextModule = data.modules[currentModuleIndex + 1];
                if (!nextModule) return <p className="text-xs text-muted-foreground italic">You're all caught up!</p>;
                return (
                  <div
                    onClick={() => {
                      selectModule(nextModule.id);
                      setExpandedModules((prev) => new Set([...prev, nextModule.id]));
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/5 hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <IconPlayerPlay size={13} className="text-primary ml-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{nextModule.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {nextModule.durationSeconds ? `${Math.floor(nextModule.durationSeconds / 60)} min` : "—"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-background border-t border-border">
          <button
            onClick={() => {
              const prevIdx = currentModuleIndex - 1;
              if (prevIdx >= 0) {
                const prev = data.modules[prevIdx];
                selectModule(prev.id);
                setExpandedModules((prevSet) => new Set([...prevSet, prev.id]));
              }
            }}
            disabled={currentModuleIndex <= 0}
            className="btn-secondary text-xs gap-1"
          >
            <IconChevronDown className="rotate-90" size={13} /> Previous
          </button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {currentModuleIndex >= 0 ? `Module ${currentModuleIndex + 1} of ${data.modules.length}` : ""}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => {
              const nextIdx = currentModuleIndex + 1;
              if (nextIdx < data.modules.length) {
                const next = data.modules[nextIdx];
                selectModule(next.id);
                setExpandedModules((prevSet) => new Set([...prevSet, next.id]));
              }
            }}
            disabled={currentModuleIndex >= data.modules.length - 1}
            className="btn-primary text-xs gap-1.5"
          >
            <IconCheck size={14} /> Continue
          </button>
        </div>
      </div>
    </div>
  );
}
