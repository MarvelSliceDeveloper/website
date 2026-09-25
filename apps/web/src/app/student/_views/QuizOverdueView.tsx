"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  IconRefresh,
  IconX,
  IconPlayerPlay,
  IconChecklist,
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
    id: string;
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
  const queryClient = useQueryClient();
  const [subView, setSubView] = useState<SubView>({ type: "LIST" });
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [listFilter, setListFilter] = useState<"all" | "pending" | "completed">(
    "all",
  );
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCloseModal = useCallback(() => {
    setSubView({ type: "LIST" });
    setCurrentQuestionIdx(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
      if (e.key === "Tab" && modalRef.current && subView.type !== "LIST") {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleCloseModal, subView.type],
  );

  useEffect(() => {
    if (subView.type === "LIST") return;
    document.addEventListener("keydown", handleKeyDown);
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [subView.type, handleKeyDown]);

  const overdueItems = quizzes.filter((q) => q.status === "PENDING");
  const completedItems = quizzes.filter((q) => q.status === "SUBMITTED");

  // MCQ submission mutation — refreshes the parent's overdue list after
  // success so the quiz moves to Completed via real server data.
  const submitMutation = useMutation({
    mutationFn: ({
      assignmentId,
      answers,
    }: {
      assignmentId: string;
      answers: Array<{ questionId: string; selectedOptionId: string }>;
    }) =>
      api.post<{
        attemptId: string;
        score: number;
        total: number;
        percentage: number;
        answers: Array<{
          questionId: string;
          selectedOptionId: string;
          isCorrect: boolean;
        }>;
      }>(`/api/courses/quizzes/${assignmentId}/submit`, { answers }),
    onSuccess: (res) => {
      if (subView.type !== "QUIZ") return;
      const { data } = subView;
      const result: SubmissionResult = {
        id: res.attemptId,
        status: "GRADED",
        totalScore: res.score,
        grade: null,
        feedback: null,
        assignment: {
          id: data.id,
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
      setSubView({ type: "RESULT", data: result });
      void queryClient.invalidateQueries({ queryKey: ["student", "overdue"] });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  async function handleStartQuiz(quizId: string) {
    try {
      setLoading(true);
      const data = await api.get<AssignmentQuestions>(
        `/api/courses/quizzes/${quizId}/questions`,
      );
      setSelectedAnswers({});
      setCurrentQuestionIdx(0);
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
          id: questionsRes.id,
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

  function handleSubmitMcq() {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between ">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quizzes</h1>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-center min-w-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Pending
            </p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {overdueItems.length}
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center min-w-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              Completed
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {completedItems.length}
            </p>
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
        <>
          <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground w-10">
                      #
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Quiz Name
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Course & Module
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Due Date
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Submitted
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-foreground text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredItems.map((quiz, idx) => {
                    const isPending = quiz.status === "PENDING";
                    const passed =
                      quiz.isPassed ??
                      (quiz.percentage == null ? true : quiz.percentage >= 60);
                    const dueDateTime = quiz.dueDate
                      ? new Date(quiz.dueDate).getTime()
                      : NaN;
                    const daysOverdue =
                      isPending && !isNaN(dueDateTime)
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
                        <td className="px-5 py-4 text-xs text-muted-foreground text-center">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                isPending
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                  : passed
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                    : "bg-danger/10 border-danger/30 text-danger"
                              }`}
                            >
                              {isPending ? (
                                <IconAlertCircle size={16} />
                              ) : passed ? (
                                <IconCheck size={16} />
                              ) : (
                                <IconX size={16} />
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
                          <p className="text-xs font-medium text-foreground">
                            {quiz.courseName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {quiz.moduleName}
                          </p>
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
                                    : "text-muted-foreground"
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                isOverdue
                                  ? "text-danger font-semibold"
                                  : isPending
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
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
                                : quiz.dueDate
                                  ? new Date(quiz.dueDate).toLocaleDateString(
                                      "en-IN",
                                      { day: "numeric", month: "short" },
                                    )
                                  : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {isPending ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-500">
                              {quiz.submittedAt
                                ? new Date(quiz.submittedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                              Pending
                            </span>
                          ) : passed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                              <IconCheck size={12} />
                              {quiz.percentage != null
                                ? `Passed · ${quiz.percentage}%`
                                : "Passed"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-danger/15 text-danger border border-danger/25">
                              <IconX size={12} />
                              {quiz.percentage != null
                                ? `Failed · ${quiz.percentage}%`
                                : "Failed"}
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
                              <>
                                {!passed && (
                                  <button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    disabled={loading}
                                    className="btn-primary text-xs px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xs hover:shadow-sm transition-all"
                                  >
                                    Retake Quiz
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewResult(quiz.id)}
                                  disabled={loading}
                                  className="btn-secondary text-xs px-4 py-2 rounded-xl font-medium border border-border hover:border-violet-500/40 hover:text-violet-500 transition-all"
                                >
                                  View Results
                                </button>
                              </>
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

          <div className="md:hidden space-y-3">
            {filteredItems.map((quiz) => {
              const isPending = quiz.status === "PENDING";
              const passed =
                quiz.isPassed ??
                (quiz.percentage == null ? true : quiz.percentage >= 60);
              const daysOverdue = isPending
                ? Math.floor(
                    (new Date().getTime() - new Date(quiz.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 0;
              const isOverdue = daysOverdue > 0;
              return (
                <div
                  key={quiz.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                          isPending
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                            : passed
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-danger/30 bg-danger/10 text-danger"
                        }`}
                      >
                        {isPending ? (
                          <IconAlertCircle size={16} />
                        ) : passed ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconX size={16} />
                        )}
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {quiz.assignmentName}
                      </p>
                    </div>
                    {isPending ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                        Pending
                      </span>
                    ) : passed ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <IconCheck size={11} /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                        <IconX size={11} /> Failed
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Course
                      </p>
                      <p className="truncate text-foreground">
                        {quiz.courseName}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Module
                      </p>
                      <p className="truncate text-foreground">
                        {quiz.moduleName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Due
                      </p>
                      <p
                        className={
                          isOverdue
                            ? "font-semibold text-danger"
                            : isPending
                              ? "text-amber-400"
                              : "text-muted-foreground"
                        }
                      >
                        {isPending
                          ? isOverdue
                            ? `${daysOverdue}d overdue`
                            : quiz.dueDate
                              ? new Date(quiz.dueDate).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short" },
                                )
                              : "—"
                          : quiz.dueDate
                            ? new Date(quiz.dueDate).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Submitted
                      </p>
                      <p className="text-foreground">
                        {isPending
                          ? "—"
                          : quiz.submittedAt
                            ? new Date(quiz.submittedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    {isPending ? (
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        disabled={loading}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        <IconPlayerPlay size={13} className="mr-1 inline" />
                        Start Quiz
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          disabled={loading}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          <IconPlayerPlay size={13} className="mr-1 inline" />
                          Retake Quiz
                        </button>
                        <button
                          onClick={() => handleViewResult(quiz.id)}
                          disabled={loading}
                          className="btn-secondary px-3 py-1.5 text-xs"
                          title="View Results"
                        >
                          <IconChecklist size={13} className="mr-1 inline" />
                          Results
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
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

      {/* ── QUIZ TAKING MODAL POPUP ── */}
      {subView.type === "QUIZ" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={subView.data.title}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            ref={modalRef}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-card px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
                  MCQ Assessment
                </p>
                <h2 className="text-lg font-bold text-foreground truncate max-w-lg">
                  {subView.data.title}
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                {subView.data.dueDate && (
                  <span className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-muted/30 border border-border/60 text-muted-foreground">
                    <IconClock size={12} />
                    {new Date(subView.data.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold">
                  <IconAward size={12} /> {subView.data.maxPoints} pts
                </span>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground cursor-pointer"
                  aria-label="Close quiz"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            {/* Progress Bar & Navigator */}
            <div className="border-b border-border/50 bg-muted/20 px-6 py-3 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>
                  Question {currentQuestionIdx + 1} of{" "}
                  {subView.data.questions.length}
                </span>
                <span
                  className={
                    Object.keys(selectedAnswers).length ===
                    subView.data.questions.length
                      ? "text-emerald-500 font-semibold"
                      : ""
                  }
                >
                  {Object.keys(selectedAnswers).length}/
                  {subView.data.questions.length} answered
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-primary to-emerald-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      subView.data.questions.length > 0
                        ? (Object.keys(selectedAnswers).length /
                            subView.data.questions.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              {/* Question Dots */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {subView.data.questions.map((q, i) => {
                  const answered = !!selectedAnswers[q.id];
                  const isCurrent = i === currentQuestionIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(i)}
                      className={`h-7 min-w-7 px-2 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                        isCurrent
                          ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-xs scale-105"
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
            </div>

            {/* Question Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {subView.data.questions[currentQuestionIdx] && (() => {
                const currentQ = subView.data.questions[currentQuestionIdx];
                return (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 text-sm font-bold border border-violet-500/20">
                          {currentQuestionIdx + 1}
                        </span>
                        <p className="text-[15px] font-semibold text-foreground leading-relaxed pt-0.5">
                          {currentQ.questionText}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md shrink-0 whitespace-nowrap">
                        {currentQ.marks}{" "}
                        {currentQ.marks === 1 ? "mark" : "marks"}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {currentQ.options.map((opt, optIdx) => {
                        const isSelected =
                          selectedAnswers[currentQ.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [currentQ.id]: opt.id,
                              }))
                            }
                            className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                              isSelected
                                ? "border-violet-500 bg-violet-500/10 text-foreground font-semibold shadow-xs ring-1 ring-violet-500/30"
                                : "border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:bg-card-hover hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-xs"
                                  : "bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">
                              {opt.optionText}
                            </span>
                            {isSelected && (
                              <IconCheck
                                size={16}
                                className="shrink-0 text-violet-600 dark:text-violet-400"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-card px-6 py-3.5">
              <button
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-card-hover disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <IconArrowLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIdx < subView.data.questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestionIdx((p) =>
                        Math.min(subView.data.questions.length - 1, p + 1),
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-all cursor-pointer shadow-xs"
                  >
                    Next <IconArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitMcq}
                    disabled={submitMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <IconSend size={14} />
                    {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ RESULT MODAL POPUP ── */}
      {subView.type === "RESULT" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Quiz Results"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            ref={modalRef}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Result Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-card px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
                  Assessment Results
                </p>
                <h2 className="text-lg font-bold text-foreground truncate max-w-lg">
                  {subView.data.assignment.title}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground cursor-pointer"
                aria-label="Close result"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Result Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Score & Metrics Banner */}
              {(() => {
                const totalPoints = subView.data.assignment.maxPoints || 100;
                const score = subView.data.totalScore ?? 0;
                const pct = Math.round((score / totalPoints) * 100);
                const isPassed = pct >= 60;
                const isAverage = pct >= 40 && pct < 60;
                const correctCount = subView.data.questionResponses.filter(
                  (r) => r.isCorrect,
                ).length;
                const totalQuestions = subView.data.assignment.questions.length;

                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/80 bg-muted/15 p-6 text-center space-y-4">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md mx-auto">
                        <IconAward size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {isPassed
                            ? "Assessment Passed! 🎉"
                            : "Keep Practicing! 💪"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          You scored{" "}
                          <strong className="text-foreground">{score}</strong>{" "}
                          out of{" "}
                          <strong className="text-foreground">
                            {totalPoints} points
                          </strong>
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-0.5 text-xs font-bold rounded-full ${
                            isPassed
                              ? "bg-emerald-500/15 text-emerald-500"
                              : isAverage
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-danger/15 text-danger"
                          }`}
                        >
                          {pct}% Accuracy
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center gap-2">
                          <IconCircleCheck
                            size={18}
                            className="text-emerald-500"
                          />
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

                      {subView.data.feedback && (
                        <div className="mx-auto max-w-md rounded-xl border border-violet-500/25 bg-violet-500/10 p-3.5 text-xs text-foreground text-left flex items-start gap-2">
                          <span className="text-base">💡</span>
                          <div>
                            <strong className="font-semibold text-violet-600 dark:text-violet-400">
                              Feedback:
                            </strong>{" "}
                            {subView.data.feedback}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question Breakdown List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Question Breakdown ({totalQuestions} questions)
                      </h4>

                      {subView.data.assignment.questions.map((q, idx) => {
                        const response =
                          subView.data.questionResponses.find(
                            (r) => r.questionId === q.id,
                          );
                        const isCorrect = !!response?.isCorrect;

                        return (
                          <div
                            key={q.id}
                            className={`rounded-2xl p-5 border bg-card transition-all space-y-3 shadow-xs ${
                              isCorrect
                                ? "border-emerald-500/30"
                                : "border-danger/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground leading-snug">
                                <span className="text-violet-500 font-bold mr-2">
                                  Q{idx + 1}.
                                </span>
                                {q.questionText}
                              </p>
                              {isCorrect ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-lg shrink-0">
                                  <IconCircleCheck size={14} /> Correct (+
                                  {q.marks})
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/15 px-2.5 py-1 rounded-lg shrink-0">
                                  <IconCircleX size={14} /> Incorrect (0/
                                  {q.marks})
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 pt-1">
                              {q.options.map((o, optIdx) => {
                                const isSelected =
                                  o.id === response?.selectedOptionId;
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
                                    <span className="flex-1">
                                      {o.optionText}
                                    </span>
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
                  </div>
                );
              })()}
            </div>

            {/* Result Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border/80 bg-card px-6 py-3.5">
              {(() => {
                const totalPoints = subView.data.assignment.maxPoints || 100;
                const score = subView.data.totalScore ?? 0;
                const pct = Math.round((score / totalPoints) * 100);
                const isPassed = pct >= 60;
                return (
                  <>
                    {!isPassed && (
                      <button
                        onClick={() =>
                          handleStartQuiz(subView.data.assignment.id)
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-all cursor-pointer shadow-xs"
                      >
                        <IconRefresh size={14} /> Retake Quiz
                      </button>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-card-hover transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
