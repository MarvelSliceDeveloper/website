"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";

type BatchCourse = {
  id: string;
  courseId: string;
  order: number;
  isVisible: boolean;
  course: { id: string; title: string; slug: string };
};

type Student = {
  id: string;
  user: { id: string; name: string; email: string };
  appliedAt: string;
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  recording: { id: string; syncedAt: string } | null;
};

type Batch = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxStudents: number | null;
  description: string | null;
  course: { id: string; title: string } | null;
  package?: { id: string; name: string } | null;
  instructor: { id: string; name: string; email: string };
  enrollments: Student[];
  packageEnrollmentCourses: {
    enrollment: { user: { id: string; name: string; email: string } };
  }[];
  sessions: Session[];
  _count: {
    enrollments: number;
    packageEnrollmentCourses: number;
    sessions: number;
  };
};

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-accent/15 text-accent border-accent/25",
  ACTIVE: "bg-success/15 text-success border-success/25",
  COMPLETED: "bg-muted/15 text-muted border-muted/25",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "sessions" | "courses">("students");
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchBatch = useCallback(async () => {
    try {
      const data = await api.get<Batch>(`/api/admin/batches/${id}`);
      setBatch(data);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await api.get<{ courses: BatchCourse[] }>(
        `/api/admin/batches/${id}/courses`,
      );
      setCourses(data.courses);
    } catch {
      setCourses([]);
    }
  }, [id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    if (tab === "courses") {
      fetchCourses();
    }
  }, [tab, fetchCourses]);

  const handleToggleVisibility = async (courseId: string) => {
    setToggling(courseId);
    try {
      const result = await api.put<BatchCourse>(
        `/api/admin/batches/${id}/courses/${courseId}/visibility`,
      );
      setCourses((prev) =>
        prev.map((c) =>
          c.courseId === result.courseId ? { ...c, isVisible: result.isVisible } : c,
        ),
      );
      toast.success(
        result.isVisible ? "Course is now visible" : "Course is now hidden",
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const handleRemoveStudent = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this batch?`)) return;
    try {
      await api.delete(`/api/admin/batches/${id}/students/${userId}`);
      toast.success(`${name} removed from batch`);
      fetchBatch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">Batch not found</p>
        <Link href="/admin/batches" className="btn-primary mt-4 inline-flex">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/batches"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1"
          >
            ← Back to Batches
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{batch.name}</h1>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[batch.status] || ""}`}
            >
              {batch.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {batch.course?.title ?? batch.package?.name ?? "All Courses"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {batch._count.enrollments + batch._count.packageEnrollmentCourses}
          </p>
          <p className="text-xs text-muted">Students</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {batch._count.sessions}
          </p>
          <p className="text-xs text-muted">Sessions</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {batch.maxStudents ?? "∞"}
          </p>
          <p className="text-xs text-muted">Capacity</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            {batch.instructor.name}
          </p>
          <p className="text-xs text-muted">Instructor</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {(["students", "sessions", "courses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "students"
              ? `Students (${batch.enrollments.length + batch.packageEnrollmentCourses.length})`
              : t === "sessions"
                ? `Sessions (${batch.sessions.length})`
                : `Courses (${courses.length || 0})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "students" && (
        <div className="space-y-4">
          {batch.enrollments.length === 0 &&
          batch.packageEnrollmentCourses.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No students enrolled yet.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Student
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Email
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Enrollment
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {batch.enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
                            {enrollment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {enrollment.user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {enrollment.user.email}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {new Date(enrollment.appliedAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          Course
                        </span>
                      </td>
                    </tr>
                  ))}
                  {batch.packageEnrollmentCourses.map((pec, idx) => (
                    <tr
                      key={`pkg-${idx}`}
                      className="hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                            {pec.enrollment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {pec.enrollment.user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {pec.enrollment.user.email}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">Package</td>
                      <td className="px-5 py-3 text-xs">
                        <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                          Package
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-3">
          {batch.sessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No sessions scheduled yet.
              </p>
            </div>
          ) : (
            batch.sessions.map((session) => {
              const isPast =
                session.endedAt || new Date(session.scheduledAt) < new Date();
              return (
                <div
                  key={session.id}
                  className="glass-card p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(session.scheduledAt).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-medium bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                        {session.createdFrom}
                      </span>
                      {session.recording && (
                        <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">
                          Recording Available
                        </span>
                      )}
                      {isPast && !session.recording && (
                        <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                          No Recording
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={session.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs"
                  >
                    {isPast ? "View Details" : "Join URL →"}
                  </a>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "courses" && (
        <div className="space-y-3">
          {!batch.package ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Course visibility is only available for package-level batches.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No courses found in the linked package.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted w-12">#</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Course</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Status</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {courses.map((bc) => (
                    <tr
                      key={bc.courseId}
                      className="hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {bc.order + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {bc.course.title}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {bc.isVisible ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                            <IconEye size={13} />
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-muted/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <IconEyeOff size={13} />
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleToggleVisibility(bc.courseId)}
                          disabled={toggling === bc.courseId}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            bc.isVisible
                              ? "border-warning/30 text-warning hover:bg-warning/10"
                              : "border-primary/30 text-primary hover:bg-primary/10"
                          } disabled:opacity-50`}
                        >
                          {toggling === bc.courseId ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : bc.isVisible ? (
                            <>
                              <IconLockOpen size={13} /> Hide
                            </>
                          ) : (
                            <>
                              <IconLock size={13} /> Show
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
