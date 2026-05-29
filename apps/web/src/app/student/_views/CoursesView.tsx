"use client";

import { useState } from "react";
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
  ACTIVE: { label: "Active", classes: "border-success/30 bg-success/10 text-success" },
  COMPLETED: { label: "Completed", classes: "border-primary/30 bg-primary/10 text-primary" },
  PENDING: { label: "⏳ Pending", classes: "border-warning/30 bg-warning/10 text-warning" },
};

export default function CoursesView({ courses, navigate }: CoursesViewProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

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
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
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
              className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${filter === f.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground"
                }`}
            >
              {f.label}
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
            {search ? "Try a different search term." : "You haven't enrolled in any courses yet."}
          </p>
          <button onClick={() => navigate({ view: "BROWSE_CATALOGUE" })} className="btn-primary mt-2 text-sm">
            Browse Catalogue →
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const cfg = statusConfig[course.status];
            const canOpen = course.status !== "PENDING" && course.batchId;
            return (
              <div key={course.id} className="glass-card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40">
                {/* Large Thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-card">
                  {(() => {
                    const thumb = (course as any).thumbnailUrl || (course as any).thumbnail;
                    const isValidUrl = thumb && (thumb.startsWith("/") || thumb.startsWith("http"));
                    return isValidUrl ? (
                      <img
                        src={thumb}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        alt={course.title}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-accent/20">📚</div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-accent/20">
                        {thumb || "📚"}
                      </div>
                    );
                  })()}
                  {/* Status Badge */}
                  <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* Title */}
                  <div>
                    <p className="line-clamp-2 font-semibold text-foreground">{course.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
                  </div>

                  {/* Batch info */}
                  <p className="text-xs text-muted-foreground">Batch: {course.batchLabel}</p>

                  {/* Progress bar */}
                  {course.status !== "PENDING" && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
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

                  {/* Action Button */}
                  <div className="mt-auto pt-2">
                    {canOpen && (
                      <button
                        onClick={() => navigate({ view: "COURSE_CONTENT", params: { courseId: course.id } })}
                        className="btn-primary w-full text-sm"
                      >
                        Open <IconArrowRight size={14} />
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
