"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  IconVideo,
  IconUsers,
  IconBook,
  IconCalendar,
  IconClock,
  IconClipboardList,
  IconExternalLink,
} from "@tabler/icons-react";

type DashboardStats = {
  totalSessions: number;
  totalBatches: number;
  totalStudents: number;
  pendingAssignments: number;
};

type AssignmentSubmission = {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  assignmentTitle: string;
  submittedAt: string;
  status: "PENDING" | "GRADED";
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  title?: string;
  batch?: { name: string; course: { title: string } } | null;
};

type Batch = {
  id: string;
  name: string;
  course: { title: string };
  _count?: { enrollments: number; sessions: number };
};

type Assignment = {
  id: string;
  title: string;
  course: { title: string };
  _count?: { submissions: number };
};

type SubmissionRecord = {
  id: string;
  status: "PENDING" | "GRADED";
  submittedAt: string;
  student: { name: string; email: string };
};

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([
    // No demo submissions — rely on real API data
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionsRes, batchesRes, assignmentsRes] =
          await Promise.allSettled([
            api.get<{ sessions?: Session[] }>("/api/sessions"),
            api.get<Batch[]>("/api/admin/batches"),
            api.get<{ assignments: Assignment[] }>("/api/assignments"),
          ]);

        const allSessions =
          sessionsRes.status === "fulfilled" &&
          Array.isArray(sessionsRes.value.sessions)
            ? sessionsRes.value.sessions
            : [];
        const batches =
          batchesRes.status === "fulfilled" && Array.isArray(batchesRes.value)
            ? batchesRes.value
            : [];
        const assignments =
          assignmentsRes.status === "fulfilled" &&
          Array.isArray(assignmentsRes.value.assignments)
            ? assignmentsRes.value.assignments
            : [];

        const now = new Date();
        const upcoming = allSessions.filter(
          (s) => !s.endedAt && new Date(s.scheduledAt) >= now,
        );
        setUpcomingSessions(upcoming.slice(0, 3));

        const totalStudents = batches.reduce(
          (sum, batch) => sum + (batch._count?.enrollments ?? 0),
          0,
        );

        const assignmentsWithSubmissions = assignments.filter(
          (assignment) => (assignment._count?.submissions ?? 0) > 0,
        );

        const submissionResults = await Promise.allSettled(
          assignmentsWithSubmissions.map((assignment) =>
            api
              .get<{
                submissions: SubmissionRecord[];
              }>(`/api/assignments/${assignment.id}/submissions`)
              .then((res) =>
                (res.submissions || [])
                  .filter((sub) => sub.status === "PENDING")
                  .map((sub) => ({
                    id: sub.id,
                    studentName: sub.student.name,
                    studentEmail: sub.student.email,
                    courseTitle: assignment.course.title,
                    assignmentTitle: assignment.title,
                    submittedAt: sub.submittedAt,
                    status: sub.status as "PENDING" | "GRADED",
                  })),
              ),
          ),
        );

        const allPendingSubmissions = submissionResults
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<AssignmentSubmission[]> =>
              result.status === "fulfilled",
          )
          .flatMap((result) => result.value)
          .sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() -
              new Date(a.submittedAt).getTime(),
          );

        setSubmissions(allPendingSubmissions.slice(0, 5));
        setStats({
          totalSessions: allSessions.length,
          totalBatches: batches.length,
          totalStudents,
          pendingAssignments: allPendingSubmissions.length,
        });
      } catch (err: unknown) {
        console.error("Failed to load dashboard data:", err);
        if (
          err instanceof Error &&
          (err.message?.includes("Authentication") ||
            err.message?.includes("401"))
        ) {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Welcome Banner */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Instructor
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here is a summary of your workspace.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-2 [&>*]:duration-400">
        {[
          {
            label: "Assigned Batches",
            value: stats?.totalBatches,
            icon: IconUsers,
            gradient: "from-violet-500 to-purple-600",
          },
          {
            label: "Total Sessions",
            value: stats?.totalSessions,
            icon: IconVideo,
            gradient: "from-emerald-500 to-teal-600",
          },
          {
            label: "Active Students",
            value: stats?.totalStudents,
            icon: IconBook,
            gradient: "from-sky-500 to-blue-600",
          },
          {
            label: "Pending Submissions",
            value: stats?.pendingAssignments,
            icon: IconClipboardList,
            gradient: "from-amber-500 to-orange-600",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="glass-card p-5 flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {loading || stat.value === undefined ? "\u2014" : stat.value}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white`}
            >
              <stat.icon size={20} stroke={1.8} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <IconCalendar size={15} stroke={1.8} /> Upcoming Schedule
            </h2>
            <Link
              href="/instructor/sessions"
              className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
            >
              View all sessions
              <IconExternalLink size={12} className="inline ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card p-8 text-center text-sm text-muted animate-pulse">
              Loading schedule...
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <IconCalendar
                size={36}
                stroke={1.2}
                className="mx-auto text-muted/40 mb-3"
              />
              <p className="text-sm font-medium text-foreground">
                No upcoming sessions
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your scheduled classes will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="glass-card p-4 flex items-center justify-between hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <IconVideo size={18} stroke={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {new Date(session.scheduledAt).toLocaleString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {session.batch
                          ? `${session.batch.course.title} · Batch: ${session.batch.name}`
                          : session.title}
                      </p>
                    </div>
                  </div>
                  <a
                    href={session.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 shrink-0 ml-3"
                  >
                    Start Class
                    <IconExternalLink size={13} stroke={2} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Pending Grading */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
            <IconClipboardList size={15} stroke={1.8} /> Needs Grading
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="glass-card p-8 text-center text-sm text-muted animate-pulse">
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <IconClipboardList
                  size={36}
                  stroke={1.2}
                  className="mx-auto text-muted/40 mb-3"
                />
                <p className="text-sm font-medium text-foreground">
                  All caught up
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No submissions waiting for grading.
                </p>
              </div>
            ) : null}
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="glass-card p-4 space-y-3 hover:border-amber-500/20 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <IconClock size={10} />
                      {new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1.5 truncate">
                    {sub.assignmentTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Submitted by: {sub.studentName}
                  </p>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = "/instructor/assignments")
                  }
                  className="btn-secondary w-full justify-center text-xs py-1.5"
                >
                  Review & Grade
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
