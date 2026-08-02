"use client";

import { useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconChevronDown,
  IconClipboardCheck,
  IconFile,
  IconFileSpreadsheet,
  IconPlayerPlay,
  IconDeviceSpeaker,
  IconDownload,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";
import { getDrivePreviewUrl } from "@/lib/drive";
import { VideoPlayer } from "../../../../student/_views/_comps/VideoPlayer";
import StudyMaterialContent from "../../../../student/_views/_comps/StudyMaterialContent";
import AssignmentContent from "../../../../student/_views/_comps/AssignmentContent";

type Resource = {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: Resource[];
};

type QuizQuestion = {
  id: string;
  text: string;
  options: Array<{ label: string; isCorrect: boolean }>;
};

type Quiz = {
  id: string;
  title: string;
  dueDate?: string | null;
  passingScore?: number;
  timeLimitMin?: number | null;
  maxAttempts?: number | null;
  questions: QuizQuestion[];
};

type Assignment = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  dueDate: string;
  maxPoints: number;
  questionPdfUrl: string | null;
};

type Practical = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  pdfUrl: string | null;
  resources: Resource[];
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  contentOrder: Array<{ type: string; id: string }> | null;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
  practicals: Practical[];
};

export type InstructorCourse = {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  modules: Module[];
};

type UnifiedItem =
  | { type: "LESSON"; data: Lesson }
  | { type: "QUIZ"; data: Quiz }
  | { type: "ASSIGNMENT"; data: Assignment }
  | { type: "PRACTICAL"; data: Practical };

function buildUnifiedList(mod: Module): UnifiedItem[] {
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

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

function toCourseLesson(lesson: Lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    videoType: lesson.videoType,
    videoUrl: lesson.videoUrl,
    videoEmbedId: lesson.videoEmbedId,
    durationSeconds: lesson.durationSeconds,
    isFreePreview: lesson.isFreePreview,
    resources: (lesson.resources || []).map((r) => ({
      name: r.name,
      url: r.url,
    })),
  };
}

