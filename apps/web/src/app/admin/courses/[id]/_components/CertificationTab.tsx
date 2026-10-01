"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { readSheet } from "read-excel-file/browser";
import {
  IconCheck,
  IconClipboardText,
  IconClock,
  IconExternalLink,
  IconFileSpreadsheet,
  IconLoader2,
  IconPlus,
  IconSettings,
  IconSparkles,
  IconTarget,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { useAIGenerate } from "@/lib/use-ai-generate";
import { FormModal } from "@/components/admin/FormModal";
import type { Course, Module } from "./types";
import { toAIModules } from "./types";
import ModuleCard from "./ModuleCard";

/* ────────────────────────────────────────────────────────────────
   Types & constants
   ──────────────────────────────────────────────────────────────── */

interface CertOption {
  label: string;
  isCorrect: boolean;
}

interface CertQuestion {
  id?: string;
  text: string;
  options: CertOption[];
}

interface CertificationData {
  module: Module | null;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMin: number | null;
    hasMcq: boolean;
    hasAssignment: boolean;
    assignmentInstructions: string | null;
    assignmentPdfUrl: string | null;
    questionCount: number;
    questions?: CertQuestion[];
  } | null;
}

interface CertificationTabProps {
  courseId: string;
}

const DEFAULT_TITLE = "Certification Exam";
const DEFAULT_PASSING_SCORE = 60;
const DEFAULT_TIME_LIMIT = "30";
const ANSWER_LETTERS = ["A", "B", "C", "D"];

const emptyQuestion = (): CertQuestion => ({
  text: "",
  options: [{ label: "", isCorrect: false }],
});

const cloneQuestion = (q: CertQuestion): CertQuestion => ({
  ...q,
  options: q.options.map((o) => ({ ...o })),
});

const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? "s" : ""}`;

/* ────────────────────────────────────────────────────────────────
   Small presentational pieces
   ──────────────────────────────────────────────────────────────── */

function CardHeader({
  icon: IconCmp,
  title,
  subtitle,
  action,
}: {
  icon: Icon;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <IconCmp className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatTile({
  icon: IconCmp,
  label,
  children,
  tone,
}: {
  icon: Icon;
  label: string;
  children: ReactNode;
  tone: string;
}) {
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
      >
        <IconCmp className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="truncate text-sm font-semibold text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function SummaryStats({ quiz }: { quiz: NonNullable<CertificationData["quiz"]> }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={IconTarget}
        label="Passing score"
        tone="bg-green-500/10 text-green-600"
      >
        {quiz.passingScore}%
      </StatTile>
      <StatTile
        icon={IconClock}
        label="Time limit"
        tone="bg-blue-500/10 text-blue-600"
      >
        {quiz.timeLimitMin ? `${quiz.timeLimitMin} min` : "No limit"}
      </StatTile>
      <StatTile
        icon={IconClipboardText}
        label="Questions"
        tone="bg-amber-500/10 text-amber-600"
      >
        {quiz.questionCount}
      </StatTile>
      <StatTile
        icon={IconExternalLink}
        label="Question paper"
        tone="bg-violet-500/10 text-violet-600"
      >
        {quiz.assignmentPdfUrl ? (
          <a
            href={quiz.assignmentPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View PDF
          </a>
        ) : quiz.hasAssignment ? (
          "Assignment only"
        ) : (
          "None"
        )}
      </StatTile>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Question editor (used inside the modal)
   ──────────────────────────────────────────────────────────────── */

interface QuestionEditorProps {
  index: number;
  question: CertQuestion;
  canRemove: boolean;
  onRemove: () => void;
  onTextChange: (text: string) => void;
  onAddOption: () => void;
  onRemoveOption: (oIndex: number) => void;
  onOptionLabel: (oIndex: number, label: string) => void;
  onMarkCorrect: (oIndex: number) => void;
}

function QuestionEditor({
  index,
  question,
  canRemove,
  onRemove,
  onTextChange,
  onAddOption,
  onRemoveOption,
  onOptionLabel,
  onMarkCorrect,
}: QuestionEditorProps) {
  const hasCorrect = question.options.some((o) => o.isCorrect);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-xs font-bold text-amber-600">
            {index + 1}
          </span>
          {!hasCorrect && question.text.trim() && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">
              Pick the correct answer
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
            className="rounded p-1 text-muted transition-colors hover:bg-red-500/10 hover:text-danger"
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      <input
        type="text"
        value={question.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Type the question"
        className="input text-sm"
      />

      <div className="space-y-2">
        <p className="text-xs text-muted">
          Options — select the circle next to the correct answer
        </p>
        {question.options.map((opt, oIndex) => (
          <div
            key={oIndex}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${opt.isCorrect
              ? "border-green-400/60 bg-green-500/5"
              : "border-transparent"
              }`}
          >
            <input
              type="radio"
              name={`correct-${index}`}
              checked={opt.isCorrect}
              onChange={() => onMarkCorrect(oIndex)}
              aria-label={`Mark option ${oIndex + 1} as correct`}
              className="h-4 w-4 shrink-0 accent-green-600"
            />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => onOptionLabel(oIndex, e.target.value)}
              placeholder={`Option ${oIndex + 1}`}
              className="input flex-1"
            />
            {opt.isCorrect && (
              <IconCheck className="h-4 w-4 shrink-0 text-green-600" />
            )}
            {question.options.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveOption(oIndex)}
                aria-label={`Remove option ${oIndex + 1}`}
                className="rounded p-1 text-muted transition-colors hover:text-danger"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAddOption}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
        >
          <IconPlus size={12} /> Add option
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────── */

