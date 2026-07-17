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
import { toast } from "@/lib/toast";

import { VideoPlayer } from "./_comps/VideoPlayer";
import StickyNoteWidget from "@/components/StickyNoteWidget";
import QuizContent from "./_comps/QuizContent";
import AssignmentContent from "./_comps/AssignmentContent";
import StudyMaterialContent from "./_comps/StudyMaterialContent";
import type {
  AssignmentInfo,
  CourseContentData,
  CourseContentViewProps,
  CourseLesson,
  CourseModule,
  QuizInfo,
} from "./_comps/types";

type ContentPanel = "content" | "live";

function formatMinutes(totalSeconds: number) {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}hr ${m}min` : `${h}hr`;
}

// ── Unified content ordering (matches admin ModuleCard pattern) ─────────

type UnifiedItem =
  | { type: "LESSON"; data: CourseLesson }
  | { type: "QUIZ"; data: QuizInfo }
  | { type: "ASSIGNMENT"; data: AssignmentInfo };

function buildUnifiedList(mod: CourseModule): UnifiedItem[] {
  const lessonMap = new Map(mod.lessons.map((l) => [l.id, l]));
  const quizMap = new Map(mod.quizzes.map((q) => [q.id, q]));
  const assignmentMap = new Map(mod.assignments.map((a) => [a.id, a]));

  if (mod.contentOrder && mod.contentOrder.length > 0) {
    const items: UnifiedItem[] = [];
    for (const entry of mod.contentOrder) {
      if (entry.type === "LESSON" && lessonMap.has(entry.id)) {
        items.push({ type: "LESSON", data: lessonMap.get(entry.id)! });
      } else if (entry.type === "QUIZ" && quizMap.has(entry.id)) {
        items.push({ type: "QUIZ", data: quizMap.get(entry.id)! });
      } else if (entry.type === "ASSIGNMENT" && assignmentMap.has(entry.id)) {
        items.push({ type: "ASSIGNMENT", data: assignmentMap.get(entry.id)! });
      }
    }
    // Append any items not in contentOrder (backward compat)
    for (const lesson of mod.lessons) {
      if (!items.some((i) => i.type === "LESSON" && i.data.id === lesson.id)) {
        items.push({ type: "LESSON", data: lesson });
      }
    }
    for (const quiz of mod.quizzes) {
      if (!items.some((i) => i.type === "QUIZ" && i.data.id === quiz.id)) {
        items.push({ type: "QUIZ", data: quiz });
      }
    }
    for (const assignment of mod.assignments) {
      if (!items.some((i) => i.type === "ASSIGNMENT" && i.data.id === assignment.id)) {
        items.push({ type: "ASSIGNMENT", data: assignment });
      }
    }
    return items;
  }

  // Fallback: lessons first, then quizzes, then assignments
  const items: UnifiedItem[] = [];
  for (const lesson of mod.lessons) items.push({ type: "LESSON", data: lesson });
  for (const quiz of mod.quizzes) items.push({ type: "QUIZ", data: quiz });
  for (const assignment of mod.assignments) items.push({ type: "ASSIGNMENT", data: assignment });
  return items;
}

export default function CourseContentView({
  courseId,
  goBack,
  initialQuizId,
  initialAssignmentId,
  initialResourceUrl,
  initialResourceName,
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

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
    questionCount: number;
    questions: Array<{
      id: string;
      questionText: string;
      marks: number;
      options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
    }>;
  } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>;
  } | null>(null);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const [selectedResource, setSelectedResource] = useState<{
    name: string;
    url: string;
  } | null>(null);

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

    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);

    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };
  const selectLesson = (lesson: { id: string }, moduleId: string) => {
    setSelectedLessonId(lesson.id);
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    setContentPanel("content");

    // clear other panels so the video actually renders
    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);

    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set([...prev, moduleId]));
    }
  };

  const selectRecording = (recordingId: string) => {
    setSelectedRecordingId(recordingId || null);
    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);
  };

  const clearRecording = () => setSelectedRecordingId(null);

  const selectQuiz = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setSelectedResource(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setQuizLoading(true);
    setQuizData(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    try {
      const [res, attemptRes] = await Promise.all([
        api.get<{
          id: string;
          title: string;
          description: string;
          dueDate: string;
          maxPoints: number;
          questions: Array<{
            id: string;
            questionText: string;
            marks: number;
            orderIndex: number;
            options: Array<{ id: string; optionText: string }>;
          }>;
        }>(`/api/courses/quizzes/${quizId}/questions`),
        api.get<{
          score: number;
          total: number;
          percentage: number;
          answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>;
        }>(`/api/courses/quizzes/${quizId}/attempt`).catch(() => null),
      ]);
      setQuizData({
        ...res,
        questions: res.questions.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          marks: question.marks,
          options: question.options.map((option) => ({
            id: option.id,
            optionText: option.optionText,
            isCorrect: false,
          })),
        })),
        questionCount: res.questions.length,
      });
      if (attemptRes) {
        setQuizSubmitted(true);
        setQuizResult(attemptRes);
        const preFilled: Record<string, string> = {};
        for (const a of attemptRes.answers) {
          preFilled[a.questionId] = a.selectedOptionId;
        }
        setSelectedAnswers(preFilled);
      }
    } catch {
      toast.error("Failed to load quiz");
      setSelectedQuizId(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const selectAssignment = (assignment: {
    id: string;
    title: string;
    type: string;
    dueDate: string;
  }) => {
    setSelectedAssignmentId(assignment.id);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setSelectedResource(null);
  };

  const selectResource = (name: string, url: string) => {
    setSelectedResource({ name, url });
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setSelectedAssignmentId(null);
  };

  useEffect(() => {
    if (initialQuizId && data) {
      selectQuiz(initialQuizId);
    }
  }, [initialQuizId, data]);

  useEffect(() => {
    if (initialAssignmentId && data) {
      for (const mod of data.modules) {
        const assignment = mod.assignments.find((a) => a.id === initialAssignmentId);
        if (assignment) {
          selectAssignment(assignment);
          if (!expandedModules.has(mod.id)) {
            setExpandedModules((prev) => new Set([...prev, mod.id]));
          }
          setSelectedModuleId(mod.id);
          break;
        }
      }
    }
  }, [initialAssignmentId, data]);

  useEffect(() => {
    if (initialResourceUrl && initialResourceName && data) {
      selectResource(initialResourceName, initialResourceUrl);
    }
  }, [initialResourceUrl, initialResourceName, data]);

  const clearQuizPreview = () => {
    setSelectedQuizId(null);
    setQuizData(null);
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setQuizSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));
      const res = await api.post<{
        score: number;
        total: number;
        percentage: number;
        answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>;
      }>(`/api/courses/quizzes/${quizData.id}/submit`, { answers });
      setQuizResult({
        score: res.score,
        total: res.total,
        percentage: res.percentage,
        answers: res.answers,
      });
      setQuizSubmitted(true);
    } catch (err: unknown) {
      console.error("Failed to submit quiz:", err);
      const msg = err instanceof Error ? err.message : "Failed to submit quiz";
      toast.error(msg);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const clearResourcePreview = () => setSelectedResource(null);

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

  const renderMain = () => {
    if (selectedQuizId && quizLoading) {
      return (
        <div className="flex items-center justify-center h-full gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      );
    }

    if (selectedQuizId && quizData) {
      return (
        <QuizContent
          quizData={quizData}
          selectedAnswers={selectedAnswers}
          quizSubmitted={quizSubmitted}
          quizSubmitting={quizSubmitting}
          quizResult={quizResult}
          onAnswerSelect={(questionId, optionId) =>
            setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
          }
          onSubmit={handleSubmitQuiz}
          onBack={clearQuizPreview}
          passingPercentage={60}
        />
      );
    }

    if (selectedAssignmentId) {
      const allModules = data.modules;
      let foundAssignment: (typeof data.modules)[number]["assignments"][number] | null = null;
      let foundModule: string | null = null;
      for (const mod of allModules) {
        const a = mod.assignments.find((a) => a.id === selectedAssignmentId);
        if (a) {
          foundAssignment = a;
          foundModule = mod.title;
          break;
        }
      }
      if (foundAssignment) {
        return (
          <AssignmentContent
            assignment={foundAssignment}
            moduleName={foundModule}
            onBack={() => setSelectedAssignmentId(null)}
          />
        );
      }
    }

    if (selectedResource) {
      return (
        <StudyMaterialContent
          name={selectedResource.name}
          url={selectedResource.url}
          onBack={clearResourcePreview}
        />
      );
    }

    return (
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
          {data.batch?.instructor && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Instructor: {data.batch.instructor}
            </p>
          )}
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
  };

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
              className={`w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 ${isActiveModule ? "bg-muted/30" : ""
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
                className={`flex-shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isExpanded && (
              <ul className="pb-2">
                {buildUnifiedList(module).map((item, idx) => {
                  if (item.type === "LESSON") {
                    const lesson = item.data;
                    const active =
                      lesson.id === selectedLessonId && !selectedRecordingId;
                    const isBookmarked = bookmarks.includes(lesson.id);
                    return (
                      <li key={lesson.id} className="px-2">
                        <button
                          onClick={() => selectLesson(lesson, module.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${active ? "bg-primary/15" : "hover:bg-muted/30"
                            }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${active ? "bg-primary" : "bg-muted"
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
                              className={`block text-xs truncate ${active
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                                }`}
                            >
                              {idx + 1}. {lesson.title}
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
                            className={`text-[10px] flex-shrink-0 ${isBookmarked ? "text-primary" : "text-transparent"
                              }`}
                          >
                            ●
                          </span>
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "QUIZ") {
                    const quiz = item.data;
                    const isActive = selectedQuizId === quiz.id;
                    return (
                      <li key={quiz.id} className="px-2">
                        <button
                          onClick={() => selectQuiz(quiz.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${isActive ? "bg-amber-500/15" : "hover:bg-muted/30"
                            }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-amber-500" : "bg-amber-500/15"
                              }`}
                          >
                            <IconClipboardCheck
                              size={12}
                              className={
                                isActive
                                  ? "text-white"
                                  : "text-amber-500"
                              }
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs truncate ${isActive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                                }`}
                            >
                              {idx + 1}. {quiz.title}
                            </span>
                          </span>
                          <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                            {quiz.questionCount}Q
                          </span>
                        </button>
                      </li>
                    );
                  }

                  const assignment = item.data;
                  const isActive = selectedAssignmentId === assignment.id;
                  return (
                    <li key={assignment.id} className="px-2">
                      <button
                        onClick={() => selectAssignment(assignment)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${isActive ? "bg-blue-500/15" : "hover:bg-muted/30"
                          }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-blue-500" : "bg-blue-500/15"
                            }`}
                        >
                          <IconFileSpreadsheet
                            size={12}
                            className={
                              isActive
                                ? "text-white"
                                : "text-blue-500"
                            }
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs truncate ${isActive
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                              }`}
                          >
                            {idx + 1}. {assignment.title}
                          </span>
                        </span>
                        <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                          {new Date(assignment.dueDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}

                {module.lessons.some((l) => l.resources && l.resources.length > 0) && (
                  <>
                    {module.lessons
                      .filter((l) => l.resources && l.resources.length > 0)
                      .flatMap((l) =>
                        l.resources.map((r) => {
                          const isActive =
                            selectedResource?.url === r.url;
                          return (
                            <li key={`${l.id}-resource-${r.url}`} className="px-2">
                              <button
                                onClick={() => selectResource(r.name, r.url)}
                                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${isActive
                                  ? "bg-emerald-500/15"
                                  : "hover:bg-muted/30"
                                  }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive
                                    ? "bg-emerald-500"
                                    : "bg-emerald-500/15"
                                    }`}
                                >
                                  <IconFile
                                    size={12}
                                    className={
                                      isActive
                                        ? "text-white"
                                        : "text-emerald-500"
                                    }
                                  />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={`block text-xs truncate ${isActive
                                      ? "text-foreground font-medium"
                                      : "text-muted-foreground"
                                      }`}
                                  >
                                    {r.name}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        }),
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
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors ${contentPanel === "content"
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <IconBook2 size={14} />
          Course content
        </button>
        <button
          onClick={() => setContentPanel("live")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors ${contentPanel === "live"
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
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/15" : "hover:bg-muted/30"
                            }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <IconVideo size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs font-medium truncate ${active ? "text-foreground" : "text-foreground"
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
              if (!selectedModule) return;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" && item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId),
              );
              if (curIdx > 0) {
                const prev = unified[curIdx - 1];
                if (prev.type === "LESSON") selectLesson(prev.data, selectedModule.id);
                else if (prev.type === "QUIZ") selectQuiz(prev.data.id);
                else if (prev.type === "ASSIGNMENT") selectAssignment(prev.data);
              } else {
                const modIdx = data.modules.findIndex((m) => m.id === selectedModuleId);
                if (modIdx > 0) {
                  const prevMod = data.modules[modIdx - 1];
                  const prevUnified = buildUnifiedList(prevMod);
                  if (prevUnified.length > 0) {
                    const last = prevUnified[prevUnified.length - 1];
                    setExpandedModules((prevSet) => new Set([...prevSet, prevMod.id]));
                    if (last.type === "LESSON") selectLesson(last.data, prevMod.id);
                    else if (last.type === "QUIZ") selectQuiz(last.data.id);
                    else if (last.type === "ASSIGNMENT") selectAssignment(last.data);
                  }
                }
              }
            }}
            disabled={(() => {
              if (!selectedModule) return true;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" && item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId),
              );
              const isAtFirstInModule = curIdx <= 0;
              const modIdx = data.modules.findIndex((m) => m.id === selectedModuleId);
              return isAtFirstInModule && modIdx <= 0;
            })()}
            className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
          >
            <IconArrowLeft size={13} /> Previous
          </button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {selectedModule && (() => {
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" && item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId),
              );
              return curIdx >= 0
                ? `Item ${curIdx + 1} of ${unified.length}`
                : "";
            })()}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setShowStickyWidget((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${showStickyWidget
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
          >
            <IconPencil size={13} />{" "}
            {showStickyWidget ? "Close Notes" : "Take Note"}
          </button>
          <button
            onClick={() => {
              if (!selectedModule) return;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" && item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId),
              );
              if (curIdx >= 0 && curIdx < unified.length - 1) {
                const next = unified[curIdx + 1];
                if (next.type === "LESSON") selectLesson(next.data, selectedModule.id);
                else if (next.type === "QUIZ") selectQuiz(next.data.id);
                else if (next.type === "ASSIGNMENT") selectAssignment(next.data);
              } else {
                const modIdx = data.modules.findIndex((m) => m.id === selectedModuleId);
                if (modIdx >= 0 && modIdx < data.modules.length - 1) {
                  const nextMod = data.modules[modIdx + 1];
                  const nextUnified = buildUnifiedList(nextMod);
                  if (nextUnified.length > 0) {
                    const first = nextUnified[0];
                    setExpandedModules((prevSet) => new Set([...prevSet, nextMod.id]));
                    if (first.type === "LESSON") selectLesson(first.data, nextMod.id);
                    else if (first.type === "QUIZ") selectQuiz(first.data.id);
                    else if (first.type === "ASSIGNMENT") selectAssignment(first.data);
                  }
                }
              }
            }}
            disabled={(() => {
              if (!selectedModule) return true;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" && item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId),
              );
              const isAtLastInModule = curIdx >= 0 && curIdx >= unified.length - 1;
              const modIdx = data.modules.findIndex((m) => m.id === selectedModuleId);
              return isAtLastInModule && modIdx >= data.modules.length - 1;
            })()}
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
