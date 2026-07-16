"use client";

import { useEffect, useState } from "react";
import {
  IconBook2,
  IconCalendarEvent,
  IconArrowLeft,
  IconArrowRight,
  IconPencil,
  IconNotes,
  IconVideo,
  IconChevronDown,
  IconPlayerPlay,
  IconClipboardCheck,
  IconFileSpreadsheet,
  IconFile,
} from "@tabler/icons-react";
import { api } from "@/lib/api";

import { VideoPlayer } from "./_comps/VideoPlayer";
import StickyNoteWidget from "@/components/StickyNoteWidget";
import type { CourseContentData, CourseContentViewProps } from "./_comps/types";

type ContentPanel = "content" | "live";

function formatMinutes(totalSeconds: number) {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}hr ${m}min` : `${h}hr`;
}

export default function CourseContentView({
  courseId,
  goBack,
}: CourseContentViewProps) {
  const [data, setData] = useState<CourseContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contentPanel, setContentPanel] = useState<ContentPanel>("content");

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null,
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [retryKey, setRetryKey] = useState(0);

  const [showStickyWidget, setShowStickyWidget] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
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
    setContentPanel("content");
    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };

  const selectLesson = (lesson: { id: string }, moduleId: string) => {
    setSelectedLessonId(lesson.id);
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    setContentPanel("content");
    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };

  const selectRecording = (recordingId: string) => {
    setSelectedRecordingId(recordingId || null);
  };

  const clearRecording = () => setSelectedRecordingId(null);

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
  const currentModuleIndex =
    data?.modules.findIndex((m) => m.id === selectedModuleId) ?? -1;
  const currentLessonIndex =
    selectedModule?.lessons.findIndex((l) => l.id === selectedLessonId) ?? -1;
  const hasLiveSession = !!data?.sessions.some((s) => s.isLive);

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">
          Loading course content...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
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

  // ── Main pane: video + lesson info ──────────────────────────────────────

  const renderMain = () => (
    <>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card border border-border">
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
          {selectedRecording ? (
            "Recorded live session"
          ) : (
            <>
              {currentLessonIndex >= 0
                ? `Lesson ${currentLessonIndex + 1}`
                : ""}
              {currentModuleIndex >= 0
                ? ` · Module ${currentModuleIndex + 1}`
                : ""}
              {selectedLesson?.durationSeconds
                ? ` · ${Math.floor(selectedLesson.durationSeconds / 60)} min`
                : ""}
            </>
          )}
        </p>
        {selectedRecording && (
          <button
            onClick={clearRecording}
            className="text-xs font-medium text-primary hover:underline mt-2"
          >
            ← Back to current lesson
          </button>
        )}
      </div>
      <div className="bg-card-hover border border-border rounded-xl p-4 mt-4">
        <h3 className="text-sm font-medium text-foreground mb-1.5">
          {selectedRecording ? "About this session" : "About this lesson"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedLesson?.description ??
            "Select a lesson from the sidebar to view details."}
        </p>
      </div>
    </>
  );

  // ── Sidebar: "Course content" / "Live Session" tab pair ────────────────

  const renderAccordion = () => (
    <ul className="pb-3">
      {data.modules.map((module, mIdx) => {
        const isExpanded = expandedModules.has(module.id);
        const isActiveModule = module.id === selectedModuleId;
        const totalSeconds = module.lessons.reduce(
          (s, l) => s + (l.durationSeconds ?? 0),
          0,
        );
        const itemCount =
          module.lessons.length +
          module.quizzes.length +
          module.assignments.length;

        return (
          <li key={module.id} className="border-b border-border/50">
            <button
              onClick={() => toggleModule(module.id)}
              className={`w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                isActiveModule ? "bg-muted/30" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-foreground">
                  Section {mIdx + 1}: {module.title}
                </span>
                <span className="block text-[11px] mt-1 text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                  {totalSeconds ? ` · ${formatMinutes(totalSeconds)}` : ""}
                </span>
              </span>
              <IconChevronDown
                size={16}
                className={`flex-shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <ul className="pb-2">
                {module.lessons.map((lesson, lIdx) => {
                  const active =
                    lesson.id === selectedLessonId && !selectedRecordingId;
                  const isBookmarked = bookmarks.includes(lesson.id);
                  return (
                    <li key={lesson.id} className="px-2">
                      <button
                        onClick={() => selectLesson(lesson, module.id)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                          active ? "bg-primary/15" : "hover:bg-muted/30"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            active ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <IconPlayerPlay
                            size={11}
                            className={
                              active
                                ? "text-primary-foreground ml-[1px]"
                                : "text-muted-foreground"
                            }
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs truncate ${
                              active
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {lIdx + 1}. {lesson.title}
                          </span>
                        </span>
                        {lesson.durationSeconds ? (
                          <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                            {formatMinutes(lesson.durationSeconds)}
                          </span>
                        ) : null}
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(lesson.id);
                          }}
                          className={`text-[10px] flex-shrink-0 ${
                            isBookmarked ? "text-primary" : "text-transparent"
                          }`}
                        >
                          ●
                        </span>
                      </button>
                    </li>
                  );
                })}

                {module.quizzes.map((quiz) => (
                  <li key={quiz.id} className="px-2">
                    <div className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                        <IconClipboardCheck
                          size={12}
                          className="text-amber-500"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs truncate text-muted-foreground">
                          {quiz.title}
                        </span>
                      </span>
                      <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                        {quiz.questionCount}Q
                      </span>
                    </div>
                  </li>
                ))}

                {module.assignments.map((assignment) => (
                  <li key={assignment.id} className="px-2">
                    <div className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                        <IconFileSpreadsheet
                          size={12}
                          className="text-blue-500"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs truncate text-muted-foreground">
                          {assignment.title}
                        </span>
                      </span>
                      <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                        {new Date(assignment.dueDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                    </div>
                  </li>
                ))}

                {module.lessons.some((l) => l.resources && l.resources.length > 0) && (
                  <>
                    {module.lessons
                      .filter((l) => l.resources && l.resources.length > 0)
                      .flatMap((l) =>
                        l.resources.map((r) => (
                          <li key={`${l.id}-resource-${r.url}`} className="px-2">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                                <IconFile
                                  size={12}
                                  className="text-emerald-500"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs truncate text-muted-foreground">
                                  {r.name}
                                </span>
                              </span>
                            </a>
                          </li>
                        )),
                      )}
                  </>
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderContentPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-border flex-shrink-0">
        <button
          onClick={() => setContentPanel("content")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors ${
            contentPanel === "content"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconBook2 size={14} />
          Course content
        </button>
        <button
          onClick={() => setContentPanel("live")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors ${
            contentPanel === "live"
              ? "border-danger text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconCalendarEvent
            size={14}
            className={contentPanel === "live" ? "text-danger" : ""}
          />
          Live Session
          {hasLiveSession && (
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        {contentPanel === "content" ? (
          renderAccordion()
        ) : (
          <div className="flex flex-col">
            {hasLiveSession && (
              <div className="px-4 py-3 space-y-3">
                <p className="text-[11px] font-medium text-danger uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                  Live Now
                </p>
                {data.sessions
                  .filter((s) => s.isLive)
                  .map((session) => (
                    <div key={session.id} className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {session.moduleTitle ?? "Live Session"}
                        </p>
                      </div>
                      {session.joinUrl && (
                        <a
                          href={session.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] px-2 py-1 rounded-md bg-danger text-white shrink-0 font-medium"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 pt-4 pb-2">
                Recorded sessions
              </p>
              {data.recordings.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No past sessions recorded yet
                </p>
              ) : (
                <ul className="pb-3">
                  {data.recordings.map((rec) => {
                    const active = rec.id === selectedRecordingId;
                    return (
                      <li key={rec.id} className="px-2">
                        <button
                          onClick={() => selectRecording(rec.id)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                            active ? "bg-primary/15" : "hover:bg-muted/30"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <IconVideo size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs font-medium truncate ${
                                active ? "text-foreground" : "text-foreground"
                              }`}
                            >
                              {rec.title}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {rec.scheduledAt
                                ? new Date(rec.scheduledAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )
                                : "Recorded session"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-var(--shell-header-height,56px))] gap-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">{renderMain()}</div>

        <div className="flex items-center gap-3 px-5 py-2.5 bg-card border-t border-border flex-shrink-0">
          <button
            onClick={() => {
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
            className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
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
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
              showStickyWidget
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
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
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Continue <IconArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="w-[380px] flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
        {renderContentPanel()}
      </div>

      {selectedModuleId && showStickyWidget && (
        <StickyNoteWidget
          courseId={courseId}
          moduleId={selectedModuleId}
          moduleTitle={selectedModule?.title}
          onClose={() => setShowStickyWidget(false)}
        />
      )}

      <button
        onClick={() => setShowStickyWidget((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
        title={showStickyWidget ? "Close sticky notes" : "Open sticky notes"}
      >
        <IconNotes size={22} />
      </button>
    </div>
  );
}
