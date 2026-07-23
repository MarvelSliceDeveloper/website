"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconArrowLeft,
  IconArrowRight,
  IconSend,
  IconAward,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import type { OverdueAssignment } from "@/lib/api-types";
import type { ViewState } from "../_types/student-portal";

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
  navigate?: (v: ViewState) => void;
}

type SubView =
  | { type: "LIST" }
  | { type: "QUIZ"; assignmentId: string; data: AssignmentQuestions }
  | { type: "RESULT"; data: SubmissionResult };

export default function QuizOverdueView({
  quizzes,
  navigate: _navigate,
}: QuizOverdueViewProps) {
  const [subView, setSubView] = useState<SubView>({ type: "LIST" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [listFilter, setListFilter] = useState<"all" | "pending" | "completed">(
    "all",
  );

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

  async function handleStartQuiz(quizId: string) {
    try {
      setLoading(true);
      const data = await api.get<AssignmentQuestions>(
        `/api/courses/quizzes/${quizId}/questions`,
      );
      setSelectedAnswers({});
      setSubView({ type: "QUIZ", assignmentId: quizId, data });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleViewResult(quizId: string) {
    try {
      setLoading(true);
      const attemptRes = await api.get<{
        attemptId: string;
        score: number;
        total: number;
        percentage: number;
        answers: Array<{
          questionId: string;
          selectedOptionId: string;
          isCorrect: boolean;
        }>;
      }>(`/api/courses/quizzes/${quizId}/attempt`);

      const questionsRes = await api.get<AssignmentQuestions>(
        `/api/courses/quizzes/${quizId}/questions`,
      );

      const result: SubmissionResult = {
        id: attemptRes.attemptId,
        status: "GRADED",
        totalScore: attemptRes.score,
        grade: null,
        feedback: null,
        assignment: {
          title: questionsRes.title,
          maxPoints: questionsRes.maxPoints,
          questions: questionsRes.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            marks: q.marks,
            options: q.options.map((o) => ({
              id: o.id,
              optionText: o.optionText,
              isCorrect: false,
            })),
          })),
        },
        questionResponses: attemptRes.answers,
      };
      setSubView({ type: "RESULT", data: result });
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

      const res = await api.post<{
        attemptId: string;
        score: number;
        total: number;
        percentage: number;
        answers: Array<{
          questionId: string;
          selectedOptionId: string;
          isCorrect: boolean;
        }>;
      }>(`/api/courses/quizzes/${assignmentId}/submit`, { answers });

      const result: SubmissionResult = {
        id: res.attemptId,
        status: "GRADED",
        totalScore: res.score,
        grade: null,
        feedback: null,
        assignment: {
          title: data.title,
          maxPoints: data.maxPoints,
          questions: data.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            marks: q.marks,
            options: q.options.map((o) => ({
              id: o.id,
              optionText: o.optionText,
              isCorrect: false,
            })),
          })),
        },
        questionResponses: res.answers,
      };
      setLocallySubmittedIds((prev) => [...prev, assignmentId]);
      setSubView({ type: "RESULT", data: result });
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
    const currentQ = data.questions[currentQuestionIdx] ?? data.questions[0];
    const currentIdx = currentQuestionIdx;
    const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

    return (
      <div className="sp-view-enter space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <button
            onClick={() => { setSubView({ type: "LIST" }); setCurrentQuestionIdx(0); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3 transition-colors"
          >
            <IconArrowLeft size={14} /> Back to Quizzes
          </button>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">MCQ Assessment</p>
              <h1 className="text-xl font-bold text-foreground mt-0.5">{data.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {data.dueDate && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/60">
                  <IconClock size={12} /> {new Date(data.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/60">
                <IconAward size={12} /> {data.maxPoints} pts
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Question {currentIdx + 1} of {totalCount}</span>
            <span className={answeredCount === totalCount ? "text-emerald-500" : ""}>{answeredCount}/{totalCount} answered</span>
          </div>
          <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-primary to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question Navigator Dots */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {data.questions.map((q, i) => {
            const answered = !!selectedAnswers[q.id];
            const isCurrent = i === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(i)}
                className={`h-8 min-w-8 px-2 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                  isCurrent
                    ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-sm shadow-violet-500/10 scale-105"
                    : answered
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border/60 text-muted-foreground hover:border-border-hover hover:bg-card-hover"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Current Question Card */}
        {currentQ && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 text-sm font-bold border border-violet-500/20">
                  {currentIdx + 1}
                </span>
                <p className="text-[15px] font-semibold text-foreground leading-relaxed pt-0.5">
                  {currentQ.questionText}
                </p>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md shrink-0 whitespace-nowrap">
                {currentQ.marks} {currentQ.marks === 1 ? "mark" : "marks"}
              </span>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))
                    }
                    className={`group w-full flex items-center gap-3.5 p-4 rounded-xl border text-left text-sm transition-all duration-200 ${
                      isSelected
                        ? "border-violet-500/50 bg-gradient-to-r from-violet-500/10 to-primary/5 text-foreground font-semibold shadow-sm shadow-violet-500/5 -translate-y-0.5"
                        : "border-border/60 text-muted-foreground hover:border-violet-500/30 hover:bg-violet-500/5 hover:-translate-y-0.5"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? "border-violet-500 bg-violet-500 text-white scale-110"
                          : "border-border group-hover:border-violet-500/40 text-muted group-hover:text-violet-500"
                      }`}
                    >
                      {isSelected ? <IconCheck size={14} /> : String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="leading-snug flex-1">{opt.optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation + Submit Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentQuestionIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border-hover disabled:opacity-30 transition-all"
          >
            <IconArrowLeft size={14} /> Previous
          </button>

          {currentIdx < totalCount - 1 ? (
            <button
              onClick={() => setCurrentQuestionIdx(currentIdx + 1)}
              className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 hover:bg-violet-500/25 transition-all"
            >
              Next <IconArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmitMcq}
              disabled={submitting || answeredCount < totalCount}
              className="flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 transition-all duration-200"
            >
              {submitting ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Submitting...</>
              ) : (
                <><IconSend size={16} /> Submit Quiz</>
              )}
            </button>
          )}
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

    const isPassed = pct >= 70;
    const isAverage = pct >= 50 && pct < 70;

    return (
      <div className="sp-view-enter space-y-6 max-w-3xl mx-auto">
        {/* Scorecard Container */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg text-center space-y-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Badge & Trophy Icon */}
          <div className="relative flex justify-center">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-xl transition-transform duration-300 hover:scale-105 ${
                isPassed
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 shadow-emerald-500/20"
                  : isAverage
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-400 shadow-amber-500/20"
                    : "border-danger/60 bg-danger/15 text-danger shadow-danger/20"
              }`}
            >
              <IconAward size={44} />
            </div>
          </div>

          <div className="relative space-y-1">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {data.assignment.title}
            </h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {isPassed ? "🎉 Assessment Passed!" : isAverage ? "⚡ Keep Practicing!" : "📚 Needs Revision"}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="relative inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/60 min-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Final Score</span>
            <div className="text-4xl sm:text-5xl font-black text-foreground mt-1">
              {data.totalScore ?? 0}
              <span className="text-xl font-normal text-muted-foreground"> / {data.assignment.maxPoints}</span>
            </div>
            <span className={`inline-block mt-2 px-3 py-0.5 text-xs font-bold rounded-full ${
              isPassed ? "bg-emerald-500/15 text-emerald-500" : isAverage ? "bg-amber-500/15 text-amber-500" : "bg-danger/15 text-danger"
            }`}>
              {pct}% Accuracy
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center gap-2">
              <IconCircleCheck size={18} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {correctCount} Correct
              </span>
            </div>
            <div className="p-3 rounded-xl border border-danger/30 bg-danger/10 flex items-center justify-center gap-2">
              <IconCircleX size={18} className="text-danger" />
              <span className="text-xs font-bold text-danger">
                {totalQuestions - correctCount} Incorrect
              </span>
            </div>
          </div>

          {data.feedback && (
            <div className="mx-auto max-w-md rounded-xl border border-violet-500/25 bg-violet-500/10 p-3.5 text-xs text-foreground text-left flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <strong className="font-semibold text-violet-600 dark:text-violet-400">Feedback:</strong> {data.feedback}
              </div>
            </div>
          )}
        </div>

        {/* Question Breakdown List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Question Breakdown ({totalQuestions} questions)
            </h3>
          </div>

          {data.assignment.questions.map((q, idx) => {
            const response = data.questionResponses.find(
              (r) => r.questionId === q.id,
            );
            const isCorrect = !!response?.isCorrect;

            return (
              <div
                key={q.id}
                className={`rounded-2xl p-5 border bg-card transition-all space-y-3 shadow-sm ${
                  isCorrect ? "border-emerald-500/30 shadow-emerald-500/5" : "border-danger/30 shadow-danger/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    <span className="text-violet-500 font-bold mr-2">Q{idx + 1}.</span>
                    {q.questionText}
                  </p>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-lg shrink-0">
                      <IconCircleCheck size={14} /> Correct (+{q.marks})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/15 px-2.5 py-1 rounded-lg shrink-0">
                      <IconCircleX size={14} /> Incorrect (0/{q.marks})
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {q.options.map((o, optIdx) => {
                    const isSelected = o.id === response?.selectedOptionId;
                    const isCorrectOption = o.isCorrect;

                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-3 p-3 rounded-xl text-xs transition-colors border ${
                          isCorrectOption
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                            : isSelected
                              ? "bg-danger/10 border-danger/40 text-danger font-semibold"
                              : "border-border/40 text-muted-foreground bg-background/50"
                        }`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border border-current">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{o.optionText}</span>
                        {isCorrectOption && (
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            Correct Answer ✓
                          </span>
                        )}
                        {isSelected && !isCorrectOption && (
                          <span className="text-[10px] font-bold text-danger uppercase tracking-wider">
                            Your Choice ✗
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => { setSubView({ type: "LIST" }); setCurrentQuestionIdx(0); }}
            className="flex items-center gap-2 btn-secondary text-xs px-6 py-2.5 rounded-xl"
          >
            <IconArrowLeft size={14} /> Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const allItems = [...overdueItems, ...completedItems];

  const filteredItems =
    listFilter === "all"
      ? allItems
      : listFilter === "pending"
        ? overdueItems
        : completedItems;

  // ── LIST VIEW (DEFAULT) ──
  return (
    <div className="sp-view-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Assessments</p>
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Test your understanding and complete course assessments.
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-center min-w-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{overdueItems.length}</p>
          </div>
          <div className="px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center min-w-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Completed</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedItems.length}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-sm text-muted animate-pulse">
          Loading quiz details...
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card p-1.5 w-fit shadow-xs">
        {(["all", "pending", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setListFilter(tab)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              listFilter === tab
                ? "bg-violet-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {tab === "all" && `All (${allItems.length})`}
            {tab === "pending" && `Pending (${overdueItems.length})`}
            {tab === "completed" && `Completed (${completedItems.length})`}
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quiz Name
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Course & Module
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((quiz) => {
                  const isPending = quiz.status === "PENDING";
                  const dueDateTime = quiz.dueDate ? new Date(quiz.dueDate).getTime() : NaN;
                  const daysOverdue = isPending && !isNaN(dueDateTime)
                    ? Math.floor(
                        (new Date().getTime() - dueDateTime) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 0;
                  const isOverdue = daysOverdue > 0;

                  return (
                    <tr
                      key={quiz.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                              isPending
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                            }`}
                          >
                            {isPending ? (
                              <IconAlertCircle size={16} />
                            ) : (
                              <IconCheck size={16} />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground truncate max-w-[240px]">
                              {quiz.assignmentName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-foreground">{quiz.courseName}</p>
                        <p className="text-[11px] text-muted-foreground">{quiz.moduleName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <IconClock
                            size={14}
                            className={
                              isOverdue
                                ? "text-danger"
                                : isPending
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            }
                          />
                          <span
                            className={`text-xs font-medium ${
                              isOverdue
                                ? "text-danger font-semibold"
                                : isPending
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            }`}
                          >
                            {isPending
                              ? isOverdue
                                ? `${daysOverdue}d overdue`
                                : quiz.dueDate
                                  ? new Date(quiz.dueDate).toLocaleDateString(
                                      "en-IN",
                                      { day: "numeric", month: "short" },
                                    )
                                  : "No due date"
                              : "Completed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                            <IconCheck size={12} /> Completed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <button
                              onClick={() => handleStartQuiz(quiz.id)}
                              disabled={loading}
                              className="btn-primary text-xs px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xs hover:shadow-sm transition-all"
                            >
                              Start Quiz
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewResult(quiz.id)}
                              disabled={loading}
                              className="btn-secondary text-xs px-4 py-2 rounded-xl font-medium border border-border hover:border-violet-500/40 hover:text-violet-500 transition-all"
                            >
                              View Results
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🎯</span>
          <p className="font-bold text-base text-foreground">
            {listFilter === "all"
              ? "All quizzes completed"
              : listFilter === "pending"
                ? "No pending quizzes"
                : "No completed quizzes yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {listFilter === "all"
              ? "Great work! You are all caught up with your assessments."
              : listFilter === "pending"
                ? "You've finished all required quizzes for your enrolled courses."
                : "Complete a quiz to review your results here."}
          </p>
        </div>
      )}
    </div>
  );
}
