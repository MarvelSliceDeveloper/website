"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconBook, IconClipboardList, IconUsers } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Skeleton } from "@/components/shared/Skeleton";

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

  // Fetches courses from the instructor-specific endpoint.
  // /api/instructor/courses returns unique courses from the instructor's assigned batches.
  useEffect(() => {
    Promise.all([
      api
        .get<Course[]>("/api/instructor/courses")
        .catch(() => []),
    ])
      .then(([coursesRes]) => {
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="My Courses"
          breadcrumbs={[{ label: "Courses", href: "/instructor/courses" }]}
          role="Instructor"
        />
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
      <AdminPageHeader
        title="My Courses"
        breadcrumbs={[{ label: "Courses", href: "/instructor/courses" }]}
        role="Instructor"
      />

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
