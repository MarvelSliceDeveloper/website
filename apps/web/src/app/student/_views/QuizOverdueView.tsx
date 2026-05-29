"use client";

import { IconAlertCircle, IconCheck, IconClock, IconZoom } from "@tabler/icons-react";

interface QuizItem {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  totalQuestions: number;
  status: "PENDING" | "SUBMITTED";
}

interface QuizOverdueViewProps {
  quizzes: QuizItem[];
  onGoBack: () => void;
}

const MOCK_QUIZZES: QuizItem[] = [
  {
    id: "q1",
    title: "Unit 1: Fundamentals Quiz",
    courseTitle: "Advanced JavaScript",
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalQuestions: 15,
    status: "PENDING",
  },
  {
    id: "q2",
    title: "Module 2: Async Patterns",
    courseTitle: "Advanced JavaScript",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalQuestions: 10,
    status: "PENDING",
  },
  {
    id: "q3",
    title: "Midterm Assessment",
    courseTitle: "React Mastery",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalQuestions: 25,
    status: "SUBMITTED",
  },
];

export default function QuizOverdueView({
  quizzes = MOCK_QUIZZES,
  onGoBack,
}: QuizOverdueViewProps) {
  const pendingQuizzes = quizzes.filter((q) => q.status === "PENDING");
  const completedQuizzes = quizzes.filter((q) => q.status === "SUBMITTED");

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Assessments</p>
        <h1 className="text-2xl font-bold text-foreground">Quiz Overdue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your pending quizzes to progress in your courses.
        </p>
      </div>

      {/* Pending Quizzes Section */}
      {pendingQuizzes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconAlertCircle size={20} className="text-danger" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending ({pendingQuizzes.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingQuizzes.map((quiz) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(quiz.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={quiz.id}
                  className="glass-card flex flex-col gap-4 border-danger/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/10">
                      <IconZoom size={18} className="text-danger" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {quiz.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {quiz.courseTitle} • {quiz.totalQuestions} questions
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <IconClock size={14} className="text-danger" />
                        <span className="text-xs font-medium text-danger">
                          {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary flex-shrink-0 text-sm sm:w-auto">
                    Start Quiz →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Quizzes Section */}
      {completedQuizzes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconCheck size={20} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Completed ({completedQuizzes.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completedQuizzes.map((quiz) => (
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
                      {quiz.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {quiz.courseTitle} • {quiz.totalQuestions} questions
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingQuizzes.length === 0 && completedQuizzes.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="mt-3 font-semibold text-foreground">All quizzes completed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Great work! You&apos;re up to date with all assessments.
          </p>
        </div>
      )}
    </div>
  );
}
