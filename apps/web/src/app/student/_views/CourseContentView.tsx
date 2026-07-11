"use client";

import { useEffect, useState } from "react";
import {
  IconBook2,
  IconVideo,
  IconPencil,
  IconCode,
  IconNotes,
  IconFileDescription,
  IconCalendarEvent,
  IconArrowLeft,
  IconArrowRight,
  IconBookmark,
  IconCheck,
  IconX,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { MOCK_ENABLED } from "@/lib/student-mock-data";
import { VideoPlayer } from "./_comps/VideoPlayer";
import { LessonSidebar } from "./_comps/LessonSidebar";
import { SessionSidebar } from "./_comps/SessionSidebar";
import RichEditor from "@/components/editor/RichEditor";
import StickyNoteWidget from "@/components/StickyNoteWidget";
import type {
  CourseContentData,
  CourseLesson,
  RailTab,
  SidebarTab,
  CourseContentViewProps,
} from "./_comps/types";

interface ApiNote {
  id: string;
  title: string;
  body: string;
  moduleId: string | null;
  createdAt: string;
  updatedAt: string;
}

const railIcons: Record<RailTab, React.ReactNode> = {
  lesson: <IconBook2 size={18} />,
  editor: <IconCode size={18} />,
  note: <IconNotes size={18} />,
  session: <IconCalendarEvent size={18} />,
  resource: <IconFileDescription size={18} />,
};

const railLabels: Record<RailTab, string> = {
  lesson: "Lessons",
  editor: "Code",
  note: "Notes",
  session: "Session",
  resource: "Study",
};

export default function CourseContentView({
  courseId,
  goBack,
}: CourseContentViewProps) {
  const [data, setData] = useState<CourseContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeRail, setActiveRail] = useState<RailTab>("lesson");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null,
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [retryKey, setRetryKey] = useState(0);

  // Notes state (API-backed)
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteBody, setEditNoteBody] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const [newNoteBody, setNewNoteBody] = useState("");

  const [showNewNote, setShowNewNote] = useState(false);

  // Sticky-note widget state (replaces old inline sticky)
  const [showStickyWidget, setShowStickyWidget] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  // Bookmarks (in-memory, UI only)
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────

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
            course: {
              id: courseId,
              title: "Introduction to TypeScript",
              description:
                "Master TypeScript with hands-on projects. Covers types, generics, decorators, and real-world patterns.",
              thumbnailUrl: null,
              status: "PUBLISHED",
            },
            batch: {
              id: "b1",
              name: "TypeScript Batch — June 2025",
              status: "ACTIVE",
              startDate: "2025-06-01T00:00:00.000Z",
              endDate: "2025-12-01T00:00:00.000Z",
            },
            modules: [
              {
                id: "m1",
                title: "Getting started",
                description: "Setup, tooling, and your first .ts file",
                order: 1,
                isFreePreview: true,
                lessons: [
                  {
                    id: "l1",
                    title: "Introduction & Setup",
                    description: "Installing TypeScript",
                    order: 1,
                    videoType: "youtube",
                    videoUrl: null,
                    videoEmbedId: "dQw4w9WgXcQ",
                    durationSeconds: 600,
                    isFreePreview: true,
                    resources: [],
                  },
                  {
                    id: "l2",
                    title: "Your First Program",
                    description: "Hello World",
                    order: 2,
                    videoType: "youtube",
                    videoUrl: null,
                    videoEmbedId: "dQw4w9WgXcQ",
                    durationSeconds: 600,
                    isFreePreview: true,
                    resources: [],
                  },
                ],
                completionPercent: 100,
                recordingsCount: 1,
                sessionsCount: 1,
                hasQuiz: false,
              },
              {
                id: "m2",
                title: "Types and interfaces",
                description: "Understanding TypeScript type system",
                order: 2,
                isFreePreview: false,
                lessons: [
                  {
                    id: "l3",
                    title: "Basic Types",
                    description: "string, number, boolean",
                    order: 1,
                    videoType: "youtube",
                    videoUrl: null,
                    videoEmbedId: "R-HLU9Fl5ug",
                    durationSeconds: 900,
                    isFreePreview: false,
                    resources: [],
                  },
                  {
                    id: "l4",
                    title: "Interfaces",
                    description: "Defining shapes",
                    order: 2,
                    videoType: "youtube",
                    videoUrl: null,
                    videoEmbedId: "R-HLU9Fl5ug",
                    durationSeconds: 900,
                    isFreePreview: false,
                    resources: [],
                  },
                ],
                completionPercent: 65,
                recordingsCount: 1,
                sessionsCount: 1,
                hasQuiz: true,
              },
              {
                id: "m3",
                title: "Generics and utility types",
                description: "Advanced type patterns",
                order: 3,
                isFreePreview: false,
                lessons: [
                  {
                    id: "l5",
                    title: "Generics",
                    description: "Reusable type parameters",
                    order: 1,
                    videoType: null,
                    videoUrl: null,
                    videoEmbedId: null,
                    durationSeconds: 1200,
                    isFreePreview: false,
                    resources: [{ name: "Cheatsheet.pdf", url: "#" }],
                  },
                  {
                    id: "l6",
                    title: "Utility Types",
                    description: "Partial, Pick, Omit",
                    order: 2,
                    videoType: null,
                    videoUrl: null,
                    videoEmbedId: null,
                    durationSeconds: 1200,
                    isFreePreview: false,
                    resources: [],
                  },
                ],
                completionPercent: 20,
                recordingsCount: 0,
                sessionsCount: 0,
                hasQuiz: false,
              },
              {
                id: "m4",
                title: "Classes and decorators",
                description: "OOP patterns in TypeScript",
                order: 4,
                isFreePreview: false,
                lessons: [
                  {
                    id: "l7",
                    title: "Classes",
                    description: "Class syntax in TS",
                    order: 1,
                    videoType: null,
                    videoUrl: null,
                    videoEmbedId: null,
                    durationSeconds: 1050,
                    isFreePreview: false,
                    resources: [],
                  },
                  {
                    id: "l8",
                    title: "Decorators",
                    description: "Annotation pattern",
                    order: 2,
                    videoType: null,
                    videoUrl: null,
                    videoEmbedId: null,
                    durationSeconds: 1050,
                    isFreePreview: false,
                    resources: [],
                  },
                ],
                completionPercent: 0,
                recordingsCount: 0,
                sessionsCount: 1,
                hasQuiz: false,
              },
              {
                id: "m5",
                title: "Project and assessment",
                description: "Final project",
                order: 5,
                isFreePreview: false,
                lessons: [
                  {
                    id: "l9",
                    title: "Final Project",
                    description: "Build a TS app",
                    order: 1,
                    videoType: null,
                    videoUrl: null,
                    videoEmbedId: null,
                    durationSeconds: 1500,
                    isFreePreview: false,
                    resources: [],
                  },
                ],
                completionPercent: 0,
                recordingsCount: 0,
                sessionsCount: 0,
                hasQuiz: true,
              },
            ],
            sessions: [
              {
                id: "s1",
                moduleId: "m1",
                moduleTitle: "Getting started",
                scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                endedAt: new Date(
                  Date.now() - 86400000 * 2 + 3600000,
                ).toISOString(),
                joinUrl: "#",
                isLive: false,
                isUpcoming: false,
                hasRecording: true,
              },
              {
                id: "s2",
                moduleId: "m2",
                moduleTitle: "Types and interfaces",
                scheduledAt: new Date(Date.now() - 3600000).toISOString(),
                endedAt: null,
                joinUrl: "#",
                isLive: true,
                isUpcoming: false,
                hasRecording: false,
              },
              {
                id: "s3",
                moduleId: "m2",
                moduleTitle: "Types and interfaces",
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                endedAt: null,
                joinUrl: "#",
                isLive: false,
                isUpcoming: true,
                hasRecording: false,
              },
              {
                id: "s4",
                moduleId: "m4",
                moduleTitle: "Classes and decorators",
                scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
                endedAt: null,
                joinUrl: "#",
                isLive: false,
                isUpcoming: true,
                hasRecording: false,
              },
            ],
            recordings: [
              {
                id: "r1",
                sessionId: "s1",
                moduleId: "m1",
                moduleTitle: "Getting started",
                dayLabel: "Day 1",
                title: "Setup & Tooling",
                scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                duration: 3600,
                durationLabel: "1h 0m",
                watchedPercent: 100,
                isCompleted: true,
              },
              {
                id: "r2",
                sessionId: "s1",
                moduleId: "m2",
                moduleTitle: "Types and interfaces",
                dayLabel: "Day 2",
                title: "Type System Deep Dive",
                scheduledAt: new Date(Date.now() - 86400000).toISOString(),
                duration: 2700,
                durationLabel: "45m",
                watchedPercent: 65,
                isCompleted: false,
              },
            ],
            overallProgress: 37,
          });
          return;
        }
        const res = await api.get<CourseContentData>(
          `/api/courses/${courseId}/content`,
        );
        if (cancelled) return;
        setData(res);
        if (res.modules.length > 0) {
          const firstModule = res.modules[0];
          setSelectedModuleId(firstModule.id);
          setExpandedModules(new Set([firstModule.id]));
          if (firstModule.lessons.length > 0) {
            setSelectedLessonId(firstModule.lessons[0].id);
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load course content";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, retryKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ notes: ApiNote[] }>(
          `/api/notes?courseId=${courseId}`,
        );
        if (!cancelled) setNotes(data.notes || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // ── Note CRUD ──────────────────────────────────────────────────────────

  async function createNote() {
    if (!newNoteTitle.trim() && !newNoteBody.trim()) return;
    try {
      // Check if there's an existing note for this module to append to
      const existingModuleNote = notes.find(
        (n) => n.moduleId === selectedModuleId,
      );
      let body = newNoteBody;

      if (existingModuleNote) {
        // Append with date separator
        const todayHeader = new Date().toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        body = `${existingModuleNote.body}\n\n<hr/>\n\n<!-- DATE: ${todayHeader} -->\n${newNoteBody}`;
      }

      const res = await api.post<{ note: ApiNote }>("/api/notes", {
        courseId,
        moduleId: selectedModuleId || undefined,
        title:
          newNoteTitle.trim() || `${data?.course?.title ?? "Notes"} - Notes`,
        body,
      });
      setNotes((prev) => [res.note, ...prev]);
      setNewNoteTitle("");
      setNewNoteBody("");
      setEditingNoteId(null);
      // If we created a note for the current module, switch to show it
      if (selectedModuleId && !existingModuleNote) {
        setSelectedNoteId(res.note.id);
      }
    } catch {
      /* ignore */
    }
  }

  async function deleteNote(id: string) {
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) setSelectedNoteId(null);
      if (editingNoteId === id) setEditingNoteId(null);
    } catch {
      /* ignore */
    }
  }

  async function saveNoteEdit(id: string) {
    try {
      await api.patch(`/api/notes/${id}`, {
        title: editNoteTitle,
        body: editNoteBody,
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, title: editNoteTitle, body: editNoteBody } : n,
        ),
      );
      setEditingNoteId(null);
    } catch {
      /* ignore */
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────

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

  const selectLesson = (lesson: CourseLesson, moduleId: string) => {
    setSelectedLessonId(lesson.id);
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
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const selectedModule =
    data?.modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedLesson =
    selectedModule?.lessons.find((l) => l.id === selectedLessonId) ?? null;
  const selectedRecording =
    data?.recordings.find((r) => r.id === selectedRecordingId) ?? null;
  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;
  const currentModuleIndex =
    data?.modules.findIndex((m) => m.id === selectedModuleId) ?? -1;
  const currentLessonIndex =
    selectedModule?.lessons.findIndex((l) => l.id === selectedLessonId) ?? -1;

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-muted/5">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">
          Loading course content...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/5">
        <span className="text-4xl">📚</span>
        <p className="font-semibold text-foreground">
          Could not load course content
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          className="btn-primary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Main content per rail tab ──────────────────────────────────────────

  const renderLessonMain = () => (
    <>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
        <VideoPlayer lesson={selectedLesson} recording={selectedRecording} />
      </div>
      <div className="px-1">
        <h2 className="text-base font-semibold text-foreground mt-4">
          {selectedRecording?.title ??
            selectedLesson?.title ??
            selectedModule?.title ??
            "Select a lesson"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currentLessonIndex >= 0 ? `Lesson ${currentLessonIndex + 1}` : ""}
          {currentModuleIndex >= 0 ? ` · Module ${currentModuleIndex + 1}` : ""}
          {selectedLesson?.durationSeconds
            ? ` · ${Math.floor(selectedLesson.durationSeconds / 60)} min`
            : ""}
          {selectedLesson?.description?.split(".")[0]
            ? ` · ${selectedLesson.description.split(".")[0]}`
            : ""}
        </p>
      </div>
      <div className="glass-card p-4 mt-4">
        <h3 className="text-sm font-medium text-foreground mb-1.5">
          About this lesson
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedLesson?.description ??
            selectedRecording?.title ??
            "Select a lesson from the sidebar to view details."}
        </p>
      </div>
    </>
  );

  // ── Scratchpad tab (was "Editor") ──────────────────────────────────────

  const renderCodeEditorMain = () => (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Code Editor{" "}
          {selectedLesson
            ? `— ${selectedLesson.title}`
            : selectedModule
              ? `— ${selectedModule.title}`
              : ""}
        </h2>
      </div>
      {!selectedLesson && !selectedModule ? (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3 text-muted-foreground">
          <IconCode size={40} className="opacity-30" />
          <p className="text-sm">Select a lesson to open the code editor</p>
        </div>
      ) : (
        <textarea
          className="w-full h-80 font-mono text-sm bg-[#1e1e2e] text-[#cdd6f4] border border-border rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="// Code editor coming soon..."
          readOnly
        />
      )}
    </div>
  );

  const renderCodeEditorSidebar = () => (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4 text-muted-foreground">
      <IconCode size={36} className="opacity-20" />
      <p className="text-xs font-medium text-foreground">Code Editor</p>
      <p className="text-[11px]">Edit and run code alongside your lessons.</p>
    </div>
  );

  // ── Notes tab ──────────────────────────────────────────────────────────

  const renderNoteMain = () => {
    // Handle creating a new note (triggered from sidebar "Add Note" button)
    if (editingNoteId === "new") {
      return (
        <div className="p-6 max-w-2xl space-y-3">
          <input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="field w-full text-base font-semibold"
            autoFocus
          />
          <RichEditor
            content={newNoteBody}
            onChange={setNewNoteBody}
            placeholder="Write your note..."
            minHeight="300px"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditingNoteId(null);
                setNewNoteTitle("");
                setNewNoteBody("");
              }}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button onClick={createNote} className="btn-primary text-xs">
              <IconCheck size={12} /> Save Note
            </button>
          </div>
        </div>
      );
    }

    if (editingNoteId) {
      const note = notes.find((n) => n.id === editingNoteId);
      if (!note) return null;
      return (
        <div className="p-6 max-w-2xl space-y-3">
          <input
            type="text"
            value={editNoteTitle}
            onChange={(e) => setEditNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="field w-full text-base font-semibold"
          />
          <RichEditor
            content={editNoteBody}
            onChange={setEditNoteBody}
            placeholder="Write your note..."
            minHeight="200px"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingNoteId(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => saveNoteEdit(note.id)}
              className="btn-primary text-xs"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    if (selectedNote) {
      return (
        <div className="p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedNote.title || "Untitled"}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setEditingNoteId(selectedNote.id);
                  setEditNoteTitle(selectedNote.title);
                  setEditNoteBody(selectedNote.body);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit"
              >
                <IconPencil size={15} />
              </button>
              <button
                onClick={() => setSelectedNoteId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: selectedNote.body }}
          />
          <p className="text-xs text-muted mt-4">
            Created{" "}
            {new Date(selectedNote.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
        <IconNotes size={40} className="opacity-30" />
        <p className="text-sm">Select a note from the sidebar</p>
        <p className="text-xs">
          Or click &ldquo;Add Note&rdquo; in the sidebar to create a new one
        </p>
      </div>
    );
  };

  const renderNoteSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
        <button
          onClick={() => {
            setActiveRail("note");
            setEditingNoteId("new");
            setSelectedNoteId(null);
            setNewNoteTitle("");
            setNewNoteBody("");
          }}
          className="btn-primary text-[11px] w-full"
        >
          <IconPlus size={12} /> Add Note
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length > 0 && (
          <p className="text-[11px] font-medium text-muted-foreground">
            Saved notes ({notes.length})
          </p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              setSelectedNoteId(n.id === selectedNoteId ? null : n.id);
              setEditingNoteId(null);
            }}
            className={`glass-card p-2.5 space-y-1 cursor-pointer transition-colors ${selectedNoteId === n.id ? "ring-1 ring-primary" : ""}`}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-medium text-foreground">
                {n.title || "Untitled"}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(n.id);
                }}
                className="text-muted-foreground hover:text-danger transition-colors shrink-0"
                title="Delete"
              >
                <IconTrash size={12} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-2">
              {n.body.slice(0, 100)}
            </p>
            <p className="text-[10px] text-muted">
              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        ))}
        {notes.length === 0 && bookmarks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No notes yet. Click &ldquo;Add Note&rdquo; above to create one.
          </p>
        )}

        {bookmarks.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">
              Bookmarked
            </p>
            {bookmarks.map((bId) => {
              const mod = data.modules.find((m) => m.id === bId);
              if (!mod) return null;
              return (
                <button
                  key={bId}
                  onClick={() => {
                    selectModule(bId);
                    setActiveRail("lesson");
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs hover:bg-muted/5 transition-colors"
                >
                  <IconBookmark size={12} className="text-warning shrink-0" />
                  <span className="truncate text-muted-foreground">
                    {mod.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Session, Resource tabs (unchanged) ────────────────────────────────

  const renderSessionMain = () => {
    const activeSessions = data.sessions.filter((s) => s.isLive);
    const currentSession = activeSessions.length > 0 ? activeSessions[0] : null;

    if (currentSession) {
      return (
        <div className="p-6 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-3 py-1 text-xs font-bold text-danger mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            LIVE NOW
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {currentSession.moduleTitle ?? "Live Session"}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {new Date(currentSession.scheduledAt).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            ·{" "}
            {new Date(currentSession.scheduledAt).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          {currentSession.joinUrl && (
            <a
              href={currentSession.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
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
        <p className="text-xs">
          Check the sidebar for upcoming and past sessions
        </p>
      </div>
    );
  };

  const renderResourceMain = () => {
    const lessonsWithResources = data.modules.flatMap((m) =>
      m.lessons.filter((l) => l.resources && l.resources.length > 0),
    );
    if (lessonsWithResources.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
          <IconFileDescription size={40} className="opacity-30" />
          <p className="text-sm">No study material available</p>
          <p className="text-xs">
            Resources will appear here when the instructor adds them
          </p>
        </div>
      );
    }
    return (
      <div className="p-6 max-w-2xl space-y-6">
        <h2 className="text-base font-semibold text-foreground">
          Study Material
        </h2>
        {lessonsWithResources.map((lesson) => (
          <div key={lesson.id}>
            <h3 className="text-sm font-medium text-foreground mb-2">
              {lesson.title}
            </h3>
            <div className="space-y-1.5">
              {lesson.resources.map((r, ri) => (
                <a
                  key={ri}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm hover:bg-muted/5 transition-colors"
                >
                  <IconFileDescription
                    size={18}
                    className="shrink-0 text-primary"
                  />
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
    const lessonsWithResources = data.modules.flatMap((m) =>
      m.lessons.filter((l) => l.resources && l.resources.length > 0),
    );
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex-shrink-0">
          <p className="text-sm font-medium text-foreground">Study Material</p>
          <p className="text-[17px] text-muted-foreground mt-0.5">
            {lessonsWithResources.length} lesson
            {lessonsWithResources.length !== 1 ? "s" : ""} with resources
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {lessonsWithResources.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No resources yet
            </p>
          ) : (
            lessonsWithResources.map((lesson) => (
              <div
                key={lesson.id}
                className="px-4 py-3 border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <IconFileDescription
                    size={14}
                    className="shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {lesson.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {lesson.resources.length} file
                      {lesson.resources.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-muted/5 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-background border-b border-border flex-shrink-0">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={14} /> Back
          </button>
          <div className="text-xs text-muted-foreground">
            Home / Courses /{" "}
            <span className="text-foreground font-medium">
              {data.course.title}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeRail === "lesson" && renderLessonMain()}
          {activeRail === "editor" && renderCodeEditorMain()}
          {activeRail === "note" && renderNoteMain()}
          {activeRail === "session" && renderSessionMain()}
          {activeRail === "resource" && renderResourceMain()}
        </div>

        {activeRail === "lesson" && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-background border-t border-border flex-shrink-0">
            <button
              onClick={() => {
                // Find previous lesson in flattened list
                const allLessons = data.modules.flatMap((m) =>
                  m.lessons.map((l) => ({ lesson: l, moduleId: m.id })),
                );
                const curIdx = allLessons.findIndex(
                  (x) => x.lesson.id === selectedLessonId,
                );
                if (curIdx > 0) {
                  const prev = allLessons[curIdx - 1];
                  selectLesson(prev.lesson, prev.moduleId);
                  setExpandedModules(
                    (prevSet) => new Set([...prevSet, prev.moduleId]),
                  );
                }
              }}
              disabled={
                !selectedLessonId ||
                data.modules
                  .flatMap((m) => m.lessons)
                  .findIndex((l) => l.id === selectedLessonId) <= 0
              }
              className="btn-secondary text-xs gap-1"
            >
              <IconArrowLeft size={13} /> Previous
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {selectedLessonId
                ? `Lesson ${data.modules.flatMap((m) => m.lessons).findIndex((l) => l.id === selectedLessonId) + 1} of ${data.modules.reduce((s, m) => s + m.lessons.length, 0)}`
                : ""}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setShowStickyWidget((v) => !v)}
              className={`btn-secondary text-xs gap-1.5 ${showStickyWidget ? "border-primary/40 bg-primary/10" : ""}`}
            >
              <IconPencil size={13} />{" "}
              {showStickyWidget ? "Close Notes" : "Take Note"}
            </button>
            <button
              onClick={() => {
                const allLessons = data.modules.flatMap((m) =>
                  m.lessons.map((l) => ({ lesson: l, moduleId: m.id })),
                );
                const curIdx = allLessons.findIndex(
                  (x) => x.lesson.id === selectedLessonId,
                );
                if (curIdx >= 0 && curIdx < allLessons.length - 1) {
                  const next = allLessons[curIdx + 1];
                  selectLesson(next.lesson, next.moduleId);
                  setExpandedModules(
                    (prevSet) => new Set([...prevSet, next.moduleId]),
                  );
                }
              }}
              disabled={
                !selectedLessonId ||
                data.modules
                  .flatMap((m) => m.lessons)
                  .findIndex((l) => l.id === selectedLessonId) >=
                  data.modules.reduce((s, m) => s + m.lessons.length, 0) - 1
              }
              className="btn-primary text-xs gap-1.5"
            >
              Continue <IconArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="w-[340px] flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden">
        {activeRail === "lesson" && (
          <LessonSidebar
            data={data}
            selectedModuleId={selectedModuleId}
            selectedLessonId={selectedLessonId}
            selectedRecordingId={selectedRecordingId}
            expandedModules={expandedModules}
            bookmarks={bookmarks}
            onSelectModule={selectModule}
            onSelectLesson={selectLesson}
            onSelectRecording={selectRecording}
            onToggleModule={toggleModule}
            onToggleBookmark={toggleBookmark}
          />
        )}
        {activeRail === "editor" && renderCodeEditorSidebar()}
        {activeRail === "note" && renderNoteSidebar()}
        {activeRail === "session" && (
          <SessionSidebar
            data={data}
            sidebarTab={sidebarTab}
            onSetSidebarTab={setSidebarTab}
          />
        )}
        {activeRail === "resource" && renderResourceSidebar()}
      </div>

      <div
        className={`flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-200 ${railCollapsed ? "w-0 border-l-0" : "w-[118px]"}`}
      >
        <div className="flex flex-col items-center py-3 overflow-y-auto flex-1">
          <button
            onClick={() => setRailCollapsed((v) => !v)}
            className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title={railCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {railCollapsed ? <IconArrowLeft size={16} /> : <IconX size={16} />}
          </button>
          {(
            ["lesson", "editor", "note", "session", "resource"] as RailTab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRail(tab)}
              className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors mb-0.5 ${activeRail === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground"}`}
              title={railLabels[tab]}
            >
              {railIcons[tab]}
              <span className="text-[15px] font-medium leading-none">
                {railLabels[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Expand button when rail is collapsed */}
      {railCollapsed && (
        <button
          onClick={() => setRailCollapsed(false)}
          className="fixed right-3 top-1/2 z-30 flex h-10 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          title="Show sidebar"
        >
          <IconArrowLeft size={14} className="rotate-180" />
        </button>
      )}

      {/* Sticky Note Widget - Draggable & Resizable */}
      {selectedModuleId && showStickyWidget && (
        <StickyNoteWidget
          courseId={courseId}
          moduleId={selectedModuleId}
          moduleTitle={selectedModule?.title}
          onClose={() => setShowStickyWidget(false)}
        />
      )}

      {/* Floating sticky-note toggle */}
      <button
        onClick={() => setShowStickyWidget((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        title={showStickyWidget ? "Close sticky notes" : "Open sticky notes"}
      >
        <IconNotes size={22} />
      </button>
    </div>
  );
}
