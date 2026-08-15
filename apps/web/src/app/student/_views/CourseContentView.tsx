"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconBook2,
  IconCalendarEvent,
  IconArrowLeft,
  IconArrowRight,
  IconPencil,
  IconNotes,
  IconVideo,
  IconX,
  IconChevronDown,
  IconClipboardCheck,
  IconFileSpreadsheet,
  IconFile,
  IconList,
  IconDownload,
  IconDeviceSpeaker,
  IconClock,
  IconCheck,
  IconAward,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { useLiveSessionPresence } from "@/hooks/use-live-session-presence";

import { VideoPlayer } from "./_comps/VideoPlayer";
import type {
  AssignmentInfo,
  CourseContentData,
  CourseContentViewProps,
  CourseLesson,
  CourseModule,
  PracticalInfo,
  QuizInfo,
} from "./_comps/types";

const QuizContent = dynamic(() => import("./_comps/QuizContent"), {
  ssr: false,
});
const AssignmentContent = dynamic(() => import("./_comps/AssignmentContent"), {
  ssr: false,
});
const StudyMaterialContent = dynamic(
  () => import("./_comps/StudyMaterialContent"),
  { ssr: false },
);
const StickyNoteWidget = dynamic(
  () => import("@/components/StickyNoteWidget"),
  { ssr: false },
);
const CertificationExamView = dynamic(
  () => import("./_comps/CertificationExamView"),
  { ssr: false },
);

type ContentPanel = "content" | "live";

function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 260,
  maxWidth = 480,
}: {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}) {
  const [width, setWidth] = useState(defaultWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return;
      const left = containerRef.current.getBoundingClientRect().left;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX - left));
      setWidth(newWidth);
    }
    function onMouseUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [minWidth, maxWidth]);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 h-full border-r border-border"
      style={{ width }}
    >
      <div className="h-full overflow-y-auto">{children}</div>

      {/* Drag handle */}
      <div
        onMouseDown={() => {
          isDragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        onDoubleClick={() => setWidth(defaultWidth)}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
      />
    </div>
  );
}
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
  | { type: "ASSIGNMENT"; data: AssignmentInfo }
  | { type: "PRACTICAL"; data: PracticalInfo };

