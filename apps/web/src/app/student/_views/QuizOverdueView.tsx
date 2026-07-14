"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconArrowLeft,
  IconSend,
  IconAward,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import type { OverdueAssignment } from "@/lib/api-types";

type McqOption = {
  id: string;
  optionText: string;
};

type McqQuestion = {
  id: string;
  questionText: string;
  marks: number;
  orderIndex: number;
  options: McqOption[];
};

type AssignmentQuestions = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  questions: McqQuestion[];
};

type SubmissionResult = {
  id: string;
  status: "PENDING" | "GRADED";
  totalScore: number | null;
  grade: string | null;
  feedback: string | null;
  assignment: {
    title: string;
    maxPoints: number;
    questions: Array<{
      id: string;
      questionText: string;
      marks: number;
      options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
    }>;
  };
  questionResponses: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
};

interface QuizOverdueViewProps {
  quizzes: OverdueAssignment[];
}

type SubView =
  | { type: "LIST" }
  | { type: "QUIZ"; assignmentId: string; data: AssignmentQuestions }
  | { type: "RESULT"; data: SubmissionResult };

export default function QuizOverdueView({ quizzes }: QuizOverdueViewProps) {
  const [subView, setSubView] = useState<SubView>({ type: "LIST" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<string[]>([]);

  const overdueItems = quizzes.filter(
    (q) => q.status === "PENDING" && !locallySubmittedIds.includes(q.id),
  );

  const completedItems = [
    ...quizzes.filter((q) => q.status === "SUBMITTED"),
    ...quizzes
      .filter(
        (q) => q.status === "PENDING" && locallySubmittedIds.includes(q.id),
      )
      .map((q) => ({ ...q, status: "SUBMITTED" as const })),
  ];

  async function handleStartQuiz(assignmentId: string) {
    try {
      setLoading(true);
      const data = await api.get<AssignmentQuestions>(
        `/api/assignments/${assignmentId}/questions`,
      );
      setSelectedAnswers({});
      setSubView({ type: "QUIZ", assignmentId, data });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleViewResult(submissionId: string) {
    try {
      setLoading(true);
      const resultRes = await api.get<{ result: SubmissionResult }>(
        `/api/assignments/submissions/${submissionId}/result`,
      );
      setSubView({ type: "RESULT", data: resultRes.result });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitMcq() {
    if (subView.type !== "QUIZ") return;

    const { assignmentId, data } = subView;
    const unanswered = data.questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions. ${unanswered.length} unanswered.`,
      );
      return;
    }

    const answers = Object.entries(selectedAnswers).map(
      ([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }),
    );

    try {
      setSubmitting(true);
      const res = await api.post<{ submission: { id: string } }>(
        `/api/assignments/${assignmentId}/submit/mcq`,
        { answers },
      );

      const resultRes = await api.get<{ result: SubmissionResult }>(
        `/api/assignments/submissions/${res.submission.id}/result`,
      );
      setLocallySubmittedIds((prev) => [...prev, assignmentId]);
      setSubView({ type: "RESULT", data: resultRes.result });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ── QUIZ TAKING SCREEN ──
  if (subView.type === "QUIZ") {
    const { data } = subView;
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = data.questions.length;

    return (
      <div className="sp-view-enter space-y-6 max-w-3xl mx-auto">
        <div>
          <button
            onClick={() => setSubView({ type: "LIST" })}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3 transition-colors"
          >
            <IconArrowLeft size={14} /> Back to Quizzes
          </button>
          <p className="sp-eyebrow">MCQ Assessment</p>
          <h1 className="text-2xl font-bold text-foreground">{data.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>📅 Due: {new Date(data.dueDate).toLocaleDateString()}</span>
            <span>💯 Max Points: {data.maxPoints}</span>
            <span>📝 Questions: {totalCount}</span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
              <span>Progress</span>
              <span>
                {answeredCount} / {totalCount} answered
              </span>
            </div>
            <div className="h-2 rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-300"
                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {data.questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            return (
              <div
                key={q.id}
                className={`glass-card p-5 space-y-4 border transition-all duration-200 ${
                  isAnswered ? "border-emerald-500/20" : "border-border/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    <span className="text-violet-400 mr-1.5">Q{idx + 1}.</span>
                    {q.questionText}
                  </p>
                  <span className="text-[10px] font-bold text-muted bg-card px-2 py-0.5 rounded shrink-0 ml-3">
                    {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.id,
                          }))
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all duration-150 ${
                          isSelected
                            ? "border-violet-500/50 bg-violet-500/15 text-foreground font-semibold shadow-sm"
                            : "border-border/60 text-muted-foreground hover:border-border-hover hover:bg-card-hover"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-violet-500 bg-violet-500 text-white"
                              : "border-border text-muted"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="leading-tight">{opt.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <button
            onClick={() => setSubView({ type: "LIST" })}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitMcq}
            disabled={submitting || answeredCount < totalCount}
            className="btn-primary text-sm px-6 py-2.5"
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <IconSend size={16} /> Submit Quiz
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ──
  if (subView.type === "RESULT") {
    const { data } = subView;
    const correctCount = data.questionResponses.filter(
      (r) => r.isCorrect,
    ).length;
    const totalQuestions = data.assignment.questions.length;
    const pct =
      data.assignment.maxPoints > 0
        ? Math.round(((data.totalScore ?? 0) / data.assignment.maxPoints) * 100)
        : 0;

    return (
      <div className="sp-view-enter space-y-6 max-w-3xl mx-auto">
        <div className="glass-card p-6 border border-border/80 text-center space-y-4">
          <div className="flex justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                pct >= 70
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : pct >= 40
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                    : "border-danger/50 bg-danger/15 text-danger"
              }`}
            >
              <IconAward size={36} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Score
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data.totalScore ?? 0}
              <span className="text-lg text-muted font-normal">
                {" "}
                / {data.assignment.maxPoints}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {correctCount} of {totalQuestions} correct · {pct}%
            </p>
          </div>

          {data.feedback && (
            <div className="mx-auto max-w-md rounded-xl border border-border/60 bg-card p-3 text-sm text-muted-foreground">
              💡 <strong>Feedback:</strong> {data.feedback}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Breakdown
          </h2>

          {data.assignment.questions.map((q, idx) => {
            const response = data.questionResponses.find(
              (r) => r.questionId === q.id,
            );
            return (
              <div
                key={q.id}
                className={`glass-card p-4 border space-y-3 ${
                  response?.isCorrect
                    ? "border-emerald-500/20"
                    : "border-danger/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    <span className="text-violet-400 mr-1.5">Q{idx + 1}.</span>
                    {q.questionText}
                  </p>
                  {response?.isCorrect ? (
                    <IconCircleCheck
                      size={20}
                      className="text-emerald-400 shrink-0 ml-2"
                    />
                  ) : (
                    <IconCircleX
                      size={20}
                      className="text-danger shrink-0 ml-2"
                    />
                  )}
                </div>

                <div className="space-y-1.5 pl-1">
                  {q.options.map((o) => {
                    const isSelected = o.id === response?.selectedOptionId;
                    const isCorrectOption = o.isCorrect;

                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                          isCorrectOption
                            ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                            : isSelected
                              ? "bg-danger/10 text-danger"
                              : "text-muted-foreground"
                        }`}
                      >
                        <span className="shrink-0">
                          {isCorrectOption ? "✅" : isSelected ? "❌" : "○"}
                        </span>
                        <span>{o.optionText}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] text-muted pt-2 border-t border-border/30">
                  <span>
                    Weight: {q.marks} mark{q.marks !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={
                      response?.isCorrect
                        ? "text-emerald-400 font-bold"
                        : "text-danger font-bold"
                    }
                  >
                    {response?.isCorrect ? `+${q.marks}` : "0"} marks
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4 border-t border-border/60">
          <button
            onClick={() => setSubView({ type: "LIST" })}
            className="btn-secondary text-sm px-6"
          >
            ← Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (DEFAULT) ──
  return (
    <div className="sp-view-enter space-y-6">
      <div>
        <p className="sp-eyebrow">Assessments</p>
        <h1 className="text-2xl font-bold text-foreground">Quiz Overdue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your pending quizzes to progress in your courses.
        </p>
      </div>

      {loading && (
        <div className="glass-card p-8 text-center text-sm text-muted animate-pulse">
          Loading quiz details...
        </div>
      )}

      {overdueItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconAlertCircle size={20} className="text-danger" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending ({overdueItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdueItems.map((quiz) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(quiz.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              const isOverdue = daysOverdue > 0;
              return (
                <div
                  key={quiz.id}
                  className={`glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
                    isOverdue ? "border-danger/20" : "border-amber-500/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                        isOverdue
                          ? "border-danger/30 bg-danger/10"
                          : "border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      <span className="text-lg">❓</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {quiz.assignmentName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {quiz.courseName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <IconClock
                          size={14}
                          className={
                            isOverdue ? "text-danger" : "text-amber-400"
                          }
                        />
                        <span
                          className={`text-xs font-medium ${isOverdue ? "text-danger" : "text-amber-400"}`}
                        >
                          {isOverdue
                            ? `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
                            : `Due ${new Date(quiz.dueDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    disabled={loading}
                    className="btn-primary flex-shrink-0 text-sm sm:w-auto"
                  >
                    Start Quiz →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconCheck size={20} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Completed ({completedItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completedItems.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card flex items-center justify-between border-success/20 p-4"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
                    <IconCheck size={18} className="text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {quiz.assignmentName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {quiz.courseName}
                    </p>
                  </div>
                </div>
                {quiz.submissionId ? (
                  <button
                    onClick={() => handleViewResult(quiz.submissionId!)}
                    className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                  >
                    View Score
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    ✅ Submitted
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {overdueItems.length === 0 && completedItems.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="mt-3 font-semibold text-foreground">
            All quizzes completed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Great work! You&apos;re up to date with all assessments.
          </p>
        </div>
      )}
    </div>
  );
}
