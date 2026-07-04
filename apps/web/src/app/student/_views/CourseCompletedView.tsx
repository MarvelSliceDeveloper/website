"use client";

import {
  IconTrophy,
  IconDownload,
  IconShare2,
  IconStar,
} from "@tabler/icons-react";
import type { EnrolledCourse } from "@/lib/student-mock-data";

interface CourseCompletedViewProps {
  courses: EnrolledCourse[];
}

export default function CourseCompletedView({
  courses,
}: CourseCompletedViewProps) {
  const completedCourses = courses.filter((c) => c.status === "COMPLETED");

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Achievements</p>
        <h1 className="text-2xl font-bold text-foreground">
          Courses Completed
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Celebrate your learning milestones and progress.
        </p>
      </div>

      {/* Stats Bar */}
      {completedCourses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {completedCourses.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Courses Completed
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {Math.round(
                (completedCourses.length / Math.max(1, courses.length)) * 100,
              )}
              %
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completion Rate
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {completedCourses.length * 20}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Certificates Earned
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {completedCourses.length * 5}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Skills Gained</p>
          </div>
        </div>
      )}

      {/* Completed Courses Grid */}
      {completedCourses.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconTrophy size={20} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Your Accomplishments
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {completedCourses.map((course, index) => (
              <div
                key={course.id}
                className="glass-card group relative overflow-hidden p-6 transition-all hover:shadow-lg"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background glow */}
                <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-success/10 blur-2xl" />

                <div className="relative space-y-4">
                  {/* Trophy and Title */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-2xl">🏆</p>
                      <p className="mt-2 font-semibold text-foreground">
                        {course.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course.instructor}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      {[...Array(5)].map((_, i) => (
                        <IconStar
                          key={i}
                          size={16}
                          className={i < 4 ? "fill-current" : ""}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-success">100%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div className="h-full w-full bg-linear-to-r from-success to-emerald-400" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs">
                      <IconDownload size={14} />
                      Certificate
                    </button>
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs">
                      <IconShare2 size={14} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedCourses.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">📚</span>
          <p className="mt-3 font-semibold text-foreground">
            No courses completed yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep learning and complete your first course to see it here!
          </p>
        </div>
      )}

      {/* Encouragement Banner */}
      {completedCourses.length > 0 && completedCourses.length < 5 && (
        <div className="glass-card border-success/20 bg-linear-to-br from-success/10 via-card to-card p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-semibold text-foreground">
                Keep up the momentum!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re doing great! Complete {5 - completedCourses.length}{" "}
                more course
                {5 - completedCourses.length !== 1 ? "s" : ""} to reach your
                goal.
              </p>
            </div>
          </div>
        </div>
      )}

      {completedCourses.length >= 5 && (
        <div className="glass-card border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⭐</span>
            <div>
              <h3 className="font-semibold text-foreground">
                You&apos;re a learning champion!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Excellent progress on your learning journey. Your dedication is
                inspiring.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