export default function CertificationTab({ courseId }: CertificationTabProps) {
  /* ── Data ─────────────────────────────────────────────────── */
  const courseQuery = useApiQuery<Course>(
    ["admin", "courses", courseId],
    `/api/admin/courses/${courseId}`,
  );
  const certQuery = useApiQuery<CertificationData>(
    ["admin", "courses", courseId, "certification"],
    `/api/admin/courses/${courseId}/certification`,
  );

  /* ── Form state ───────────────────────────────────────────── */
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [passingScore, setPassingScore] = useState(DEFAULT_PASSING_SCORE);
  const [timeLimitMin, setTimeLimitMin] = useState(DEFAULT_TIME_LIMIT);
  const [questions, setQuestions] = useState<CertQuestion[]>([emptyQuestion()]);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentPdfUrl, setAssignmentPdfUrl] = useState("");

  /* ── UI state ─────────────────────────────────────────────── */
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(10);
  const aiGenerate = useAIGenerate<{ title: string; questions: CertQuestion[] }>();

  /* ── Sync server data into the form ───────────────────────── */
  useEffect(() => {
    const result = certQuery.data;
    if (!result?.quiz) return;

    setTitle(result.module?.title ?? DEFAULT_TITLE);
    setPassingScore(result.quiz.passingScore);
    setTimeLimitMin(result.quiz.timeLimitMin?.toString() ?? DEFAULT_TIME_LIMIT);
    setHasAssignment(result.quiz.hasAssignment ?? false);
    setAssignmentInstructions(result.quiz.assignmentInstructions ?? "");
    setAssignmentPdfUrl(result.quiz.assignmentPdfUrl ?? "");
    setQuestions(
      result.quiz.questions?.length
        ? result.quiz.questions.map(cloneQuestion)
        : [emptyQuestion()],
    );
  }, [certQuery.data]);

  const reload = () => {
    void courseQuery.refetch();
    void certQuery.refetch();
  };

  /* ── Save ─────────────────────────────────────────────────── */
  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/admin/courses/${courseId}/certification`, {
        title,
        passingScore,
        timeLimitMin: timeLimitMin ? parseInt(timeLimitMin, 10) : null,
        hasAssignment,
        assignmentInstructions: hasAssignment ? assignmentInstructions : null,
        assignmentPdfUrl: hasAssignment ? assignmentPdfUrl || null : null,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({
            label: o.label,
            isCorrect: o.isCorrect,
          })),
        })),
      }),
    onSuccess: () => {
      toast.success("Certification settings saved");
      reload();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const saveQuestionsAndClose = () =>
    saveMutation.mutate(undefined, {
      onSuccess: () => setShowQuestionsModal(false),
    });

  /* ── Question helpers (immutable updates) ─────────────────── */
  const updateQuestion = (qIndex: number, patch: (q: CertQuestion) => CertQuestion) =>
    setQuestions((prev) => prev.map((q, i) => (i === qIndex ? patch(q) : q)));

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qIndex: number) =>
    setQuestions((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== qIndex) : prev,
    );

  const addOption = (qIndex: number) =>
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: [...q.options, { label: "", isCorrect: false }],
    }));

  const removeOption = (qIndex: number, oIndex: number) =>
    updateQuestion(qIndex, (q) =>
      q.options.length > 1
        ? { ...q, options: q.options.filter((_, oi) => oi !== oIndex) }
        : q,
    );

  const updateOptionLabel = (qIndex: number, oIndex: number, label: string) =>
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: q.options.map((o, oi) => (oi === oIndex ? { ...o, label } : o)),
    }));

  const markCorrectOption = (qIndex: number, oIndex: number) =>
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === oIndex })),
    }));

  /* ── AI generation ────────────────────────────────────────── */
  const handleAiGenerate = () => {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic for the AI to generate exam questions about");
      return;
    }
    aiGenerate.mutate(
      {
        type: "QUIZ",
        prompt: `Certification exam covering: ${aiTopic.trim()}`,
        context: {
          courseTitle: courseQuery.data?.title,
          courseDescription: courseQuery.data?.description ?? undefined,
          modules: toAIModules(courseQuery.data?.modules ?? []),
          questionCount: aiCount,
          difficulty: "intermediate",
        },
      },
      {
        onSuccess: (res) => {
          const generated = res.data.questions;
          if (!generated?.length) {
            toast.error("AI returned no questions");
            return;
          }
          setQuestions(
            generated.map((q) => ({
              text: q.text,
              options: q.options.map((o) => ({ ...o })),
            })),
          );
          toast.success(
            `Generated ${plural(generated.length, "exam question")} — review and save`,
          );
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  /* ── Excel import ─────────────────────────────────────────── */
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await readSheet(file);
      const imported: CertQuestion[] = [];
      let skipped = 0;

      rows.forEach((row, rowIndex) => {
        const text = String(row[0] ?? "").trim();
        const answer = String(row[5] ?? "").trim().toUpperCase();
        const answerIndex = ANSWER_LETTERS.indexOf(answer);

        // Silently skip a header row (first row without a valid A–D answer)
        if (rowIndex === 0 && answerIndex === -1) return;

        const options: CertOption[] = [1, 2, 3, 4].map((col, i) => ({
          label: String(row[col] ?? "").trim(),
          isCorrect: i === answerIndex,
        }));

        if (!text || options.every((o) => !o.label)) {
          skipped++;
          return;
        }

        imported.push({
          text,
          options: options.filter((o) => o.label || o.isCorrect),
        });
      });

      if (imported.length === 0) {
        toast.error("No valid questions found. Check the file format.");
        return;
      }

      // Replace the untouched placeholder question instead of appending after it
      setQuestions((prev) => {
        const onlyBlank = prev.length === 1 && !prev[0].text.trim();
        return onlyBlank ? imported : [...prev, ...imported];
      });
      toast.success(
        `Imported ${plural(imported.length, "question")}${skipped > 0 ? ` (${plural(skipped, "row")} skipped)` : ""
        }`,
      );
    } catch {
      toast.error("Failed to read the Excel file. Use a .xlsx file.");
    } finally {
      e.target.value = "";
    }
  };

  /* ── Derived values ───────────────────────────────────────── */
  const filledQuestions = questions.filter((q) => q.text.trim());
  const certModule = courseQuery.data?.modules.find((m) => m.isCertificationModule);
  const certQuiz = certQuery.data?.quiz;

  if (courseQuery.isPending || certQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* 1 · Summary strip */}
      {certQuiz && <SummaryStats quiz={certQuiz} />}

      {/* 2 · Certification module */}
      {certModule ? (
        <ModuleCard
          key={certModule.id}
          module={certModule}
          index={0}
          courseId={courseId}
          courseTitle={courseQuery.data?.title}
          courseDescription={courseQuery.data?.description ?? undefined}
          courseModules={toAIModules(courseQuery.data?.modules ?? [])}
          onChanged={reload}
          certModule
          onAddQuestion={() => setShowQuestionsModal(true)}
          onAddAssignment={() => {
            document
              .querySelector<HTMLButtonElement>(
                `[data-cert-add-assignment="${certModule.id}"]`,
              )
              ?.click();
          }}
          passingScore={passingScore}
          timeLimitMin={timeLimitMin ? parseInt(timeLimitMin, 10) : null}
          onMoveUp={() => { }}
          onMoveDown={() => { }}
          canMoveUp={false}
          canMoveDown={false}
        />
      ) : (
        <div className="glass-card flex items-start gap-3 border-l-4 border-amber-400 p-5">
          <IconSettings className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-muted">
            No certification module exists for this course yet. Configure the
            exam below and click{" "}
            <span className="font-medium text-foreground">Save settings</span>{" "}
            to create it. It always appears as the last module.
          </p>
        </div>
      )}

      {/* 3 · Exam settings + questions, side by side on large screens */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section id="cert-exam-settings" className="glass-card scroll-mt-24 p-6 lg:col-span-3">
          <CardHeader
            icon={IconSettings}
            title="Exam settings"
            subtitle="Set the title, pass mark and time limit"
          />

          <div className="space-y-5">
            <div className="field">
              <label className="label">
                Exam title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-green-500" />
                  Passing score (%) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) =>
                    setPassingScore(parseInt(e.target.value, 10) || DEFAULT_PASSING_SCORE)
                  }
                  className="input"
                />
                <p className="mt-1 text-xs text-muted">
                  Students need at least {passingScore}% to pass.
                </p>
              </div>

              <div className="field">
                <label className="label flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-blue-500" />
                  Time limit (minutes) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={timeLimitMin}
                  onChange={(e) => setTimeLimitMin(e.target.value)}
                  className="input"
                />
                <p className="mt-1 text-xs text-muted">
                  A countdown runs and the exam auto-submits at 0.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                className="btn-primary inline-flex items-center gap-2"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconCheck className="h-4 w-4" />
                )}
                Save settings
              </button>
            </div>
          </div>
        </section>

        <section className="glass-card flex flex-col p-6 lg:col-span-2">
          <CardHeader
            icon={IconClipboardText}
            title="Exam questions"
            subtitle={`${plural(filledQuestions.length, "MCQ question")} added`}
          />

          {filledQuestions.length > 0 ? (
            <ul className="space-y-1.5">
              {filledQuestions.slice(0, 5).map((q, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-xs"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-600">
                    {idx + 1}
                  </span>
                  <span className="truncate text-foreground">{q.text}</span>
                  <span className="ml-auto shrink-0 text-muted">
                    {q.options.length} options
                  </span>
                </li>
              ))}
              {filledQuestions.length > 5 && (
                <li className="pt-1 text-center text-[11px] text-muted">
                  +{filledQuestions.length - 5} more
                </li>
              )}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted">
              No questions yet. Add them by hand, import from Excel, or
              generate them with AI.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowQuestionsModal(true)}
            className="btn-primary mt-auto inline-flex items-center justify-center gap-1.5 self-stretch pt-0 text-xs"
            style={{ marginTop: "1.25rem" }}
          >
            <IconClipboardText size={14} />
            Edit questions
          </button>
        </section>
      </div>

      {/* 4 · Questions modal */}
      <FormModal
        open={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        title="Edit exam questions"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowQuestionsModal(false)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveQuestionsAndClose}
              className="btn-primary flex items-center gap-1 px-3 py-1.5 text-xs"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <IconLoader2 className="h-3 w-3 animate-spin" />
              )}
              Save questions
            </button>
          </>
        }
      >
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2">
          {/* Import + AI tools */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300/60 bg-emerald-50 p-3">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Import from Excel
                </p>
                <p className="text-[11px] text-emerald-700/80">
                  Columns: Question, A, B, C, D, Correct (A–D)
                </p>
              </div>
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-300/60 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <IconFileSpreadsheet size={13} />
                Choose file
              </button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-violet-300/50 bg-violet-500/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                <IconSparkles size={14} />
                Generate with AI
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAiGenerate();
                    }
                  }}
                  placeholder="Topic, e.g. Python for Data Science"
                  className="input min-w-0 flex-1 text-xs"
                />
                <input
                  type="number"
                  value={aiCount}
                  onChange={(e) =>
                    setAiCount(
                      Math.min(Math.max(parseInt(e.target.value, 10) || 10, 1), 30),
                    )
                  }
                  min={1}
                  max={30}
                  title="Number of questions"
                  className="input w-16 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiGenerate.isPending}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
                >
                  {aiGenerate.isPending && (
                    <IconLoader2 size={12} className="animate-spin" />
                  )}
                  {aiGenerate.isPending ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>

          {/* Question list */}
          {questions.map((q, qIndex) => (
            <QuestionEditor
              key={qIndex}
              index={qIndex}
              question={q}
              canRemove={questions.length > 1}
              onRemove={() => removeQuestion(qIndex)}
              onTextChange={(text) => updateQuestion(qIndex, (x) => ({ ...x, text }))}
              onAddOption={() => addOption(qIndex)}
              onRemoveOption={(oIndex) => removeOption(qIndex, oIndex)}
              onOptionLabel={(oIndex, label) => updateOptionLabel(qIndex, oIndex, label)}
              onMarkCorrect={(oIndex) => markCorrectOption(qIndex, oIndex)}
            />
          ))}

          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            >
              <IconPlus size={14} /> Add question
            </button>
            <span className="text-[11px] text-muted">
              {plural(questions.length, "question")}
            </span>
          </div>
        </div>
      </FormModal>
    </div>
  );
}