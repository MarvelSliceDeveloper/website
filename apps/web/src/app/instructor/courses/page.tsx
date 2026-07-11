"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  IconBook,
  IconClipboardList,
  IconFileDescription,
  IconUsers,
} from "@tabler/icons-react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  batches: { id: string; name: string; _count: { sessions: number } }[];
  quizzes: { id: string; title: string }[];
  assignments: { id: string; title: string; dueDate: string }[];
};

export default function InstructorCoursesPage() {
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
            {/* Course header */}
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

            {/* Batches */}
            {course.batches.length > 0 && (
              <div className="px-5 py-3 border-b border-border/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <IconUsers size={14} /> Batches
                </p>
                <div className="space-y-1.5">
                  {course.batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="text-sm text-foreground flex items-center justify-between"
                    >
                      <span>{batch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {batch._count.sessions} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quizzes */}
            {course.quizzes.length > 0 && (
              <div className="px-5 py-3 border-b border-border/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <IconClipboardList size={14} /> Quizzes
                </p>
                <div className="space-y-1">
                  {course.quizzes.map((quiz) => (
                    <div key={quiz.id} className="text-sm text-foreground">
                      {quiz.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments */}
            {course.assignments.length > 0 && (
              <div className="px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <IconFileDescription size={14} /> Assignments
                </p>
                <div className="space-y-1">
                  {course.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="text-sm text-foreground flex items-center justify-between"
                    >
                      <span>{assignment.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.quizzes.length === 0 && course.assignments.length === 0 && (
              <div className="px-5 py-4 text-center text-sm text-muted-foreground">
                No quizzes or assignments yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
