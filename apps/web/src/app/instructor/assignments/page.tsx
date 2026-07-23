"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";

type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  type: "QUIZ" | "ASSIGNMENT";
  course: { title: string };
  batch: { name: string };
};

export default function InstructorAssignmentsPage() {
  usePageTitle("Assignments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ assignments: Assignment[] }>("/api/assignments")
      .then((res) => setAssignments(res.assignments ?? []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
          Instructor
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Assessments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View quizzes and assignments for your courses.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-12 text-center border border-border/80">
          <p className="font-semibold text-foreground">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="glass-card p-4 border border-border/80 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.course.title} · {a.batch.name} · {a.type}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Due: {new Date(a.dueDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
