"use client";

import { useEffect, useState } from "react";
import {
  IconBook2,
  IconVideo,
  IconCode,
  IconNotes,
  IconFileDescription,
  IconCalendarEvent,
  IconArrowLeft,
  IconArrowRight,
  IconBookmark,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { MOCK_ENABLED } from "@/lib/student-mock-data";
import { VideoPlayer } from "./_comps/VideoPlayer";
import { LessonSidebar } from "./_comps/LessonSidebar";
import { SessionSidebar } from "./_comps/SessionSidebar";
import type { CourseContentData, RailTab, SidebarTab, Note, CourseContentViewProps } from "./_comps/types";

const railIcons: Record<RailTab, React.ReactNode> = {
  lesson: <IconBook2 size={18} />,
  editor: <IconCode size={18} />,
  note: <IconNotes size={18} />,
  session: <IconCalendarEvent size={18} />,
  resource: <IconFileDescription size={18} />,
};

const railLabels: Record<RailTab, string> = {
  lesson: "Lessons",
  editor: "Editor",
  note: "Notes",
  session: "Session",
  resource: "Study",
};

export default function CourseContentView({ courseId, navigate, goBack }: CourseContentViewProps) {
  const [data, setData] = useState<CourseContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeRail, setActiveRail] = useState<RailTab>("lesson");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");

  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (MOCK_ENABLED) {
          await new Promise((r) => setTimeout(r, 300));
          if (cancelled) return;
          setData({
            course: { id: courseId, title: "Introduction to TypeScript", description: "Master TypeScript with hands-on projects. Covers types, generics, decorators, and real-world patterns.", thumbnailUrl: null, status: "PUBLISHED" },
            batch: { id: "b1", name: "TypeScript Batch — June 2025", status: "ACTIVE", startDate: "2025-06-01T00:00:00.000Z", endDate: "2025-12-01T00:00:00.000Z" },
            modules: [
              { id: "m1", title: "Getting started", description: "Setup, tooling, and your first .ts file", order: 1, videoType: "youtube", videoUrl: null, videoEmbedId: "dQw4w9WgXcQ", durationSeconds: 1200, isFreePreview: true, resources: [], completionPercent: 100, recordingsCount: 1, sessionsCount: 1, hasQuiz: false },
              { id: "m2", title: "Types and interfaces", description: "Understanding TypeScript type system", order: 2, videoType: "youtube", videoUrl: null, videoEmbedId: "R-HLU9Fl5ug", durationSeconds: 1800, isFreePreview: false, resources: [], completionPercent: 65, recordingsCount: 1, sessionsCount: 1, hasQuiz: true },
              { id: "m3", title: "Generics and utility types", description: "Advanced type patterns", order: 3, videoType: null, videoUrl: null, videoEmbedId: null, durationSeconds: 2400, isFreePreview: false, resources: [{ name: "Cheatsheet.pdf", url: "#" }], completionPercent: 20, recordingsCount: 0, sessionsCount: 0, hasQuiz: false },
              { id: "m4", title: "Classes and decorators", description: "OOP patterns in TypeScript", order: 4, videoType: null, videoUrl: null, videoEmbedId: null, durationSeconds: 2100, isFreePreview: false, resources: [], completionPercent: 0, recordingsCount: 0, sessionsCount: 1, hasQuiz: false },
              { id: "m5", title: "Project and assessment", description: "Final project", order: 5, videoType: null, videoUrl: null, videoEmbedId: null, durationSeconds: 1500, isFreePreview: false, resources: [], completionPercent: 0, recordingsCount: 0, sessionsCount: 0, hasQuiz: true },
            ],
            sessions: [
              { id: "s1", moduleId: "m1", moduleTitle: "Getting started", scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(), endedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), joinUrl: "#", isLive: false, isUpcoming: false, hasRecording: true },
              { id: "s2", moduleId: "m2", moduleTitle: "Types and interfaces", scheduledAt: new Date(Date.now() - 3600000).toISOString(), endedAt: null, joinUrl: "#", isLive: true, isUpcoming: false, hasRecording: false },
              { id: "s3", moduleId: "m2", moduleTitle: "Types and interfaces", scheduledAt: new Date(Date.now() + 86400000).toISOString(), endedAt: null, joinUrl: "#", isLive: false, isUpcoming: true, hasRecording: false },
              { id: "s4", moduleId: "m4", moduleTitle: "Classes and decorators", scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(), endedAt: null, joinUrl: "#", isLive: false, isUpcoming: true, hasRecording: false },
            ],
            recordings: [
              { id: "r1", sessionId: "s1", moduleId: "m1", moduleTitle: "Getting started", dayLabel: "Day 1", title: "Setup & Tooling", scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(), duration: 3600, durationLabel: "1h 0m", watchedPercent: 100, isCompleted: true },
              { id: "r2", sessionId: "s1", moduleId: "m2", moduleTitle: "Types and interfaces", dayLabel: "Day 2", title: "Type System Deep Dive", scheduledAt: new Date(Date.now() - 86400000).toISOString(), duration: 2700, durationLabel: "45m", watchedPercent: 65, isCompleted: false },
            ],
            overallProgress: 37,
          });
          return;
        }
        const res = await api.get<CourseContentData>(`/api/courses/${courseId}/content`);
        if (cancelled) return;
        setData(res);
        if (res.modules.length > 0) {
          setSelectedModuleId(res.modules[0].id);
          setExpandedModules(new Set([res.modules[0].id]));
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load course content";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, retryKey]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const selectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    setActiveRail("lesson");
    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };

  const selectRecording = (recordingId: string) => {
    setSelectedRecordingId(recordingId || null);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectedModule = data?.modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedRecording = data?.recordings.find((r) => r.id === selectedRecordingId) ?? null;
  const selectedNote = savedNotes.find((n) => n.id === selectedNoteId) ?? null;
  const currentModuleIndex = data?.modules.findIndex((m) => m.id === selectedModuleId) ?? -1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-muted/5">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading course content...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/5">
        <span className="text-4xl">📚</span>
        <p className="font-semibold text-foreground">Could not load course content</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={() => setRetryKey((k) => k + 1)} className="btn-primary text-sm">Retry</button>
      </div>
    );
  }

  // ── Main content per rail tab ──────────────────────────────────────────

  const renderLessonMain = () => (
    <>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
        <VideoPlayer module={selectedModule} recording={selectedRecording} />
      </div>
      <div className="px-1">
        <h2 className="text-base font-semibold text-foreground mt-4">
          {selectedRecording?.title ?? selectedModule?.title ?? "Select a lesson"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currentModuleIndex >= 0 ? `Module ${currentModuleIndex + 1}` : ""}
          {selectedModule?.durationSeconds ? ` · ${Math.floor(selectedModule.durationSeconds / 60)} min` : ""}
          {selectedModule?.description && selectedModule.description.split(".")[0] ? ` · ${selectedModule.description.split(".")[0]}` : ""}
        </p>
      </div>
      <div className="glass-card p-4 mt-4">
        <h3 className="text-sm font-medium text-foreground mb-1.5">About this lesson</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedModule?.description ?? selectedRecording?.title ?? "Select a lesson from the sidebar to view details."}
        </p>
      </div>
    </>
  );

  const renderEditorMain = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(220,15%,10%)] border-b border-white/5">
        <span className="text-xs text-white/40">main.ts</span>
        <span className="text-xs text-white/40">|</span>
        <span className="text-xs text-white/30">utils/helpers.ts</span>
        <div className="flex-1" />
        <span className="text-xs text-white/20">TypeScript</span>
      </div>
      <div className="flex-1 bg-[hsl(220,15%,8%)] p-4 font-mono text-sm leading-relaxed overflow-auto">
        <div className="space-y-1.5">
          <div><span className="text-blue-400">import</span><span className="text-white/70"> </span><span className="text-orange-300">{'"reflect-metadata"'}</span><span className="text-white/70">;</span></div>
          <div><span className="text-blue-400">import</span><span className="text-white/70">{' {'} </span><span className="text-yellow-300">Injectable</span><span className="text-white/70">, </span><span className="text-yellow-300">Component</span><span className="text-white/70">{' } '}</span><span className="text-blue-400">from</span><span className="text-white/70"> </span><span className="text-orange-300">{'"@nestjs/common"'}</span><span className="text-white/70">;</span></div>
          <div><br /></div>
          <div><span className="text-green-400">{'// This is a work in progress — editor coming soon'}</span></div>
          <div><br /></div>
          <div><span className="text-blue-400">interface</span><span className="text-white/70"> </span><span className="text-yellow-300">User</span><span className="text-white/70">{' {'}</span></div>
          <div className="ml-4"><span className="text-white/70">  </span><span className="text-cyan-300">id</span><span className="text-white/70">: </span><span className="text-blue-400">string</span><span className="text-white/70">;</span></div>
          <div className="ml-4"><span className="text-white/70">  </span><span className="text-cyan-300">name</span><span className="text-white/70">: </span><span className="text-blue-400">string</span><span className="text-white/70">;</span></div>
          <div className="ml-4"><span className="text-white/70">  </span><span className="text-cyan-300">email</span><span className="text-white/70">: </span><span className="text-blue-400">string</span><span className="text-white/70">;</span></div>
          <div className="ml-4"><span className="text-white/70">  </span><span className="text-cyan-300">role</span><span className="text-white/70">: </span><span className="text-blue-400">{'"STUDENT"'}</span><span className="text-white/70"> | </span><span className="text-blue-400">{'"INSTRUCTOR"'}</span><span className="text-white/70"> | </span><span className="text-blue-400">{'"ADMIN"'}</span><span className="text-white/70">;</span></div>
          <div><span className="text-white/70">{'}'}</span></div>
          <div><br /></div>
          <div><span className="text-blue-400">function</span><span className="text-white/70"> </span><span className="text-yellow-300">greet</span><span className="text-white/70">(</span><span className="text-cyan-300">user</span><span className="text-white/70">: </span><span className="text-yellow-300">User</span><span className="text-white/70">): </span><span className="text-blue-400">string</span><span className="text-white/70">{' {'}</span></div>
          <div className="ml-4"><span className="text-blue-400">return</span><span className="text-white/70"> </span><span className="text-green-400">{'`Hello, ${user.name}!`'}</span><span className="text-white/70">;</span></div>
          <div><span className="text-white/70">{'}'}</span></div>
          <div><br /></div>
          <div className="opacity-30 cursor-not-allowed"><span className="text-green-400">{'// Interactive editor will be available in a future update'}</span></div>
        </div>
      </div>
    </div>
  );

  const renderNoteMain = () => (
    selectedNote ? (
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{selectedNote.title || "Untitled"}</h2>
          <button onClick={() => setSelectedNoteId(null)} className="text-muted-foreground hover:text-foreground">
            <IconX size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedNote.body}</p>
        <p className="text-xs text-muted mt-4">
          Created {new Date(selectedNote.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
        <IconNotes size={40} className="opacity-30" />
        <p className="text-sm">Select a note from the sidebar</p>
      </div>
    )
  );

  const renderNoteSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
        <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title..." className="field text-xs px-2.5 py-1.5 w-full" />
        <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write your notes here..." className="field min-h-[80px] resize-y text-xs px-2.5 py-1.5 w-full" />
        <button onClick={() => { if (!noteTitle.trim() && !noteBody.trim()) return; setSavedNotes((prev) => [...prev, { id: crypto.randomUUID(), title: noteTitle.trim(), body: noteBody.trim(), createdAt: new Date().toISOString() }]); setNoteTitle(""); setNoteBody(""); }} className="btn-primary text-[11px] w-full">
          <IconCheck size={12} /> Add Note
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {savedNotes.length > 0 && <p className="text-[11px] font-medium text-muted-foreground">Saved notes ({savedNotes.length})</p>}
        {savedNotes.map((n) => (
          <div key={n.id} onClick={() => setSelectedNoteId(n.id === selectedNoteId ? null : n.id)} className={`glass-card p-2.5 space-y-1 cursor-pointer transition-colors ${selectedNoteId === n.id ? "ring-1 ring-primary" : ""}`}>
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-medium text-foreground">{n.title || "Untitled"}</p>
              <button onClick={(e) => { e.stopPropagation(); setSavedNotes((prev) => prev.filter((x) => x.id !== n.id)); }} className="text-muted-foreground hover:text-danger transition-colors shrink-0">
                <IconX size={13} />
              </button>
            </div>
            {n.body && <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-2">{n.body}</p>}
            <p className="text-[10px] text-muted">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </div>
        ))}
        {bookmarks.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Bookmarked</p>
            {bookmarks.map((bId) => {
              const mod = data.modules.find((m) => m.id === bId);
              if (!mod) return null;
              return (
                <button key={bId} onClick={() => { selectModule(bId); setActiveRail("lesson"); }} className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs hover:bg-muted/5 transition-colors">
                  <IconBookmark size={12} className="text-warning shrink-0" />
                  <span className="truncate text-muted-foreground">{mod.title}</span>
                </button>
              );
            })}
          </div>
        )}
        {savedNotes.length === 0 && bookmarks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No notes yet. Start adding notes above.</p>
        )}
      </div>
    </div>
  );

  const renderSessionMain = () => {
    const activeSessions = data.sessions.filter((s) => s.isLive);
    const currentSession = activeSessions.length > 0 ? activeSessions[0] : null;

    if (currentSession) {
      return (
        <div className="p-6 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-3 py-1 text-xs font-bold text-danger mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />LIVE NOW
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">{currentSession.moduleTitle ?? "Live Session"}</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {new Date(currentSession.scheduledAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {new Date(currentSession.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
          </p>
          {currentSession.joinUrl && (
            <a href={currentSession.joinUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 text-sm">
              <IconVideo size={16} /> Join Session
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
        <IconCalendarEvent size={40} className="opacity-30" />
        <p className="text-sm">No live sessions right now</p>
        <p className="text-xs">Check the sidebar for upcoming and past sessions</p>
      </div>
    );
  };

  const renderResourceMain = () => {
    const modulesWithResources = data.modules.filter((m) => m.resources && m.resources.length > 0);
    if (modulesWithResources.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
          <IconFileDescription size={40} className="opacity-30" />
          <p className="text-sm">No study material available</p>
          <p className="text-xs">Resources will appear here when the instructor adds them</p>
        </div>
      );
    }
    return (
      <div className="p-6 max-w-2xl space-y-6">
        <h2 className="text-base font-semibold text-foreground">Study Material</h2>
        {modulesWithResources.map((mod) => (
          <div key={mod.id}>
            <h3 className="text-sm font-medium text-foreground mb-2">{mod.title}</h3>
            <div className="space-y-1.5">
              {mod.resources.map((r, ri) => (
                <a key={ri} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm hover:bg-muted/5 transition-colors">
                  <IconFileDescription size={18} className="shrink-0 text-primary" />
                  <span className="text-foreground font-medium">{r.name}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResourceSidebar = () => {
    const modulesWithResources = data.modules.filter((m) => m.resources && m.resources.length > 0);
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex-shrink-0">
          <p className="text-sm font-medium text-foreground">Study Material</p>
          <p className="text-[17px] text-muted-foreground mt-0.5">{modulesWithResources.length} module{modulesWithResources.length !== 1 ? "s" : ""} with resources</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {modulesWithResources.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No resources yet</p>
          ) : (
            modulesWithResources.map((mod) => (
              <div key={mod.id} className="px-4 py-3 border-b border-border/30 last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <IconFileDescription size={14} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{mod.title}</p>
                    <p className="text-[11px] text-muted-foreground">{mod.resources.length} file{mod.resources.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderEditorSidebar = () => (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4 text-muted-foreground">
      <IconCode size={36} className="opacity-20" />
      <p className="text-xs">Interactive code editor</p>
      <p className="text-[11px]">Write, test, and debug TypeScript code directly in your browser.</p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-muted/5 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-background border-b border-border flex-shrink-0">
          <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <IconArrowLeft size={14} /> Back
          </button>
          <div className="text-xs text-muted-foreground">
            Home / Courses / <span className="text-foreground font-medium">{data.course.title}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeRail === "lesson" && renderLessonMain()}
          {activeRail === "editor" && renderEditorMain()}
          {activeRail === "note" && renderNoteMain()}
          {activeRail === "session" && renderSessionMain()}
          {activeRail === "resource" && renderResourceMain()}
        </div>

        {activeRail === "lesson" && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-background border-t border-border flex-shrink-0">
            <button onClick={() => { const prevIdx = currentModuleIndex - 1; if (prevIdx >= 0) { const prev = data.modules[prevIdx]; selectModule(prev.id); setExpandedModules((prevSet) => new Set([...prevSet, prev.id])); } }} disabled={currentModuleIndex <= 0} className="btn-secondary text-xs gap-1">
              <IconArrowLeft size={13} /> Previous
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{currentModuleIndex >= 0 ? `Module ${currentModuleIndex + 1} of ${data.modules.length}` : ""}</span>
            <div className="flex-1" />
            <button onClick={() => { const nextIdx = currentModuleIndex + 1; if (nextIdx < data.modules.length) { const next = data.modules[nextIdx]; selectModule(next.id); setExpandedModules((prevSet) => new Set([...prevSet, next.id])); } }} disabled={currentModuleIndex >= data.modules.length - 1} className="btn-primary text-xs gap-1.5">
              Continue <IconArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="w-[340px] flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden">
        {activeRail === "lesson" && <LessonSidebar data={data} selectedModuleId={selectedModuleId} selectedRecordingId={selectedRecordingId} expandedModules={expandedModules} bookmarks={bookmarks} onSelectModule={selectModule} onSelectRecording={selectRecording} onToggleModule={toggleModule} onToggleBookmark={toggleBookmark} />}
        {activeRail === "editor" && renderEditorSidebar()}
        {activeRail === "note" && renderNoteSidebar()}
        {activeRail === "session" && <SessionSidebar data={data} sidebarTab={sidebarTab} onSetSidebarTab={setSidebarTab} />}
        {activeRail === "resource" && renderResourceSidebar()}
      </div>

      <div className="w-[118px] flex-shrink-0 bg-background border-l border-border flex flex-col items-center py-3 overflow-y-auto">
        {(["lesson", "editor", "note", "session", "resource"] as RailTab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveRail(tab)} className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors mb-0.5 ${activeRail === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground"}`} title={railLabels[tab]}>
            {railIcons[tab]}
            <span className="text-[15px] font-medium leading-none">{railLabels[tab]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
