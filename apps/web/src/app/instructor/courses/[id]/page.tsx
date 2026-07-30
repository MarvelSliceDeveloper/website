"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  IconBook,
  IconChevronRight,
  IconClipboardList,
  IconPlayerPlay,
  IconFileSpreadsheet,
  IconFile,
  IconClock,
  IconListCheck,
  IconAward,
  IconTarget,
  IconVideo,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { Skeleton } from "@/components/shared/Skeleton";

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

type Recording = {
  id: string;
  title: string;
  batchName: string;
  duration: number;
  sharePointUrl: string;
  syncedAt: string;
  scheduledAt: string;
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
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string | null;
  tags: string[] | null;
  learningObjectives: string[] | null;
  thumbnailUrl: string | null;
  modules: Module[];
  _count: { batches: number };
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

export default function InstructorCourseDetailPage() {
  usePageTitle("Course");
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const data = await api.get<Course>(`/api/admin/courses/${id}`);
      setCourse(data);
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRecordings = useCallback(async () => {
    setRecordingsLoading(true);
    try {
      const data = await api.get<Recording[]>(
        `/api/instructor/courses/${id}/recordings`,
      );
      setRecordings(data);
    } catch {
      setRecordings([]);
    } finally {
      setRecordingsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
    fetchRecordings();
  }, [fetchCourse, fetchRecordings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <IconBook size={40} className="mx-auto text-muted" />
        <p className="text-lg font-semibold text-foreground">
          Course not found
        </p>
        <p className="text-sm text-muted-foreground">
          This course may have been archived or you don&apos;t have access.
        </p>
        <Link href="/instructor/courses" className="btn-primary inline-flex">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const totalQuizzes = course.modules.reduce(
    (sum, m) => sum + m.quizzes.length,
    0,
  );
  const totalAssignments = course.modules.reduce(
    (sum, m) => sum + m.assignments.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Link
          href="/instructor/courses"
          className="hover:text-foreground transition-colors"
        >
          Courses
        </Link>
        <IconChevronRight size={14} />
        <span className="text-foreground">{course.title}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {course.title}
            </h1>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[course.status]}`}
            >
              {course.status}
            </span>
          </div>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {course.description}
            </p>
          )}
          <p className="text-xs text-muted mt-1">
            {course.modules.length} module
            {course.modules.length !== 1 ? "s" : ""} · {totalLessons} lesson
            {totalLessons !== 1 ? "s" : ""} · {totalQuizzes} quiz
            {totalQuizzes !== 1 ? "zes" : ""} · {totalAssignments} assignment
            {totalAssignments !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {course.learningObjectives && course.learningObjectives.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <IconTarget size={16} className="text-primary" />
            Learning Objectives
          </h3>
          <ul className="space-y-1.5">
            {course.learningObjectives.map((obj, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Course Content
        </h2>

        {course.modules.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-3">
            <IconClipboardList
              size={36}
              className="mx-auto text-muted"
            />
            <p className="text-sm font-medium text-foreground">
              No modules yet
            </p>
            <p className="text-xs text-muted-foreground">
              This course has no content modules.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod) => {
              const itemCount =
                mod.lessons.length +
                mod.quizzes.length +
                mod.assignments.length;
              return (
                <div
                  key={mod.id}
                  className="glass-card border border-border/80 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {mod.order}. {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mod.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {mod.lessons.length > 0 && (
                    <div className="border-b border-border/30 last:border-b-0">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <IconPlayerPlay
                              size={14}
                              className="text-primary"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {lesson.title}
                            </p>
                            {lesson.durationSeconds && (
                              <p className="text-xs text-muted">
                                <IconClock
                                  size={10}
                                  className="inline mr-0.5"
                                />
                                {formatDuration(lesson.durationSeconds)}
                              </p>
                            )}
                          </div>
                          {lesson.isFreePreview && (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                              Free
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {mod.quizzes.length > 0 && (
                    <div className="border-b border-border/30 last:border-b-0">
                      {mod.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 shrink-0">
                            <IconListCheck
                              size={14}
                              className="text-amber-500"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-muted">
                              {quiz.questions.length} question
                              {quiz.questions.length !== 1 ? "s" : ""}
                              {quiz.passingScore
                                ? ` · Pass: ${quiz.passingScore}%`
                                : ""}
                              {quiz.timeLimitMin
                                ? ` · ${quiz.timeLimitMin} min`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mod.assignments.length > 0 && (
                    <div className="last:border-b-0">
                      {mod.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                            <IconFileSpreadsheet
                              size={14}
                              className="text-blue-500"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-muted">
                              {assignment.maxPoints} point
                              {assignment.maxPoints !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {recordings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Batch Recordings
            </h2>
            <div className="space-y-2">
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  className="glass-card flex items-center gap-4 p-4 border border-border/80"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <IconVideo size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {rec.title}
                    </p>
                    <p className="text-xs text-muted">
                      {rec.batchName} · {formatDuration(rec.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