function buildUnifiedList(mod: CourseModule): UnifiedItem[] {
  const lessonMap = new Map(mod.lessons.map((l) => [l.id, l]));
  const quizMap = new Map(mod.quizzes.map((q) => [q.id, q]));
  const assignmentMap = new Map(mod.assignments.map((a) => [a.id, a]));
  const practicalMap = new Map((mod.practicals || []).map((p) => [p.id, p]));

  if (mod.contentOrder && mod.contentOrder.length > 0) {
    const items: UnifiedItem[] = [];
    for (const entry of mod.contentOrder) {
      if (entry.type === "LESSON" && lessonMap.has(entry.id)) {
        items.push({ type: "LESSON", data: lessonMap.get(entry.id)! });
      } else if (entry.type === "QUIZ" && quizMap.has(entry.id)) {
        items.push({ type: "QUIZ", data: quizMap.get(entry.id)! });
      } else if (entry.type === "ASSIGNMENT" && assignmentMap.has(entry.id)) {
        items.push({ type: "ASSIGNMENT", data: assignmentMap.get(entry.id)! });
      } else if (entry.type === "PRACTICAL" && practicalMap.has(entry.id)) {
        items.push({ type: "PRACTICAL", data: practicalMap.get(entry.id)! });
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
      if (
        !items.some(
          (i) => i.type === "ASSIGNMENT" && i.data.id === assignment.id,
        )
      ) {
        items.push({ type: "ASSIGNMENT", data: assignment });
      }
    }
    for (const practical of mod.practicals || []) {
      if (
        !items.some((i) => i.type === "PRACTICAL" && i.data.id === practical.id)
      ) {
        items.push({ type: "PRACTICAL", data: practical });
      }
    }
    return items;
  }

  // Fallback: lessons first, then quizzes, then assignments, then practicals
  const items: UnifiedItem[] = [];
  for (const lesson of mod.lessons)
    items.push({ type: "LESSON", data: lesson });
  for (const quiz of mod.quizzes) items.push({ type: "QUIZ", data: quiz });
  for (const assignment of mod.assignments)
    items.push({ type: "ASSIGNMENT", data: assignment });
  for (const practical of mod.practicals || [])
    items.push({ type: "PRACTICAL", data: practical });
  return items;
}

export default function CourseContentView({
  courseId,
  goBack,
  initialQuizId,
  initialAssignmentId,
  initialLessonId,
  initialResourceUrl,
  initialResourceName,
}: CourseContentViewProps) {
  const queryClient = useQueryClient();
  const [contentPanel, setContentPanel] = useState<ContentPanel>("content");

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null,
  );
  // Single-expand accordion: only one module's id (or null) is ever "open".
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    null,
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    hasAssignment?: boolean;
    hasCoding?: boolean;
    assignmentInstructions?: string | null;
    assignmentPdfUrl?: string | null;
    codingPrompt?: string | null;
    questions: Array<{
      id: string;
      questionText: string;
      marks: number;
      options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
    }>;
  } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    answers: Array<{
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
    }>;
  } | null>(null);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);

  const [selectedPracticalId, setSelectedPracticalId] = useState<string | null>(
    null,
  );

  const [selectedResource, setSelectedResource] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const presence = useLiveSessionPresence();
  const [showCertificationExam, setShowCertificationExam] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────

  const contentQuery = useApiQuery<CourseContentData>(
    ["student", "course-content", courseId],
    `/api/courses/${courseId}/content`,
  );
  const data = contentQuery.data ?? null;
  const loading = contentQuery.isPending;
  const error = contentQuery.isError
    ? getErrorMessage(contentQuery.error)
    : "";

  // Certification exam status — fetched only when the course has a cert module.
  const hasCertModule = Boolean(
    data?.modules.some((m) => m.isCertificationModule),
  );
  const certQuery = useQuery({
    queryKey: ["student", "course-certification", courseId],
    queryFn: () =>
      api.get<{
        attempt: { isPassed: boolean } | null;
        eligible: boolean;
      }>(`/api/courses/${courseId}/certification`),
    enabled: hasCertModule,
  });
  const certQuizPassed = certQuery.data?.attempt?.isPassed ?? false;
  const certExamEligible = certQuery.data?.eligible ?? false;

  // One-time init: preselect the first module/lesson (or the one matching
  // initialLessonId) once the content loads.
  const initializedForCourse = useRef<string | null>(null);
  useEffect(() => {
    if (!data || initializedForCourse.current === courseId) return;
    initializedForCourse.current = courseId;
    const firstModule = data.modules[0];
    if (!firstModule) return;
    const targetModule = initialLessonId
      ? (data.modules.find((m) =>
          m.lessons.some((l) => l.id === initialLessonId),
        ) ?? firstModule)
      : firstModule;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time init from fetched course content */
    setSelectedModuleId(targetModule.id);
    setExpandedModuleId(targetModule.id);
    const targetLesson = initialLessonId
      ? targetModule.lessons.find((l) => l.id === initialLessonId)
      : targetModule.lessons[0];
    if (targetLesson) {
      setSelectedLessonId(targetLesson.id);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data, courseId, initialLessonId]);

  // ── Navigation ─────────────────────────────────────────────────────────

  const toggleModule = (moduleId: string) => {
    // Clicking the already-open module collapses it; clicking any other
    // module opens it and implicitly closes whichever one was open.
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  const selectModule = (moduleId: string) => {
    setMobileSidebarOpen(false);
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    setContentPanel("content");

    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);

    setExpandedModuleId(moduleId);
  };
  const selectLesson = (lesson: { id: string }, moduleId: string) => {
    setMobileSidebarOpen(false);
    setSelectedLessonId(lesson.id);
    setSelectedModuleId(moduleId);
    setSelectedRecordingId(null);
    setContentPanel("content");

    // clear other panels so the video actually renders
    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);

    setExpandedModuleId(moduleId);
  };

  const selectRecording = (recordingId: string) => {
    setMobileSidebarOpen(false);
    setSelectedRecordingId(recordingId || null);
    setSelectedResource(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);
  };

  const clearRecording = () => setSelectedRecordingId(null);

  const selectQuiz = async (quizId: string) => {
    setMobileSidebarOpen(false);
    setSelectedQuizId(quizId);
    setSelectedResource(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setSelectedPracticalId(null);
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
          hasAssignment?: boolean;
          hasCoding?: boolean;
          assignmentInstructions?: string | null;
          assignmentPdfUrl?: string | null;
          codingPrompt?: string | null;
          questions: Array<{
            id: string;
            questionText: string;
            marks: number;
            orderIndex: number;
            options: Array<{ id: string; optionText: string }>;
          }>;
        }>(`/api/courses/quizzes/${quizId}/questions`),
        api
          .get<{
            score: number;
            total: number;
            percentage: number;
            answers: Array<{
              questionId: string;
              selectedOptionId: string;
              isCorrect: boolean;
            }>;
          }>(`/api/courses/quizzes/${quizId}/attempt`)
          .catch(() => null),
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
    setMobileSidebarOpen(false);
    setSelectedAssignmentId(assignment.id);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setSelectedResource(null);
    setSelectedPracticalId(null);
  };

  const selectResource = (name: string, url: string) => {
    setMobileSidebarOpen(false);
    setSelectedResource({ name, url });
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedLessonId(null);
    setSelectedRecordingId(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);
  };

  const selectPractical = (practicalId: string) => {
    setMobileSidebarOpen(false);
    setSelectedPracticalId(practicalId);
    setSelectedLessonId(null);
    setSelectedQuizId(null);
    setQuizData(null);
    setSelectedRecordingId(null);
    setSelectedResource(null);
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
        const assignment = mod.assignments.find(
          (a) => a.id === initialAssignmentId,
        );
        if (assignment) {
          selectAssignment(assignment);
          setExpandedModuleId(mod.id);
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

  // Quiz submission mutation — writes the attempt, then shows the result.
  const quizSubmitMutation = useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Array<{ questionId: string; selectedOptionId: string }>;
    }) =>
      api.post<{
        score: number;
        total: number;
        percentage: number;
        answers: Array<{
          questionId: string;
          selectedOptionId: string;
          isCorrect: boolean;
        }>;
      }>(`/api/courses/quizzes/${quizId}/submit`, { answers }),
    onSuccess: (res) => {
      setQuizResult({
        score: res.score,
        total: res.total,
        percentage: res.percentage,
        answers: res.answers,
      });
      setQuizSubmitted(true);
    },
    onError: (err: unknown) => {
      console.error("Failed to submit quiz:", err);
      const msg = err instanceof Error ? err.message : "Failed to submit quiz";
      toast.error(msg);
    },
  });

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    const answers = Object.entries(selectedAnswers).map(
      ([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }),
    );
    quizSubmitMutation.mutate({ quizId: quizData.id, answers });
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

  const applyProgress = useCallback(
    (patch: {
      lesson?: { id: string; watchedPercent: number; isCompleted: boolean };
      recording?: { id: string; watchedPercent: number; isCompleted: boolean };
    }) => {
      queryClient.setQueryData<CourseContentData>(
        ["student", "course-content", courseId],
        (prev) => {
        if (!prev) return prev;

        const recordings = patch.recording
          ? prev.recordings.map((r) =>
              r.id === patch.recording!.id ? { ...r, ...patch.recording! } : r,
            )
          : prev.recordings;

        const modules = prev.modules.map((m) => {
          const lessons = patch.lesson
            ? m.lessons.map((l) =>
                l.id === patch.lesson!.id ? { ...l, ...patch.lesson! } : l,
              )
            : m.lessons;
          const moduleRecordings = recordings.filter(
            (r) => r.moduleId === m.id,
          );
          const videoLessons = lessons.filter(
            (l) => l.videoUrl || l.videoEmbedId,
          );
          const totalItems = moduleRecordings.length + videoLessons.length;
          const completedItems =
            moduleRecordings.filter((r) => r.isCompleted).length +
            videoLessons.filter((l) => l.isCompleted).length;
          return {
            ...m,
            lessons,
            completionPercent:
              totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : 0,
          };
        });

        const progressPercentages = [
          ...recordings.map((r) => r.watchedPercent),
          ...modules.flatMap((m) =>
            m.lessons
              .filter((l) => l.videoUrl || l.videoEmbedId)
              .map((l) => l.watchedPercent ?? 0),
          ),
        ];
        const overallProgress =
          progressPercentages.length > 0
            ? Math.round(
                progressPercentages.reduce((s, p) => s + p, 0) /
                  progressPercentages.length,
              )
            : 0;

        return { ...prev, modules, recordings, overallProgress };
      },
      );
    },
    [courseId, queryClient],
  );

  const handleWatchProgress = (watchedSeconds: number, completed?: boolean) => {
    if (selectedRecording) {
      api
        .post("/api/recordings/progress", {
          recordingId: selectedRecording.id,
          watchedSeconds,
          completed,
        })
        .catch((err: unknown) => {
          console.error("Failed to save recording progress:", err);
        });
      const duration = selectedRecording.duration || 1;
      const watchedPercent = completed
        ? 100
        : Math.min(100, Math.round((watchedSeconds / duration) * 100));
      applyProgress({
        recording: {
          id: selectedRecording.id,
          watchedPercent,
          isCompleted: completed || watchedPercent >= 90,
        },
      });
      return;
    }

    if (selectedLesson) {
      api
        .post(`/api/courses/lessons/${selectedLesson.id}/progress`, {
          watchedSeconds,
          completed,
        })
        .catch((err: unknown) => {
          console.error("Failed to save lesson progress:", err);
        });
      const duration = selectedLesson.durationSeconds || 1;
      const watchedPercent = completed
        ? 100
        : Math.min(100, Math.round((watchedSeconds / duration) * 100));
      applyProgress({
        lesson: {
          id: selectedLesson.id,
          watchedPercent,
          isCompleted: completed || watchedPercent >= 90,
        },
      });
    }
  };

  const currentModuleIndex =
    data?.modules.findIndex((m) => m.id === selectedModuleId) ?? -1;
  const currentLessonIndex =
    selectedModule?.lessons.findIndex((l) => l.id === selectedLessonId) ?? -1;
  const hasLiveSession = !!data?.sessions.some((s) => s.isLive);

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 bg-mist">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
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
          onClick={() => void contentQuery.refetch()}
          className="btn-primary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const d = data;

  // ── Main pane: video + lesson info ──────────────────────────────────────

  const renderMain = () => {
    if (showCertificationExam && certModule) {
      return (
        <CertificationExamView
          courseId={courseId}
          onBack={() => setShowCertificationExam(false)}
        />
      );
    }

    if (selectedQuizId && quizLoading) {
      return (
        <div className="flex items-center justify-center h-full gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
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
          quizSubmitting={quizSubmitMutation.isPending}
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
      const allModules = d.modules;
      let foundAssignment:
        | (typeof data.modules)[number]["assignments"][number]
        | null = null;
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

    if (selectedPracticalId) {
      const allModules = d.modules;
      let foundPractical: PracticalInfo | null = null;
      for (const mod of allModules) {
        const p = (mod.practicals || []).find(
          (pr) => pr.id === selectedPracticalId,
        );
        if (p) {
          foundPractical = p;
          break;
        }
      }
      if (foundPractical) {
        return (
          <div className="space-y-4">
            <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue-tint text-brand-blue">
                  <IconDeviceSpeaker size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
                    Hands-On / Practical
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {foundPractical.title}
                  </p>
                </div>
              </div>
              {foundPractical.description && (
                <p className="text-xs text-muted-foreground leading-relaxed pl-[46px]">
                  {foundPractical.description}
                </p>
              )}
            </div>
            {foundPractical.videoUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white border border-border/60 shadow-sm">
                {foundPractical.videoType === "youtube" &&
                foundPractical.videoEmbedId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${foundPractical.videoEmbedId}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : foundPractical.videoType === "vimeo" &&
                  foundPractical.videoEmbedId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${foundPractical.videoEmbedId}`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : foundPractical.videoUrl.includes("loom.com/embed/") ||
                  foundPractical.videoUrl.includes("loom.com/share/") ? (
                  <iframe
                    src={foundPractical.videoUrl.replace(
                      /\/share\//,
                      "/embed/",
                    )}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={foundPractical.videoUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            {foundPractical.pdfUrl && (
              <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <IconFile size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                      PDF Document
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {foundPractical.title}
                    </p>
                  </div>
                  <a
                    href={foundPractical.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-brand-blue/30 bg-brand-blue-tint/50 px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue-tint"
                  >
                    <IconDownload size={14} />
                    Open PDF
                  </a>
                </div>
              </div>
            )}
            {foundPractical.resources &&
              foundPractical.resources.length > 0 && (
                <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground mb-3">
                    Resources
                  </p>
                  <ul className="space-y-2">
                    {foundPractical.resources.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-primary/10"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <IconFile size={14} />
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-medium text-foreground truncate">
                            {r.name}
                          </span>
                          <IconDownload
                            size={13}
                            className="shrink-0 text-muted-foreground"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            <button
              onClick={() => setSelectedPracticalId(null)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Back to content
            </button>
          </div>
        );
      }
    }

    if (selectedResource) {
      return (
        <StudyMaterialContent
          name={selectedResource.name}
          url={selectedResource.url}
        />
      );
    }

    return (
      <>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <VideoPlayer
            lesson={selectedLesson}
            recording={selectedRecording}
            onProgress={handleWatchProgress}
            initialTime={
              selectedRecording?.watchedSeconds ??
              selectedLesson?.watchedSeconds
            }
          />
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
          {d.batch?.instructor && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Instructor: {d.batch.instructor}
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
        <div className="bg-card border border-border rounded-xl p-4 mt-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              {selectedRecording ? (
                <IconVideo size={15} />
              ) : (
                <IconBook2 size={15} />
              )}
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {selectedRecording ? "About this session" : "About this lesson"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-[38px]">
            {selectedLesson?.description ??
              "Select a lesson from the sidebar to view details."}
          </p>
        </div>
      </>
    );
  };

  const renderAccordion = () => (
    <div className="space-y-3 p-3">
      <div className="px-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span className="uppercase tracking-wider">Course progress</span>
          <span className="text-emerald-600">{d.overallProgress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${d.overallProgress}%` }}
          />
        </div>
      </div>
      {d.modules.filter((m) => !m.isCertificationModule).map((module, mIdx) => {
        const isExpanded = expandedModuleId === module.id;
        const isActiveModule = module.id === selectedModuleId;
        const totalSeconds = module.lessons.reduce(
          (s, l) => s + (l.durationSeconds ?? 0),
          0,
        );
        const itemCount =
          module.lessons.length +
          module.quizzes.length +
          module.assignments.length +
          (module.practicals?.length ?? 0);

        return (
          <div
            key={module.id}
            className={`rounded-xl border overflow-hidden transition-colors ${
              isExpanded || isActiveModule
                ? "border-primary/40"
                : "border-border"
            }`}
          >
            <button
              onClick={() => toggleModule(module.id)}
              className={`w-full flex items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                isActiveModule ? "bg-primary/5" : ""
              }`}
              aria-expanded={isExpanded}
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-foreground">
                  Module {mIdx + 1} – {module.title}
                </span>
                <span className="block text-[11px] mt-0.5 text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                  {totalSeconds ? ` · ${formatMinutes(totalSeconds)}` : ""}
                </span>
                {module.completionPercent > 0 && (
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full rounded-full bg-emerald-500"
                        style={{ width: `${module.completionPercent}%` }}
                      />
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {module.completionPercent}% complete
                    </span>
                  </span>
                )}
              </span>
              <IconChevronDown
                size={16}
                className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <ul className="pb-2 pt-1 border-t border-border/60">
                {buildUnifiedList(module).map((item, idx) => {
                  if (item.type === "LESSON") {
                    const lesson = item.data;
                    const active =
                      lesson.id === selectedLessonId && !selectedRecordingId;
                    const isBookmarked = bookmarks.includes(lesson.id);
                    return (
                      <li key={lesson.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectLesson(lesson, module.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-primary/10"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "bg-brand-blue border-brand-blue"
                                : lesson.isCompleted
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-border bg-transparent"
                            }`}
                          >
                            {lesson.isCompleted ? (
                              <IconCheck size={12} className="text-white" />
                            ) : (
                              <IconVideo
                                size={11}
                                className={
                                  active
                                    ? "text-white ml-px"
                                    : "text-muted-foreground"
                                }
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs truncate ${
                                active
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx + 1}. {lesson.title}
                            </span>
                            {!lesson.isCompleted &&
                            typeof lesson.watchedPercent === "number" &&
                            lesson.watchedPercent > 0 ? (
                              <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-muted">
                                <span
                                  className="block h-full rounded-full bg-primary"
                                  style={{ width: `${lesson.watchedPercent}%` }}
                                />
                              </span>
                            ) : null}
                          </span>
                          {lesson.durationSeconds ? (
                            <span className="text-[10px] shrink-0 text-muted-foreground/70">
                              {formatMinutes(lesson.durationSeconds)}
                            </span>
                          ) : null}
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(lesson.id);
                            }}
                            className={`text-[10px] shrink-0 ${
                              isBookmarked ? "text-primary" : "text-transparent"
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
                      <li key={quiz.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectQuiz(quiz.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            isActive
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-primary/10"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isActive
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconClipboardCheck
                              size={12}
                              className={
                                isActive
                                  ? "text-white"
                                  : "text-muted-foreground"
                              }
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs truncate ${
                                isActive
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx + 1}. {quiz.title}
                            </span>
                          </span>
                          {quiz.dueDate &&
                          new Date(quiz.dueDate).getTime() < Date.now() ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-danger/10 text-danger shrink-0">
                              <IconClock size={9} />
                              Due
                            </span>
                          ) : (
                            <span className="text-[10px] shrink-0 text-muted-foreground/70">
                              {quiz.questionCount}Q
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "ASSIGNMENT") {
                    const assignment = item.data;
                    const isActive = selectedAssignmentId === assignment.id;
                    return (
                      <li key={assignment.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectAssignment(assignment)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            isActive
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-primary/10"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isActive
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconFileSpreadsheet
                              size={12}
                              className={
                                isActive
                                  ? "text-white"
                                  : "text-muted-foreground"
                              }
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs truncate ${
                                isActive
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx + 1}. {assignment.title}
                            </span>
                          </span>
                          <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                            {assignment.dueDate
                              ? new Date(assignment.dueDate).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short" },
                                )
                              : "No due date"}
                          </span>
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "PRACTICAL") {
                    const practical = item.data;
                    const isActive = selectedPracticalId === practical.id;
                    return (
                      <li key={practical.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectPractical(practical.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            isActive
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-primary/10"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isActive
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconDeviceSpeaker
                              size={12}
                              className={
                                isActive
                                  ? "text-white"
                                  : "text-muted-foreground"
                              }
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs truncate ${
                                isActive
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx + 1}. {practical.title}
                            </span>
                          </span>
                          <span className="text-[10px] flex-shrink-0 text-muted-foreground/70">
                            Practical
                          </span>
                        </button>
                      </li>
                    );
                  }

                  return null;
                })}

                {module.lessons.some(
                  (l) => l.resources && l.resources.length > 0,
                ) && (
                  <>
                    {module.lessons
                      .filter((l) => l.resources && l.resources.length > 0)
                      .flatMap((l) =>
                        l.resources.map((r) => {
                          const isActive = selectedResource?.url === r.url;
                          return (
                            <li
                              key={`${l.id}-resource-${r.url}`}
                              className="px-2 py-0.5"
                            >
                              <button
                                onClick={() => selectResource(r.name, r.url)}
                                className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                                  isActive
                                    ? "bg-primary/10 border-primary/30 font-medium"
                                    : "border-border hover:bg-primary/10"
                                }`}
                                aria-current={isActive ? "page" : undefined}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                    isActive
                                      ? "bg-brand-blue border-brand-blue"
                                      : "border-border bg-transparent"
                                  }`}
                                >
                                  <IconFile
                                    size={12}
                                    className={
                                      isActive
                                        ? "text-white"
                                        : "text-muted-foreground"
                                    }
                                  />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={`block text-xs truncate ${
                                      isActive
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
          </div>
        );
      })}
      {renderCertificationSection()}
    </div>
  );

  const certModule = d?.modules.find((m) => m.isCertificationModule);

  const renderCertificationSection = () => {
    if (!certModule) return null;
    if (d?.batch?.examEnabled === false) return null;
    if (certQuizPassed) return null;

    if (!certExamEligible) {
      return (
        <div className="p-3">
          <div className="rounded-xl border border-border/60 overflow-hidden opacity-80">
            <div className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                <IconAward size={16} className="text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-muted-foreground">
                  Certification Exam
                </span>
                <span className="block text-[11px] mt-0.5 text-muted-foreground/80">
                  Complete all quizzes and assignments to unlock
                </span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3">
        <div className="rounded-xl border border-amber-500/30 overflow-hidden">
          <button
            onClick={() => setShowCertificationExam(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-500/5 ${
              showCertificationExam ? "bg-amber-500/10" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <IconAward size={16} className="text-amber-500" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-snug text-foreground">
                Certification Exam
              </span>
              <span className="block text-[11px] mt-0.5 text-muted-foreground">
                Final exam for certificate
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  };

  const renderContentPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-border shrink-0">
        <button
          onClick={() => setContentPanel("content")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] ${
            contentPanel === "content"
              ? "border-brand-orange text-black"
              : "border-transparent text-slate hover:text-ink"
          }`}
          role="tab"
          aria-selected={contentPanel === "content"}
        >
          <IconBook2 size={14} />
          Course content
        </button>
        <button
          onClick={() => setContentPanel("live")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3.5 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] ${
            contentPanel === "live"
              ? "border-brand-orange text-black"
              : "border-transparent text-slate hover:text-ink"
          }`}
          role="tab"
          aria-selected={contentPanel === "live"}
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
                {d.sessions
                  .filter((s) => s.isLive)
                  .map((session) => (
                    <div key={session.id} className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {session.moduleTitle ?? "Live Session"}
                        </p>
                      </div>
                      {session.joinUrl && (
                        <button
                          onClick={async () => {
                            setJoiningSessionId(session.id);
                            try {
                              await api.post(
                                `/api/attendance/${session.id}/join`,
                              );
                              presence.start(session.id);
                            } catch (err) {
                              console.error("Failed to log attendance:", err);
                            } finally {
                              setJoiningSessionId(null);
                              window.open(
                                session.joinUrl,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }
                          }}
                          disabled={joiningSessionId === session.id}
                          className="text-[10px] px-2 py-1 rounded-md bg-danger text-white shrink-0 font-medium disabled:opacity-60"
                        >
                          {joiningSessionId === session.id
                            ? "Joining..."
                            : "Join"}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 pt-4 pb-2">
                Recorded sessions
              </p>
              {d.recordings.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No past sessions recorded yet
                </p>
              ) : (
                <ul className="pb-3">
                  {d.recordings.map((rec) => {
                    const active = rec.id === selectedRecordingId;
                    return (
                      <li key={rec.id} className="px-2">
                        <button
                          onClick={() => selectRecording(rec.id)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-white/10 font-medium"
                              : "hover:bg-white/5"
                          }`}
                          aria-current={active ? "page" : undefined}
                          style={
                            active
                              ? { boxShadow: "inset 3px 0 0 #2551d9" }
                              : undefined
                          }
                        >
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-muted-foreground">
                            <IconVideo size={16} />
                            {rec.isCompleted && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-white">
                                <IconCheck size={8} />
                              </span>
                            )}
                          </span>
                          {rec.isCompleted && (
                            <span className="sr-only">Completed</span>
                          )}
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-mist">
          {renderMain()}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-card border-t border-border shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            aria-label="Open course contents"
          >
            <IconList size={13} /> Contents
          </button>
          <button
            onClick={() => {
              // Guard: navigation position isn't tracked while a study
              // material resource is open, since resources aren't part
              // of the unified lesson/quiz/assignment ordering.
              if (!selectedModule || selectedResource) return;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" &&
                    item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" &&
                    item.data.id === selectedAssignmentId) ||
                  (item.type === "PRACTICAL" &&
                    item.data.id === selectedPracticalId),
              );
              if (curIdx > 0) {
                const prev = unified[curIdx - 1];
                if (prev.type === "LESSON")
                  selectLesson(prev.data, selectedModule.id);
                else if (prev.type === "QUIZ") selectQuiz(prev.data.id);
                else if (prev.type === "ASSIGNMENT")
                  selectAssignment(prev.data);
                else if (prev.type === "PRACTICAL")
                  selectPractical(prev.data.id);
              } else {
                const modIdx = d.modules.findIndex(
                  (m) => m.id === selectedModuleId,
                );
                if (modIdx > 0) {
                  const prevMod = d.modules[modIdx - 1];
                  const prevUnified = buildUnifiedList(prevMod);
                  if (prevUnified.length > 0) {
                    const last = prevUnified[prevUnified.length - 1];
                    setExpandedModuleId(prevMod.id);
                    if (last.type === "LESSON")
                      selectLesson(last.data, prevMod.id);
                    else if (last.type === "QUIZ") selectQuiz(last.data.id);
                    else if (last.type === "ASSIGNMENT")
                      selectAssignment(last.data);
                    else if (last.type === "PRACTICAL")
                      selectPractical(last.data.id);
                  }
                }
              }
            }}
            disabled={(() => {
              if (!selectedModule || selectedResource) return true;
              const unified = buildUnifiedList(selectedModule!);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" &&
                    item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" &&
                    item.data.id === selectedAssignmentId) ||
                  (item.type === "PRACTICAL" &&
                    item.data.id === selectedPracticalId),
              );
              const isAtFirstInModule = curIdx <= 0;
              const modIdx = d.modules.findIndex(
                (m) => m.id === selectedModuleId,
              );
              return isAtFirstInModule && modIdx <= 0;
            })()}
            className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <IconArrowLeft size={13} /> Previous
          </button>
          <div className="flex-1" />
          <span className="hidden md:inline text-xs text-muted-foreground">
            {selectedModule &&
              !selectedResource &&
              (() => {
                const unified = buildUnifiedList(selectedModule!);
                const curIdx = unified.findIndex(
                  (item) =>
                    (item.type === "LESSON" &&
                      item.data.id === selectedLessonId) ||
                    (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                    (item.type === "ASSIGNMENT" &&
                      item.data.id === selectedAssignmentId) ||
                    (item.type === "PRACTICAL" &&
                      item.data.id === selectedPracticalId),
                );
                return curIdx >= 0
                  ? `Item ${curIdx + 1} of ${unified.length}`
                  : "";
              })()}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setShowStickyWidget((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              showStickyWidget
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
            aria-pressed={showStickyWidget}
          >
            <IconPencil size={13} />
            <span className="hidden sm:inline">
              {showStickyWidget ? "Close Notes" : "Take Note"}
            </span>
          </button>
          <button
            onClick={() => {
              if (!selectedModule || selectedResource) return;
              const unified = buildUnifiedList(selectedModule);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" &&
                    item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" &&
                    item.data.id === selectedAssignmentId) ||
                  (item.type === "PRACTICAL" &&
                    item.data.id === selectedPracticalId),
              );
              if (curIdx >= 0 && curIdx < unified.length - 1) {
                const next = unified[curIdx + 1];
                if (next.type === "LESSON")
                  selectLesson(next.data, selectedModule.id);
                else if (next.type === "QUIZ") selectQuiz(next.data.id);
                else if (next.type === "ASSIGNMENT")
                  selectAssignment(next.data);
                else if (next.type === "PRACTICAL")
                  selectPractical(next.data.id);
              } else {
                const modIdx = d.modules.findIndex(
                  (m) => m.id === selectedModuleId,
                );
                if (modIdx >= 0 && modIdx < d.modules.length - 1) {
                  const nextMod = d.modules[modIdx + 1];
                  const nextUnified = buildUnifiedList(nextMod);
                  if (nextUnified.length > 0) {
                    const first = nextUnified[0];
                    setExpandedModuleId(nextMod.id);
                    if (first.type === "LESSON")
                      selectLesson(first.data, nextMod.id);
                    else if (first.type === "QUIZ") selectQuiz(first.data.id);
                    else if (first.type === "ASSIGNMENT")
                      selectAssignment(first.data);
                    else if (first.type === "PRACTICAL")
                      selectPractical(first.data.id);
                  }
                }
              }
            }}
            disabled={(() => {
              if (!selectedModule || selectedResource) return true;
              const unified = buildUnifiedList(selectedModule!);
              const curIdx = unified.findIndex(
                (item) =>
                  (item.type === "LESSON" &&
                    item.data.id === selectedLessonId) ||
                  (item.type === "QUIZ" && item.data.id === selectedQuizId) ||
                  (item.type === "ASSIGNMENT" &&
                    item.data.id === selectedAssignmentId) ||
                  (item.type === "PRACTICAL" &&
                    item.data.id === selectedPracticalId),
              );
              const isAtLastInModule =
                curIdx >= 0 && curIdx >= unified.length - 1;
              const modIdx = d.modules.findIndex(
                (m) => m.id === selectedModuleId,
              );
              return isAtLastInModule && modIdx >= d.modules.length - 1;
            })()}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-40 transition-opacity focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            Continue <IconArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content panel: static on desktop, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-hairline bg-paper shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-115 lg:max-w-none lg:shrink-0 lg:shadow-none lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Course contents"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border lg:hidden">
          <span className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Contents
          </span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Close contents"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {renderContentPanel()}
        </div>
      </aside>

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
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95         focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        aria-label={
          showStickyWidget ? "Close sticky notes" : "Open sticky notes"
        }
        title={showStickyWidget ? "Close sticky notes" : "Open sticky notes"}
      >
        <IconNotes size={22} />
      </button>
    </div>
  );
}