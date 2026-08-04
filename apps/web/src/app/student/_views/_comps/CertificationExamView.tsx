"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconAward,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface CertQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  options: { id: string; optionText: string }[];
}

interface CertQuiz {
  id: string;
  title: string;
  passingScore: number;
  timeLimitMin: number | null;
  hasMcq: boolean;
  hasAssignment: boolean;
  assignmentInstructions: string | null;
  questionCount: number;
  questions: CertQuestion[];
}

interface CertAttempt {
  id: string;
  score: number;
  total: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
}

interface CertData {
  module: { id: string; title: string } | null;
  quiz: CertQuiz | null;
  attempt: CertAttempt | null;
}

interface CertificationExamViewProps {
  courseId: string;
  onBack: () => void;
}

type Phase = "loading" | "intro" | "active" | "results" | "error";

export default function CertificationExamView({
  courseId,
  onBack,
}: CertificationExamViewProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<CertData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CertAttempt | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<CertData>(
        `/api/courses/${courseId}/certification`,
      );
      setData(res);

      if (!res.module || !res.quiz) {
        setPhase("error");
        return;
      }

      if (res.attempt) {
        setResult(res.attempt);
        setPhase("results");
      } else {
        setPhase("intro");
      }
    } catch {
      setPhase("error");
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (phase !== "active" || !data?.quiz?.timeLimitMin) return;

    const totalSeconds = data.quiz.timeLimitMin * 60;
    setTimeLeft(totalSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, data?.quiz?.timeLimitMin]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (submitting || !data?.quiz) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const unanswered = data.quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all ${unanswered.length} remaining question(s)`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const submissionAnswers = data.quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id],
      }));

      const res = await api.post<{
        attemptId: string;
        score: number;
        total: number;
        percentage: number;
        isPassed: boolean;
        passingScore: number;
      }>(`/api/courses/quizzes/${data.quiz.id}/submit`, {
        answers: submissionAnswers,
      });

      const attemptResult: CertAttempt = {
        id: res.attemptId,
        score: res.score,
        total: res.total,
        percentage: res.percentage,
        isPassed: res.isPassed,
        submittedAt: new Date().toISOString(),
      };
      setResult(attemptResult);
      setPhase("results");

      if (res.isPassed) {
        toast.success("Congratulations! You passed the certification exam!");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const startExam = () => {
    setPhase("active");
  };

  const retakeExam = () => {
    setAnswers({});
    setResult(null);
    setPhase("intro");
    fetchData();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (phase === "error" || !data?.module || !data?.quiz) {
    return (
      <div className="glass-card p-8 text-center">
        <IconAlertTriangle className="h-12 w-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Certification Exam Unavailable
        </h3>
        <p className="text-sm text-muted mb-4">
          No certification exam has been configured for this course yet.
        </p>
        <button onClick={onBack} className="btn-secondary inline-flex items-center gap-2">
          <IconArrowLeft className="h-4 w-4" />
          Back to Course
        </button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Course
        </button>

        <div className="glass-card p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mx-auto mb-6">
            <IconAward className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {data.quiz.title}
          </h2>
          <p className="text-sm text-muted mb-8">
            Complete all MCQ questions to earn your certificate. You need{" "}
            <span className="font-semibold text-foreground">
              {data.quiz.passingScore}%
            </span>{" "}
            or higher to pass.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-2xl font-bold text-foreground">
                {data.quiz.questionCount}
              </p>
              <p className="text-xs text-muted">Questions</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-2xl font-bold text-foreground">
                {data.quiz.passingScore}%
              </p>
              <p className="text-xs text-muted">To Pass</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-2xl font-bold text-foreground">
                {data.quiz.timeLimitMin
                  ? `${data.quiz.timeLimitMin}m`
                  : "None"}
              </p>
              <p className="text-xs text-muted">Time Limit</p>
            </div>
          </div>

          <button
            onClick={startExam}
            className="btn-primary px-8 py-3 text-base font-semibold"
          >
            Start Certification Exam
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results" && result) {
    const passed = result.isPassed;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Course
        </button>

        <div className="glass-card p-8 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-6 ${
              passed ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            {passed ? (
              <IconCheck className="h-8 w-8 text-green-500" />
            ) : (
              <IconX className="h-8 w-8 text-red-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {passed ? "Congratulations!" : "Not Quite There"}
          </h2>
          <p className="text-sm text-muted mb-6">
            {passed
              ? "You have passed the certification exam!"
              : "You did not meet the passing score. You can retake the exam."}
          </p>

          <div className="inline-flex items-center gap-8 rounded-xl bg-muted/30 px-8 py-6 mb-8">
            <div className="text-center">
              <p
                className={`text-4xl font-bold ${
                  passed ? "text-green-500" : "text-red-500"
                }`}
              >
                {result.percentage}%
              </p>
              <p className="text-xs text-muted mt-1">Your Score</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">
                {data.quiz?.passingScore}%
              </p>
              <p className="text-xs text-muted mt-1">Required</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {!passed && (
              <button
                onClick={retakeExam}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <IconAward className="h-4 w-4" />
                Retake Exam
              </button>
            )}
            <button onClick={onBack} className="btn-primary">
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Course
        </button>

        {timeLeft !== null && (
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm font-bold ${
              timeLeft < 120
                ? "bg-red-500/10 text-red-500 animate-pulse"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <IconClock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-1">
          {data.quiz.title}
        </h2>
        <p className="text-xs text-muted mb-6">
          {data.quiz.questionCount} questions · Passing score:{" "}
          {data.quiz.passingScore}%
        </p>

        <div className="space-y-6">
          {data.quiz.questions.map((question, idx) => (
            <div key={question.id} className="rounded-lg border border-border/50 p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                <span className="text-amber-500 font-bold mr-2">
                  Q{idx + 1}.
                </span>
                {question.questionText}
              </p>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      answers[question.id] === option.id
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      checked={answers[question.id] === option.id}
                      onChange={() =>
                        handleAnswerSelect(question.id, option.id)
                      }
                      className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-foreground">
                      {option.optionText}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border/50">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 px-6"
          >
            {submitting ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconAward className="h-4 w-4" />
            )}
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
