"use client";

import { useState } from "react";
import Image from "next/image";
import { IconSearch } from "@tabler/icons-react";
import type { CatalogueCourse } from "@/lib/api-types";
import type { ViewState } from "../_types/student-portal";

interface BrowseCatalogueViewProps {
  courses: CatalogueCourse[];
  navigate: (v: ViewState) => void;
}

const ALL_TAGS = [
  "All",
  "Programming",
  "Data",
  "Frontend",
  "Backend",
  "DevOps",
  "Design",
];

export default function BrowseCatalogueView({
  courses,
  navigate,
}: BrowseCatalogueViewProps) {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("All");

  const filtered = courses.filter((c) => {
    const matchesSearch =
      search.trim() === "" ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesTag =
      tag === "All" ||
      c.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Catalogue</p>
        <h1 className="text-2xl font-bold text-foreground">Course Catalogue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore all available courses. New batches every month.
        </p>
      </div>

      {/* Search + Tag filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                tag === t
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground">
            Try different search terms or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="glass-card group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                {/* Thumbnail */}
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-3xl overflow-hidden">
                  {(() => {
                    const thumb =
                      (course as CatalogueCourse & { thumbnailUrl?: string })
                        .thumbnailUrl || course.thumbnail;
                    const isValidUrl =
                      thumb &&
                      (thumb.startsWith("/") || thumb.startsWith("http"));

                    // Generate hash color based on course title
                    const hash = course.title.split("").reduce((acc, char) => {
                      return char.charCodeAt(0) + ((acc << 5) - acc);
                    }, 0);
                    const hue = Math.abs(hash % 360);
                    const bgColor = `hsl(${hue}, 60%, 95%)`;
                    const textColor = `hsl(${hue}, 70%, 40%)`;

                    return isValidUrl ? (
                      <Image
                        src={thumb}
                        className="h-full w-full object-cover"
                        alt={course.title}
                        width={56}
                        height={56}
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.textContent = "📚";
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: bgColor, color: textColor }}
                      >
                        {thumb || course.title.charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {course.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {course.duration} · Instructor: {course.instructor}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Next Batch: {course.nextBatch}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {course.isEnrolled ? (
                    <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      ✅ Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        navigate({
                          view: "COURSE_DETAIL",
                          params: { courseId: course.id },
                        })
                      }
                      className="btn-primary text-sm"
                    >
                      Enroll Now →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
