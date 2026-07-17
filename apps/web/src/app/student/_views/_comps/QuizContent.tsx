"use client";

import { useEffect, useState } from "react";
import { IconClipboardCheck, IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

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
  // Optional: called when the user clicks "Reset" on the results screen.
  // The quiz data model here is single-attempt (selectedAnswers/quizSubmitted are
  // controlled by the parent), so actually clearing answers for a retake needs to
  // happen upstream — wire this up if/when retakes are supported.
  onRetake?: () => void;
}

type Phase = "intro" | "active" | "results";

function resultEmoji(percentage: number, passingPercentage: number) {
  if (percentage >= passingPercentage) return "🎉";
  if (percentage >= passingPercentage / 2) return "💪";
  return "📚";
}

function ScoreGauge({ percentage }: { percentage: number }) {
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
        className="text-emerald-500"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
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
            Start
          </button>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────
  if (phase === "results" && quizResult) {
    const passed = quizResult.percentage >= passingPercentage;

    return (
      <div className="space-y-5">
        {renderNavigator()}

        <div className="flex flex-col items-center pt-4 pb-2 text-center">
          <ScoreGauge percentage={quizResult.percentage} />
          <p className="text-sm text-foreground mt-2">
            You have scored <strong>{Math.round(quizResult.percentage)}%</strong>.
          </p>
          <p className={`text-sm mt-1 ${passed ? "text-emerald-600" : "text-danger"}`}>
            {passed
              ? "Congratulations, you have passed the exam."
              : "You did not reach the passing score this time."}
          </p>

          <div className="flex items-center gap-4 mt-4">
            {onRetake && (
              <button
                onClick={onRetake}
                className="btn-primary text-sm px-6 py-2 rounded-full"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => {
                setCurrentIndex(0);
                setPhase("active");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Review Assessment
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-2">
          <span className="text-lg">
            {resultEmoji(quizResult.percentage, passingPercentage)}
          </span>
          <p className="text-sm font-semibold text-foreground">
            {quizResult.score}/{quizResult.total} correct
          </p>
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
          return (
            <button
              key={q.id}
              onClick={() => {
                setPhase("active");
                goToQuestion(i);
              }}
              className={`shrink-0 h-7 min-w-7 px-2 rounded-md border text-[11px] font-medium transition-colors ${isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : isAnswered
                  ? "border-emerald-500/60 text-emerald-600"
                  : "border-border text-muted-foreground"
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
            <span className="inline-block mt-1 text-[10px] font-bold text-muted bg-muted px-2 py-0.5 rounded">
              {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          <div className="space-y-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
              const isCorrectAnswer = opt.isCorrect;
              let cardClass = "border-border/60";
              if (quizSubmitted) {
                if (isCorrectAnswer) cardClass = "border-emerald-500/60 bg-emerald-500/10";
                else if (isSelected) cardClass = "border-danger/60 bg-danger/10";
              } else if (isSelected) {
                cardClass = "border-primary/60 bg-primary/10";
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={quizSubmitted}
                  onClick={() => onAnswerSelect(currentQuestion.id, opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-colors ${cardClass} ${quizSubmitted && isCorrectAnswer
                    ? "text-emerald-700 dark:text-emerald-300"
                    : quizSubmitted && isSelected
                      ? "text-danger"
                      : "text-foreground"
                    }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${quizSubmitted && isCorrectAnswer
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : quizSubmitted && isSelected
                        ? "bg-danger border-danger text-white"
                        : isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border text-transparent"
                      }`}
                  >
                    <IconCheck size={13} />
                  </span>
                  <span className="flex-1">{opt.optionText}</span>
                </button>
              );
            })}
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