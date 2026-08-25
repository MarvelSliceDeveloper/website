"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconVideo,
  IconUsers,
  IconBook,
  IconCalendar,
  IconClock,
  IconClipboardList,
  IconExternalLink,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";

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
  course?: { title: string } | null;
  batch?: { name: string; course?: { title: string } | null } | null;
};

type Batch = {
  id: string;
  name: string;
  course?: { title: string } | null;
  courseMentors?: { course: { title: string } }[];
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

const iconBg: Record<string, string> = {
  violet: "bg-primary/15 text-primary",
  emerald: "bg-success/15 text-success",
  sky: "bg-accent/15 text-accent",
  amber: "bg-warning/15 text-warning",
};

export default function InstructorDashboardPage() {
  usePageTitle("Dashboard");
  const router = useRouter();

  // Three base dashboard endpoints load in parallel. The submissions
  // enrichment below depends on the assignments list.
  const sessionsQuery = useApiQuery<{ sessions?: Session[] }>(
    ["instructor", "sessions"],
    "/api/sessions",
    { limit: "100" },
  );
  const batchesQuery = useApiQuery<Batch[]>(
    ["instructor", "batches"],
    "/api/instructor/batches",
  );
  const assignmentsQuery = useApiQuery<{ assignments: Assignment[] }>(
    ["instructor", "assignments"],
    "/api/assignments",
  );

  // Pending submissions: fetched per-assignment (only those with submissions),
  // aggregated + sorted. Keyed by the assignment ids so it re-runs when the
  // assignment list changes; disabled until assignments have loaded.
  const submissionsQuery = useQuery({
    queryKey: [
      "instructor",
      "dashboard",
      "submissions",
      (assignmentsQuery.data?.assignments ?? []).map((a) => a.id),
    ],
    queryFn: async () => {
      const assignments =
        assignmentsQuery.data?.assignments?.filter(
          (assignment) => (assignment._count?.submissions ?? 0) > 0,
        ) ?? [];
      const results = await Promise.allSettled(
        assignments.map((assignment) =>
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
      return results
        .filter(
          (r): r is PromiseFulfilledResult<AssignmentSubmission[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value)
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )
        .slice(0, 5);
    },
    enabled: Boolean(assignmentsQuery.data),
    staleTime: 30_000,
  });

  const allSessions = useMemo(
    () => sessionsQuery.data?.sessions ?? [],
    [sessionsQuery.data],
  );
  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);

  // Upcoming = sessions that haven't ended and are still in the future.
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return allSessions
      .filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now)
      .slice(0, 3);
  }, [allSessions]);

  const totalStudents = useMemo(
    () =>
      batches.reduce((sum, batch) => sum + (batch._count?.enrollments ?? 0), 0),
    [batches],
  );

  const submissions = submissionsQuery.data ?? [];
  const stats: DashboardStats = {
    totalSessions: allSessions.length,
    totalBatches: batches.length,
    totalStudents,
    pendingAssignments: submissions.length,
  };

  const loading =
    sessionsQuery.isPending ||
    batchesQuery.isPending ||
    assignmentsQuery.isPending;
  const submissionsLoading = loading || submissionsQuery.isPending;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        breadcrumbs={[{ label: "Dashboard", href: "/instructor/dashboard" }]}
        role="Instructor"
        action={
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Batches
              </p>
              <p className="text-lg font-bold text-primary">
                {loading ? "\u2014" : stats.totalBatches}
              </p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Students
              </p>
              <p className="text-lg font-bold text-success">
                {loading ? "\u2014" : stats.totalStudents}
              </p>
            </div>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Assigned Batches",
            value: stats.totalBatches,
            icon: IconUsers,
            color: "violet",
          },
          {
            label: "Total Sessions",
            value: stats.totalSessions,
            icon: IconVideo,
            color: "emerald",
          },
          {
            label: "Active Students",
            value: stats.totalStudents,
            icon: IconBook,
            color: "sky",
          },
          {
            label: "Pending Submissions",
            value: submissionsQuery.isPending
              ? undefined
              : stats.pendingAssignments,
            icon: IconClipboardList,
            color: "amber",
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {loading || stat.value === undefined ? "\u2014" : stat.value}
                </p>{" "}
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg[stat.color]} group-hover:scale-110 transition-transform`}
              >
                <stat.icon size={20} stroke={1.8} />
              </div>
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
            <div className="border border-border bg-card p-8 text-center text-sm text-muted animate-pulse">
              Loading schedule...
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="border border-border bg-card p-10 text-center">
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
                  className="border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
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
                        {session.course
                          ? session.course.title
                          : session.batch
                            ? `${session.batch.course?.title ?? "Course"} · ${session.batch.name}`
                            : (session.title ?? "Session")}
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
            {submissionsLoading ? (
              <div className="border border-border bg-card p-8 text-center text-sm text-muted animate-pulse">
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="border border-border bg-card p-10 text-center">
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
                className="border border-border bg-card p-4 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-warning bg-warning/15 px-1.5 py-0.5 rounded">
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
                  onClick={() => router.push("/instructor/assignments")}
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
