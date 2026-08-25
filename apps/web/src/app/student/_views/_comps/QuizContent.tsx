"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconRotateClockwise,
  IconFileDownload,
  IconUpload,
  IconFile,
  IconFileSpreadsheet,
  IconChartBar,
  IconArrowLeft,
  IconArrowRight,
  IconListDetails,
  IconTargetArrow,
  IconStarFilled,
  IconClock,
} from "@tabler/icons-react";

interface QuizOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  marks: number;
  options: QuizOption[];
}

export interface QuizData {
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
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
}

interface QuizContentProps {
  quizData: QuizData;
  selectedAnswers: Record<string, string>;
  quizSubmitted: boolean;
  quizSubmitting: boolean;
  quizResult: QuizResult | null;
  onAnswerSelect: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  // Required: the pass threshold for this quiz, as returned by your API.
  // No default is assumed here — pass this through from real quiz data.
  passingPercentage: number;
  // Optional: called when the user clicks "Retake" on the results screen.
  // The quiz data model here is single-attempt (selectedAnswers/quizSubmitted are
  // controlled by the parent), so actually clearing answers for a retake needs to
  // happen upstream — wire this up if/when retakes are supported.
  onRetake?: () => void;
}

type Phase = "intro" | "active" | "results";

// Three-tier result language, shared by the emoji, gauge, and result pill so
// they always agree with each other instead of the gauge staying green on a
// fail.
type ResultTier = "pass" | "partial" | "fail";

function getResultTier(
  percentage: number,
  passingPercentage: number,
): ResultTier {
  if (percentage >= passingPercentage) return "pass";
  if (percentage >= passingPercentage / 2) return "partial";
  return "fail";
}

// Distinct, colorblind-friendlier palette: green for pass, amber for partial,
// rose for fail/incorrect. Rose (not the app's generic "danger" red) is used
// specifically for wrong answers so it reads as "incorrect" rather than a
// generic error state.
const TIER_STYLES: Record<
  ResultTier,
  { stroke: string; text: string; bg: string; border: string; emoji: string }
> = {
  pass: {
    stroke: "text-[#158A5C]",
    text: "text-[#158A5C]",
    bg: "bg-[#158A5C]/10",
    border: "border-[#158A5C]/30",
    emoji: "🎉",
  },
  partial: {
    stroke: "text-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    emoji: "💪",
  },
  fail: {
    stroke: "text-[#D6293A]",
    text: "text-[#D6293A]",
    bg: "bg-[#D6293A]/10",
    border: "border-[#D6293A]/30",
    emoji: "📚",
  },
};

function ScoreGauge({
  percentage,
  tier,
}: {
  percentage: number;
  tier: ResultTier;
}) {
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width="200"
      height="110"
      viewBox="0 0 200 110"
      role="img"
      aria-label={`Score: ${clamped}%`}
    >
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="currentColor"
        className="text-border"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="currentColor"
        className={TIER_STYLES[tier].stroke}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
      <text
        x="100"
        y="88"
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: "28px", fontWeight: 700 }}
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

// Thin progress bar shown while the quiz is in progress, so completion is
// visible at a glance instead of only as "3 of 10 answered" text.
function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground text-right">
        {answered} of {total} answered
      </p>
    </div>
  );
}

// One consolidated state for an option marker, computed once instead of
// scattered across cardClass / markerIconClass / label logic separately —
// this is what used to drift out of sync and cause bugs.
type OptionState = "default" | "selected" | "correct" | "wrong";

function getOptionState(
  isSelected: boolean,
  quizSubmitted: boolean,
  isCorrectAnswer: boolean,
  isWrongSelection: boolean,
): OptionState {
  if (quizSubmitted) {
    if (isCorrectAnswer) return "correct";
    if (isWrongSelection) return "wrong";
    return "default";
  }
  return isSelected ? "selected" : "default";
}

