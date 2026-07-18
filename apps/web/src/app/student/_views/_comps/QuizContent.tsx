"use client";

import { useEffect, useState } from "react";
import {
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconRotateClockwise,
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
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>;
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

function getResultTier(percentage: number, passingPercentage: number): ResultTier {
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
    stroke: "text-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
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
    stroke: "text-rose-500",
    text: "text-rose-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
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
  const [phase, setPhase] = useState<Phase>(quizSubmitted ? "results" : "intro");
  const [currentIndex, setCurrentIndex] = useState(0);

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
    return (
      <div className="space-y-5">
        <button
          onClick={onBack}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          ← Back to lesson
        </button>

        <h2 className="text-lg font-bold text-foreground text-center">
          {quizData.title}
        </h2>

        <div className="bg-muted/40 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <IconClipboardCheck size={14} className="text-amber-500" />
            Instructions:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>
              The exam consists of <strong>{totalQuestions}</strong>{" "}
              {totalQuestions === 1 ? "question" : "questions"} and{" "}
              <strong>{passingPercentage}%</strong> is required to pass.
            </li>
            <li>
              Max points: <strong>{quizData.maxPoints}</strong>
            </li>
            {quizData.dueDate && (
              <li>
                Due: <strong>{new Date(quizData.dueDate).toLocaleDateString("en-IN")}</strong>
              </li>
            )}
          </ul>
        </div>

        {quizData.description && (
          <p className="text-sm text-muted-foreground">{quizData.description}</p>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={() => setPhase("active")}
            className="btn-primary text-sm px-8 py-2.5 rounded-full"
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
        {renderNavigator()}

        <div className="flex flex-col items-center pt-4 pb-2 text-center">
          <ScoreGauge percentage={quizResult.percentage} tier={tier} />
          <p className="text-sm text-foreground mt-2">
            You have scored <strong>{Math.round(quizResult.percentage)}%</strong>.
          </p>

          <span
            className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {resultLabel}
          </span>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setPhase("active");
              }}
              className="btn-primary text-sm px-6 py-2 rounded-full"
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
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <IconCheck size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {quizResult.score} correct
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
              <IconX size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                {incorrectCount} incorrect
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active (one question at a time) ─────────────────────────────────
  function renderNavigator() {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {quizData.questions.map((q, i) => {
          const isAnswered = selectedAnswers[q.id] != null;
          const isCurrent = i === currentIndex && phase === "active";

          // Once submitted, each dot reflects right/wrong, not just answered.
          // Source of truth is the GRADED result (quizResult.answers), not
          // quizData's option.isCorrect — many APIs strip isCorrect from the
          // pre-submit question payload so it can't be read in devtools, and
          // only reveal it in the graded response.
          let markerClass =
            "border-border text-muted-foreground";
          if (quizSubmitted) {
            const graded = quizResult?.answers.find((a) => a.questionId === q.id);
            const wasCorrect = graded?.isCorrect ?? false;
            markerClass = wasCorrect
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600"
              : "border-rose-500/60 bg-rose-500/10 text-rose-600";
          } else if (isCurrent) {
            markerClass = "border-primary bg-primary/10 text-primary";
          } else if (isAnswered) {
            markerClass = "border-emerald-500/60 text-emerald-600";
          }

          return (
            <button
              key={q.id}
              onClick={() => {
                setPhase("active");
                goToQuestion(i);
              }}
              className={`shrink-0 h-7 min-w-7 px-2 rounded-md border text-[11px] font-medium transition-colors ${isCurrent && !quizSubmitted ? "border-primary bg-primary/10 text-primary" : markerClass
                }`}
            >
              Q{i + 1}
            </button>
          );
        })}
        <button
          onClick={() => {
            if (allAnswered) onSubmit();
          }}
          disabled={!allAnswered || quizSubmitting || quizSubmitted}
          className="shrink-0 h-7 px-3 rounded-md text-[11px] font-semibold bg-emerald-500 text-white disabled:opacity-40 transition-opacity"
        >
          {quizSubmitted ? "Result Page" : quizSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          ← Back to lesson
        </button>
      </div>

      {renderNavigator()}

      {currentQuestion && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
              Question {currentIndex + 1}
            </p>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {currentQuestion.questionText}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          <div className="space-y-2">
            {(() => {
              // Grade lookup for this question, done once per render instead
              // of per-option. quizResult.answers is the authoritative,
              // post-submission source — quizData's own option.isCorrect
              // flags are frequently withheld by the API before grading.
              const graded = quizSubmitted
                ? quizResult?.answers.find((a) => a.questionId === currentQuestion.id)
                : undefined;

              return currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
              // "This is the right option" is only trustworthy once graded:
              // either the API's option flag confirms it, or it's the option
              // the user picked and the grader marked correct.
              const isCorrectAnswer =
                quizSubmitted &&
                (opt.isCorrect || (isSelected && graded?.isCorrect === true));
              const isWrongSelection =
                quizSubmitted && isSelected && graded?.isCorrect === false;

              let cardClass = "border-border/60";
              if (quizSubmitted) {
                if (isCorrectAnswer) cardClass = "border-emerald-500/60 bg-emerald-500/10";
                else if (isWrongSelection) cardClass = "border-rose-500/60 bg-rose-500/10";
              } else if (isSelected) {
                cardClass = "border-primary/60 bg-primary/10";
              }

              // Marker: check for correct, X for a wrong pick, filled dot for
              // an in-progress selection, empty otherwise.
              let markerIconClass = "border-border text-transparent";
              let markerIcon = <IconCheck size={13} />;
              if (quizSubmitted && isCorrectAnswer) {
                markerIconClass = "bg-emerald-500 border-emerald-500 text-white";
                markerIcon = <IconCheck size={13} />;
              } else if (isWrongSelection) {
                markerIconClass = "bg-rose-500 border-rose-500 text-white";
                markerIcon = <IconX size={13} />;
              } else if (!quizSubmitted && isSelected) {
                markerIconClass = "bg-primary border-primary text-primary-foreground";
                markerIcon = <IconCheck size={13} />;
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={quizSubmitted}
                  onClick={() => onAnswerSelect(currentQuestion.id, opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-colors ${cardClass} ${quizSubmitted && isCorrectAnswer
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isWrongSelection
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-foreground"
                    }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${markerIconClass}`}
                  >
                    {markerIcon}
                  </span>
                  <span className="flex-1">{opt.optionText}</span>
                  {quizSubmitted && isCorrectAnswer && (
                    <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                      Correct answer
                    </span>
                  )}
                  {isWrongSelection && (
                    <span className="text-[10px] font-semibold text-rose-600 shrink-0">
                      Your answer
                    </span>
                  )}
                </button>
              );
              });
            })()}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <IconChevronLeft size={14} /> Previous
            </button>
            <p className="text-xs text-muted-foreground">
              {answeredCount} of {totalQuestions} answered
            </p>
            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={() => {
                  if (allAnswered) onSubmit();
                }}
                disabled={!allAnswered || quizSubmitting || quizSubmitted}
                className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
              >
                {quizSubmitted ? "Submitted ✓" : quizSubmitting ? "Submitting..." : "Submit"}
              </button>
            ) : (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Next <IconChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}