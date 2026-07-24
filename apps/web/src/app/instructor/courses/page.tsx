"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconBook, IconClipboardList, IconUsers } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  _count: { modules: number; batches: number };
};

export default function InstructorCoursesPage() {
  usePageTitle("Courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api
        .get<{ courses: Course[] }>("/api/admin/courses")
        .catch(() => ({ courses: [] })),
    ])
      .then(([coursesRes]) => {
        setCourses(coursesRes.courses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-card-hover/60 rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse bg-card-hover/60 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Instructor
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            My Courses
          </h1>
        </div>
        <div className="glass-card p-12 text-center">
          <IconBook size={40} className="mx-auto text-muted mb-3" />
          <p className="font-semibold text-foreground">No courses assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            You haven&apos;t been assigned to any courses yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Instructor
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
          <IconBook size={28} className="text-primary-hover" />
          My Courses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your assigned courses, quizzes, and assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {courses.map((course) => (
          <div
            key={course.id}
            className="glass-card border border-border/80 overflow-hidden"
          >
            <div className="p-5 border-b border-border/60">
              <h2 className="text-lg font-bold text-foreground">
                {course.title}
              </h2>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            <div className="px-5 py-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconUsers size={14} />
                  {course._count.batches}{" "}
                  {course._count.batches === 1 ? "batch" : "batches"}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconClipboardList size={14} />
                  {course._count.modules}{" "}
                  {course._count.modules === 1 ? "module" : "modules"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