export default function InstructorCourseContentView({
  course,
  onExit,
}: {
  course: InstructorCourse;
  onExit: () => void;
}) {
  const initialModule = course.modules[0] ?? null;
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    initialModule?.id ?? null,
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    initialModule?.lessons[0]?.id ?? null,
  );
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(initialModule ? [initialModule.id] : []),
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const selectLesson = (lesson: Lesson, moduleId: string) => {
    setSelectedLessonId(lesson.id);
    setSelectedModuleId(moduleId);
    setSelectedQuizId(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);
    setSelectedResource(null);
    setExpandedModules((prev) => new Set([...prev, moduleId]));
  };

  const selectQuiz = (quiz: Quiz, moduleId: string) => {
    setSelectedQuizId(quiz.id);
    setSelectedModuleId(moduleId);
    setSelectedLessonId(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);
    setSelectedResource(null);
    setExpandedModules((prev) => new Set([...prev, moduleId]));
  };

  const selectAssignment = (assignment: Assignment, moduleId: string) => {
    setSelectedAssignmentId(assignment.id);
    setSelectedModuleId(moduleId);
    setSelectedLessonId(null);
    setSelectedQuizId(null);
    setSelectedPracticalId(null);
    setSelectedResource(null);
    setExpandedModules((prev) => new Set([...prev, moduleId]));
  };

  const selectPractical = (practical: Practical, moduleId: string) => {
    setSelectedPracticalId(practical.id);
    setSelectedModuleId(moduleId);
    setSelectedLessonId(null);
    setSelectedQuizId(null);
    setSelectedAssignmentId(null);
    setSelectedResource(null);
    setExpandedModules((prev) => new Set([...prev, moduleId]));
  };

  const selectResource = (name: string, url: string) => {
    setSelectedResource({ name, url });
    setSelectedLessonId(null);
    setSelectedQuizId(null);
    setSelectedAssignmentId(null);
    setSelectedPracticalId(null);
  };

  const selectedModule =
    course.modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedLesson =
    selectedModule?.lessons.find((l) => l.id === selectedLessonId) ?? null;
  const selectedQuiz =
    selectedModule?.quizzes.find((q) => q.id === selectedQuizId) ?? null;
  const selectedAssignment =
    selectedModule?.assignments.find((a) => a.id === selectedAssignmentId) ??
    null;
  const selectedPractical =
    selectedModule?.practicals.find((p) => p.id === selectedPracticalId) ??
    null;

  const renderQuiz = (quiz: Quiz, moduleName: string) => (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <IconClipboardCheck size={15} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Quiz
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground mt-1">{quiz.title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Module: {moduleName}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>
            {quiz.questions.length}{" "}
            {quiz.questions.length === 1 ? "question" : "questions"}
          </span>
          {quiz.passingScore ? (
            <span>Pass: {quiz.passingScore}%</span>
          ) : null}
          {quiz.timeLimitMin ? (
            <span>
              <IconClock size={10} className="inline mr-0.5" />
              {quiz.timeLimitMin} min
            </span>
          ) : null}
          {quiz.dueDate ? (
            <span>
              Due:{" "}
              {new Date(quiz.dueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted mt-2">
          Correct answers are highlighted in green.
        </p>
      </div>

      {quiz.questions.map((q, qi) => (
        <div
          key={q.id}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {qi + 1}. {q.text}
            </p>
            <span className="shrink-0 mt-0.5 text-[10px] font-bold text-white bg-muted px-2 py-0.5 rounded">
              {q.options.length > 0 ? "MCQ" : "Q"}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => {
              const letter = String.fromCharCode(65 + oi);
              return (
                <div
                  key={`${opt.label}-${oi}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                    opt.isCorrect
                      ? "border-[#158A5C]/30 bg-[#158A5C]/10"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border-2 ${
                      opt.isCorrect
                        ? "bg-[#158A5C] text-white border-[#158A5C]"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 text-sm text-foreground">
                    {opt.label}
                  </span>
                  {opt.isCorrect && (
                    <span className="text-[10px] font-semibold text-[#158A5C] shrink-0 inline-flex items-center gap-1">
                      <IconCheck size={11} /> Correct
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPractical = (practical: Practical, moduleName: string) => (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-blue-tint text-brand-blue">
            <IconDeviceSpeaker size={15} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Hands-On / Practical
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground mt-1">
          {practical.title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Module: {moduleName}
        </p>
        {practical.description && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {practical.description}
          </p>
        )}
      </div>

      {practical.videoUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          {practical.videoType === "youtube" && practical.videoEmbedId ? (
            <iframe
              src={`https://www.youtube.com/embed/${practical.videoEmbedId}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : practical.videoType === "vimeo" && practical.videoEmbedId ? (
            <iframe
              src={`https://player.vimeo.com/video/${practical.videoEmbedId}`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : practical.videoUrl.includes("loom.com/embed/") ||
            practical.videoUrl.includes("loom.com/share/") ? (
            <iframe
              src={practical.videoUrl.replace(/\/share\//, "/embed/")}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={practical.videoUrl}
              controls
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
        </div>
      )}

      {practical.pdfUrl && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <IconFile size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                PDF Document
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {practical.title}
              </p>
            </div>
            <a
              href={getDrivePreviewUrl(practical.pdfUrl)}
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

      {practical.resources && practical.resources.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground mb-3">
            Resources
          </p>
          <ul className="space-y-2">
            {practical.resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <IconFile size={14} />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-medium text-foreground truncate">
                    {r.originalName || r.name}
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
    </div>
  );

  const renderMain = () => {
    if (selectedQuiz && selectedModule) {
      return renderQuiz(selectedQuiz, selectedModule.title);
    }

    if (selectedAssignment && selectedModule) {
      const assignmentInfo = {
        id: selectedAssignment.id,
        title: selectedAssignment.title,
        type: selectedAssignment.type,
        description: selectedAssignment.description ?? "",
        maxPoints: selectedAssignment.maxPoints,
        dueDate: selectedAssignment.dueDate,
        questionPdfUrl: selectedAssignment.questionPdfUrl,
      };
      return (
        <AssignmentContent
          assignment={assignmentInfo}
          moduleName={selectedModule.title}
          onBack={() => setSelectedAssignmentId(null)}
        />
      );
    }

    if (selectedPractical && selectedModule) {
      return renderPractical(selectedPractical, selectedModule.title);
    }

    if (selectedResource) {
      return <StudyMaterialContent name={selectedResource.name} url={selectedResource.url} />;
    }

    return (
      <>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <VideoPlayer lesson={selectedLesson ? toCourseLesson(selectedLesson) : null} recording={null} />
        </div>
        <div className="px-1">
          <h2 className="text-base font-semibold text-foreground mt-4">
            {selectedLesson?.title ?? selectedModule?.title ?? "Select a lesson"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedLesson?.durationSeconds
              ? `Lesson · ${formatDuration(selectedLesson.durationSeconds)}`
              : "Lesson"}
            {selectedModule ? ` · Module ${selectedModule.order}` : ""}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 mt-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <IconBook2 size={15} />
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              About this lesson
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
      {course.modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
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
              className={`w-full flex items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                isActiveModule ? "bg-primary/5" : ""
              }`}
              aria-expanded={isExpanded}
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-foreground">
                  Module {module.order} – {module.title}
                </span>
                <span className="block text-[11px] mt-0.5 text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                  {totalSeconds ? ` · ${formatDuration(totalSeconds)}` : ""}
                </span>
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
                    const active = lesson.id === selectedLessonId;
                    return (
                      <li key={lesson.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectLesson(lesson, module.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-muted/50"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconPlayerPlay
                              size={11}
                              className={
                                active
                                  ? "text-white ml-px"
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
                              {idx + 1}. {lesson.title}
                            </span>
                          </span>
                          {lesson.durationSeconds ? (
                            <span className="text-[10px] shrink-0 text-muted-foreground/70">
                              {formatDuration(lesson.durationSeconds)}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "QUIZ") {
                    const quiz = item.data;
                    const active = quiz.id === selectedQuizId;
                    return (
                      <li key={quiz.id} className="px-2 py-0.5">
                        <button
                          onClick={() => selectQuiz(quiz, module.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-muted/50"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconClipboardCheck
                              size={12}
                              className={
                                active
                                  ? "text-white"
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
                              {idx + 1}. {quiz.title}
                            </span>
                          </span>
                          <span className="text-[10px] shrink-0 text-muted-foreground/70">
                            {quiz.questions.length}Q
                          </span>
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "ASSIGNMENT") {
                    const assignment = item.data;
                    const active = assignment.id === selectedAssignmentId;
                    return (
                      <li key={assignment.id} className="px-2 py-0.5">
                        <button
                          onClick={() =>
                            selectAssignment(assignment, module.id)
                          }
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-muted/50"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconFileSpreadsheet
                              size={12}
                              className={
                                active
                                  ? "text-white"
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
                              {idx + 1}. {assignment.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  }

                  if (item.type === "PRACTICAL") {
                    const practical = item.data;
                    const active = practical.id === selectedPracticalId;
                    return (
                      <li key={practical.id} className="px-2 py-0.5">
                        <button
                          onClick={() =>
                            selectPractical(practical, module.id)
                          }
                          className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                            active
                              ? "bg-primary/10 border-primary/30 font-medium"
                              : "border-border hover:bg-muted/50"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "bg-brand-blue border-brand-blue"
                                : "border-border bg-transparent"
                            }`}
                          >
                            <IconDeviceSpeaker
                              size={12}
                              className={
                                active
                                  ? "text-white"
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
                              key={`${l.id}-resource-${r.id}`}
                              className="px-2 py-0.5"
                            >
                              <button
                                onClick={() =>
                                  selectResource(r.name || r.originalName, r.url)
                                }
                                className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                                  isActive
                                    ? "bg-primary/10 border-success/30 font-medium"
                                    : "border-border hover:bg-muted/50"
                                }`}
                                aria-current={isActive ? "page" : undefined}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                    isActive
                                      ? "bg-success border-success"
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
                                    {r.originalName || r.name}
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
    </div>
  );

  const getCurrentPosition = () => {
    if (!selectedModule) return null;
    const unified = buildUnifiedList(selectedModule);
    return unified.findIndex((item) => {
      if (item.type === "LESSON" && item.data.id === selectedLessonId)
        return true;
      if (item.type === "QUIZ" && item.data.id === selectedQuizId) return true;
      if (item.type === "ASSIGNMENT" && item.data.id === selectedAssignmentId)
        return true;
      if (item.type === "PRACTICAL" && item.data.id === selectedPracticalId)
        return true;
      return false;
    });
  };

  const goPrev = () => {
    if (!selectedModule) return;
    const unified = buildUnifiedList(selectedModule);
    const curIdx = getCurrentPosition();
    if (curIdx === null || curIdx < 0) return;
    if (curIdx > 0) {
      const prev = unified[curIdx - 1];
      if (prev.type === "LESSON") selectLesson(prev.data, selectedModule.id);
      else if (prev.type === "QUIZ") selectQuiz(prev.data, selectedModule.id);
      else if (prev.type === "ASSIGNMENT")
        selectAssignment(prev.data, selectedModule.id);
      else if (prev.type === "PRACTICAL")
        selectPractical(prev.data, selectedModule.id);
      return;
    }
    const modIdx = course.modules.findIndex((m) => m.id === selectedModule.id);
    if (modIdx > 0) {
      const prevMod = course.modules[modIdx - 1];
      const prevUnified = buildUnifiedList(prevMod);
      if (prevUnified.length > 0) {
        const last = prevUnified[prevUnified.length - 1];
        setExpandedModules((prevSet) => new Set([...prevSet, prevMod.id]));
        if (last.type === "LESSON") selectLesson(last.data, prevMod.id);
        else if (last.type === "QUIZ") selectQuiz(last.data, prevMod.id);
        else if (last.type === "ASSIGNMENT")
          selectAssignment(last.data, prevMod.id);
        else if (last.type === "PRACTICAL")
          selectPractical(last.data, prevMod.id);
      }
    }
  };

  const goNext = () => {
    if (!selectedModule) return;
    const unified = buildUnifiedList(selectedModule);
    const curIdx = getCurrentPosition();
    if (curIdx === null || curIdx < 0) return;
    if (curIdx >= 0 && curIdx < unified.length - 1) {
      const next = unified[curIdx + 1];
      if (next.type === "LESSON") selectLesson(next.data, selectedModule.id);
      else if (next.type === "QUIZ") selectQuiz(next.data, selectedModule.id);
      else if (next.type === "ASSIGNMENT")
        selectAssignment(next.data, selectedModule.id);
      else if (next.type === "PRACTICAL")
        selectPractical(next.data, selectedModule.id);
      return;
    }
    const modIdx = course.modules.findIndex((m) => m.id === selectedModule.id);
    if (modIdx >= 0 && modIdx < course.modules.length - 1) {
      const nextMod = course.modules[modIdx + 1];
      const nextUnified = buildUnifiedList(nextMod);
      if (nextUnified.length > 0) {
        const first = nextUnified[0];
        setExpandedModules((prevSet) => new Set([...prevSet, nextMod.id]));
        if (first.type === "LESSON") selectLesson(first.data, nextMod.id);
        else if (first.type === "QUIZ") selectQuiz(first.data, nextMod.id);
        else if (first.type === "ASSIGNMENT")
          selectAssignment(first.data, nextMod.id);
        else if (first.type === "PRACTICAL")
          selectPractical(first.data, nextMod.id);
      }
    }
  };

  const curPos = getCurrentPosition();
  const unified = selectedModule ? buildUnifiedList(selectedModule) : [];
  const isAtFirst = (curPos ?? 0) <= 0 && selectedModuleId === course.modules[0]?.id;
  const isAtLast =
    (curPos ?? 0) >= unified.length - 1 &&
    selectedModuleId === course.modules[course.modules.length - 1]?.id;

  return (
    <div className="flex h-[calc(100vh-56px-2.5rem)] gap-0 overflow-hidden rounded-2xl border border-border">
      {/* Sidebar */}
      <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Course Content
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {course.title}
            </p>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <IconArrowLeft size={13} />
            Exit
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{renderAccordion()}</div>
      </div>

      {/* Main pane */}
      <div className="flex h-full flex-1 flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 bg-mist">{renderMain()}</div>

        <div className="flex items-center gap-3 px-5 py-2.5 bg-card border-t border-border shrink-0">
          <button
            onClick={goPrev}
            disabled={isAtFirst}
            className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <IconArrowLeft size={13} /> Previous
          </button>
          <div className="flex-1" />
          {selectedModule && curPos != null && curPos >= 0 && (
            <span className="text-xs text-muted-foreground">
              Item {curPos + 1} of {unified.length}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={goNext}
            disabled={isAtLast}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-40 transition-opacity focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            Continue <IconArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
