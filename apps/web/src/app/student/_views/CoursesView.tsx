"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { IconArrowRight, IconClock, IconSearch } from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type { EnrolledCourse } from "@/lib/student-mock-data";

interface CoursesViewProps {
  courses: EnrolledCourse[];
  navigate: (v: ViewState) => void;
}

type Filter = "ALL" | "ACTIVE" | "COMPLETED" | "PENDING";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "In Progress", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending Approval", value: "PENDING" },
];

const statusConfig = {
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
};

export default function CoursesView({ courses, navigate }: CoursesViewProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      ALL: courses.length,
      ACTIVE: courses.filter((c) => c.status === "ACTIVE").length,
      COMPLETED: courses.filter((c) => c.status === "COMPLETED").length,
      PENDING: courses.filter((c) => c.status === "PENDING").length,
    }),
    [courses],
  );

  const filtered = courses.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const matchesSearch =
      search.trim() === "" ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="sp-eyebrow">Learning</p>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        <button
          onClick={() => navigate({ view: "BROWSE_CATALOGUE" })}
          className="btn-secondary text-sm"
        >
          Browse Catalogue →
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search courses or instructors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                filter === f.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  filter === f.value
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/10 text-muted"
                }`}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
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
          <button
            onClick={() => navigate({ view: "BROWSE_CATALOGUE" })}
            className="btn-primary mt-2 text-sm"
          >
            Browse Catalogue →
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const cfg = statusConfig[course.status];
            const canOpen = course.status !== "PENDING" && course.batchId;
            return (
              <div
                key={course.id}
                className="glass-card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                {/* Thumbnail with gradient overlay */}
                <div className="relative h-36 w-full overflow-hidden bg-card">
                  {(() => {
                    const thumb =
                      (course as EnrolledCourse & { thumbnailUrl?: string })
                        .thumbnailUrl || course.thumbnail;
                    const isValidUrl =
                      thumb &&
                      (thumb.startsWith("/") || thumb.startsWith("http"));
                    return isValidUrl ? (
                      <Image
                        src={thumb}
                        className="object-cover transition-transform group-hover:scale-105"
                        alt={course.title}
                        fill
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML =
                              '<div class="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-accent/20">📚</div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-accent/20">
                        {thumb || "📚"}
                      </div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                  {/* Status Badge */}
                  <span
                    className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}
                  >
                    {cfg.label}
                  </span>
                  {/* Progress ring in thumbnail corner */}
                  {course.status !== "PENDING" && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="relative flex h-10 w-10 items-center justify-center">
                        <svg width={40} height={40} className="absolute">
                          <circle
                            cx={20}
                            cy={20}
                            r={16}
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth={3}
                          />
                          <circle
                            cx={20}
                            cy={20}
                            r={16}
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={
                              2 * Math.PI * 16 -
                              (course.progress / 100) * 2 * Math.PI * 16
                            }
                            strokeLinecap="round"
                            transform="rotate(-90 20 20)"
                            className="transition-all duration-700"
                          />
                        </svg>
                        <span className="relative text-[10px] font-bold text-primary">
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div>
                    <p className="line-clamp-2 font-semibold text-foreground">
                      {course.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {course.instructor}
                    </p>
                  </div>

                  <p className="text-xs text-muted">
                    Batch: {course.batchLabel}
                  </p>

                  {course.status !== "PENDING" && (
                    <div className="mt-1">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    {canOpen && (
                      <button
                        onClick={() =>
                          navigate({
                            view: "COURSE_CONTENT",
                            params: { courseId: course.id },
                          })
                        }
                        className="btn-primary w-full text-sm"
                      >
                        Continue <IconArrowRight size={14} />
                      </button>
                    )}
                    {course.status === "PENDING" && (
                      <div className="flex items-center justify-center gap-1 rounded-lg border border-warning/30 bg-warning/5 py-2 text-xs text-warning">
                        <IconClock size={13} /> Awaiting admin
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