// Plain radio-style marker (empty ring / filled dot), no numbers, no icons —
// matches a simple exam-style options list. Card / text handle the row
// background + label color; ring / dot handle the radio circle itself.
const OPTION_STATE_STYLES: Record<OptionState, { card: string; text: string }> =
  {
    default: {
      card: "border-border/60 hover:border-border",
      text: "text-foreground",
    },
    selected: {
      card: "border-primary/60 bg-primary/5",
      text: "text-foreground",
    },
    correct: {
      card: "border-[#158A5C]/30 bg-[#158A5C]/10",
      text: "text-[#158A5C]",
    },
    wrong: {
      card: "border-[#D6293A]/30 bg-[#D6293A]/10",
      text: "text-[#D6293A]",
    },
  };

export default function QuizContent({
  quizData,
  selectedAnswers,
  quizSubmitted,
  quizSubmitting,
  quizResult,
  onAnswerSelect,
  onSubmit,
  onBack,
  passingPercentage,
  onRetake,
}: QuizContentProps) {
  const [phase, setPhase] = useState<Phase>(
    quizSubmitted ? "results" : "intro",
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Assignment file upload state
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
  const assignmentFileRef = useRef<HTMLInputElement>(null);

  // Assignment file submission mutation (quiz ID doubles as the pseudo-assignment).
  const assignmentSubmitMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/api/assignments/${quizData.id}/submit/file`, formData),
    onSuccess: () => {
      setAssignmentSubmitted(true);
      toast.success("Assignment file submitted successfully!");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleAssignmentFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25 MB.");
      return;
    }
    setAssignmentFile(file);
    // BUG FIX: previously left over from a prior submission, so re-selecting
    // a file after submitting kept stale "Resubmit ✓" state on screen.
    setAssignmentSubmitted(false);
  }

  function handleAssignmentSubmit() {
    if (!assignmentFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("answerFile", assignmentFile);
    assignmentSubmitMutation.mutate(formData);
  }

  // Once the parent confirms the submission landed, jump to the results screen.
  useEffect(() => {
    if (quizSubmitted && quizResult) {
      setPhase("results");
    }
  }, [quizSubmitted, quizResult]);

  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount >= totalQuestions;
  const currentQuestion = quizData.questions[currentIndex];

  const goToQuestion = (idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(totalQuestions - 1, idx)));
  };

  const handleRetake = () => {
    onRetake?.();
    setCurrentIndex(0);
    setPhase("intro");
  };

  // ── Intro ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const isOverdue = quizData.dueDate
      ? new Date(quizData.dueDate).getTime() < new Date().getTime()
      : false;

    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {quizData.title}
          </h2>
          {quizData.description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {quizData.description}
            </p>
          )}
        </div>

        {/* Last attempt result — only shown on retake, so the "Start again"
            button has context instead of looking identical to a first try. */}
        {quizResult && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Your last score</span>
            <span className="font-semibold text-foreground">
              {Math.round(quizResult.percentage)}%
            </span>
          </div>
        )}

        <div className="rounded-lg bg-muted/40 border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-2">
            Instructions:
          </p>
          <ul className="space-y-1.5 text-sm text-foreground list-disc pl-5">
            <li>
              The exam consists of <strong>{totalQuestions}</strong>{" "}
              {totalQuestions === 1 ? "question" : "questions"} and{" "}
              <strong>{passingPercentage}%</strong> is required to pass.
            </li>
            <li>
              This assessment is worth <strong>{quizData.maxPoints}</strong>{" "}
              {quizData.maxPoints === 1 ? "point" : "points"}.
            </li>
            {quizData.hasAssignment && (
              <li>
                This quiz also includes a{" "}
                <strong>file upload assignment</strong> — have your solution
                ready before you start.
              </li>
            )}
            {quizData.hasCoding && (
              <li>
                This quiz includes a <strong>coding task</strong>.
              </li>
            )}
            {quizData.dueDate && (
              <li className={isOverdue ? "text-rose-600" : undefined}>
                {isOverdue ? "Was due" : "Due by"}{" "}
                <strong>
                  {new Date(quizData.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
                {isOverdue && " — this deadline has passed"}.
              </li>
            )}
          </ul>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setPhase("active")}
            className="btn-primary text-sm font-semibold px-8 py-2.5 rounded-full"
          >
            {quizResult ? "Start again" : "Start"}
          </button>
        </div>
      </div>
    );
  }
  // ── Results ──────────────────────────────────────────────────────────
  if (phase === "results" && quizResult) {
    const tier = getResultTier(quizResult.percentage, passingPercentage);
    const style = TIER_STYLES[tier];
    const resultLabel =
      tier === "pass"
        ? "Passed"
        : tier === "partial"
          ? "Almost there"
          : "Not yet passed";
    const incorrectCount = quizResult.total - quizResult.score;

    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center pt-4 pb-2 text-center">
          <ScoreGauge percentage={quizResult.percentage} tier={tier} />
          <p className="text-sm text-foreground mt-2">
            You have scored{" "}
            <strong>{Math.round(quizResult.percentage)}%</strong>.
          </p>

          <span
            className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            <span aria-hidden>{style.emoji}</span> {resultLabel}
          </span>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setPhase("active");
              }}
              className="btn-primary text-sm px-6 py-2 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Review Assessment
            </button>
            {onRetake && (
              <button
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <IconRotateClockwise size={14} />
                Retake
              </button>
            )}
          </div>
        </div>

        {/* Score breakdown: correct vs incorrect get their own color/icon so
            the summary matches the per-question markers below. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#158A5C]/30 bg-[#158A5C]/10 p-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#158A5C] text-white">
              <IconCheck size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#158A5C]">
                {quizResult.score} correct
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-[#D6293A]/30 bg-[#D6293A]/10 p-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D6293A] text-white">
              <IconX size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#D6293A]">
                {incorrectCount} incorrect
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active (one question at a time) ─────────────────────────────────
  return (
    <div className="space-y-5">
      {currentQuestion && (
        <div className="space-y-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {currentIndex + 1}. {currentQuestion.questionText}
            </p>
            <span className="shrink-0 mt-0.5 text-[10px] font-bold text-white bg-muted px-2 py-0.5 rounded">
              {currentQuestion.marks}{" "}
              {currentQuestion.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          <div className="space-y-2">
            {(() => {
              // Grade lookup for this question, done once per render instead
              // of per-option. quizResult.answers is the authoritative,
              // post-submission source — quizData's own option.isCorrect
              // flags are frequently withheld by the API before grading.
              const graded = quizSubmitted
                ? quizResult?.answers.find(
                    (a) => a.questionId === currentQuestion.id,
                  )
                : undefined;

              return currentQuestion.options.map((opt, optIdx) => {
                const isSelected =
                  selectedAnswers[currentQuestion.id] === opt.id;
                const isCorrectAnswer =
                  quizSubmitted &&
                  (opt.isCorrect || (isSelected && graded?.isCorrect === true));
                const isWrongSelection =
                  quizSubmitted && isSelected && graded?.isCorrect === false;

                const state = getOptionState(
                  isSelected,
                  quizSubmitted,
                  isCorrectAnswer,
                  isWrongSelection,
                );
                const styles = OPTION_STATE_STYLES[state];

                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={quizSubmitted}
                    onClick={() => onAnswerSelect(currentQuestion.id, opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-sm text-left transition-colors ${styles.card} ${styles.text}`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border-2"
                      style={
                        state === "default"
                          ? { borderColor: "#d1d5db", color: "#6b7086" }
                          : state === "selected"
                            ? {
                                backgroundColor: "var(--primary)",
                                color: "#fff",
                                borderColor: "var(--primary)",
                              }
                            : state === "correct"
                              ? {
                                  backgroundColor: "#158A5C",
                                  color: "#fff",
                                  borderColor: "#158A5C",
                                }
                              : {
                                  backgroundColor: "#D6293A",
                                  color: "#fff",
                                  borderColor: "#D6293A",
                                }
                      }
                    >
                      {letter}
                    </span>
                    <span className="flex-1">{opt.optionText}</span>
                    {quizSubmitted && isCorrectAnswer && (
                      <span className="text-[10px] font-semibold text-[#158A5C] shrink-0">
                        Correct answer
                      </span>
                    )}
                    {isWrongSelection && (
                      <span className="text-[10px] font-semibold text-[#D6293A] shrink-0">
                        Your answer
                      </span>
                    )}
                  </button>
                );
              });
            })()}
          </div>

          {!quizSubmitted && phase === "active" && (
            <div className="mx-auto max-w-md pt-1">
              <ProgressBar answered={answeredCount} total={totalQuestions} />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg border-2 border-foreground/25 text-foreground hover:border-foreground/50 hover:bg-foreground/5 disabled:opacity-40 transition-colors"
            >
              <IconChevronLeft size={14} /> Previous
            </button>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {answeredCount} of {totalQuestions} answered
            </p>
            {currentIndex === totalQuestions - 1 ? (
              quizSubmitted ? (
                // BUG FIX: previously a disabled "Submitted ✓" pill with no
                // way back to the score screen from the last question.
                <button
                  onClick={() => setPhase("results")}
                  className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <IconChartBar size={14} /> View Results
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (allAnswered) onSubmit();
                  }}
                  disabled={!allAnswered || quizSubmitting}
                  className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                >
                  {quizSubmitting ? "Submitting..." : "Submit"}
                </button>
              )
            ) : (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Next <IconChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Assignment PDF & File Upload (Special Exam) ──────────────── */}
      {quizData.hasAssignment && (
        <div className="space-y-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <IconFileSpreadsheet size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">
              Assignment / Practical Task
            </h3>
          </div>

          {quizData.assignmentInstructions && (
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                Instructions
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {quizData.assignmentInstructions}
              </p>
            </div>
          )}

          {quizData.assignmentPdfUrl ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">
                  Question Paper
                </span>
                <a
                  href={quizData.assignmentPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <IconFileDownload size={14} />
                  Download PDF
                </a>
              </div>
              <iframe
                src={quizData.assignmentPdfUrl}
                className="w-full h-[55vh] bg-white"
                title="Assignment Question PDF"
              />
            </div>
          ) : null}

          {/* File Upload Submission */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconUpload size={16} className="text-blue-500" />
              Submit Solution (Code / Project ZIP / Document)
            </h4>

            <input
              ref={assignmentFileRef}
              type="file"
              className="hidden"
              accept=".py,.java,.cpp,.c,.js,.ts,.html,.css,.zip,.rar,.tar.gz,.pdf,.docx,.txt"
              onChange={handleAssignmentFileSelect}
            />

            {assignmentFile ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <IconFile size={24} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {assignmentFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(assignmentFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignmentFile(null)}
                  className="text-muted-foreground hover:text-danger p-1 transition-colors"
                >
                  <IconX size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => assignmentFileRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-all hover:bg-primary/10 hover:border-primary/50"
              >
                <IconUpload size={28} className="mx-auto text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  Click to select programming file or ZIP package
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .py, .java, .cpp, .js, .ts, .zip, .pdf — max 25 MB
                </p>
              </button>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAssignmentSubmit}
                disabled={!assignmentFile || assignmentSubmitMutation.isPending}
                className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
              >
                {assignmentSubmitMutation.isPending ? (
                  "Uploading..."
                ) : assignmentSubmitted ? (
                  <>
                    <IconCheck size={16} /> Resubmit
                  </>
                ) : (
                  "Submit Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
