"use client";

import { useState, useMemo } from "react";
import CourseThumb from "@/components/student/CourseThumb";
import { IconArrowRight, IconClock, IconSearch } from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type { EnrolledCourse } from "@/lib/api-types";

interface CoursesViewProps {
  courses: EnrolledCourse[];
  navigate: (v: ViewState) => void;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  ACTIVE: {
    label: "Active",
    classes: "border-success/30 bg-success/10 text-success",
  },
  COMPLETED: {
    label: "Completed",
    classes: "border-primary/30 bg-primary/10 text-primary",
  },
  PENDING: {
    label: "⏳ Pending",
    classes: "border-warning/30 bg-warning/10 text-warning",
  },
  REJECTED: {
    label: "Rejected",
    classes: "border-danger/30 bg-danger/10 text-danger",
  },
};

export default function CoursesView({ courses, navigate }: CoursesViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        const matchesSearch =
          search.trim() === "" ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.instructor.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      }),
    [courses, search],
  );

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          {!search && (
            <IconSearch
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10"
            />
          )}
          <input
            type="text"
            placeholder="     Search courses or instructors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-10 pr-3"
          />
        </div>
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">📚</span>
          <p className="font-semibold text-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Try a different search term."
              : "You haven't enrolled in any courses yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const cfg = statusConfig[course.status] ?? {
              label: course.status,
              classes: "border-muted/30 bg-muted/10 text-muted",
            };
            const canOpen = course.status !== "PENDING" && course.batchId;
            return (
              <div
                key={course.id}
                className="glass-card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-card">
                  <CourseThumb
                    title={course.title}
                    thumbnail={
                      (course as EnrolledCourse & { thumbnailUrl?: string })
                        .thumbnailUrl || course.thumbnail
                    }
                    alt={course.title}
                    fill
                    imageClassName="object-cover"
                    iconClassName="absolute inset-0 m-auto h-16 w-16 object-contain"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-accent/20">
                        📚
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                  {/* Status Badge */}
                  <span
                    className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <div>
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {course.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {course.instructor}
                    </p>
                  </div>

                  <p className="text-[11px] text-muted">
                    Batch: {course.batchLabel}
                  </p>

                  {course.status !== "PENDING" && (
                    <div>
                      <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-1.5">
                    {canOpen && (
                      <button
                        onClick={() =>
                          navigate({
                            view: "COURSE_CONTENT",
                            params: { courseId: course.id },
                          })
                        }
                        className="btn-primary w-full py-1 text-[11px]"
                      >
                        Continue Course <IconArrowRight size={12} />
                      </button>
                    )}
                    {course.status === "PENDING" && (
                      <div className="flex items-center justify-center gap-1 rounded-lg border border-warning/30 bg-warning/5 py-1.5 text-[11px] text-warning">
                        <IconClock size={12} /> Awaiting admin
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
