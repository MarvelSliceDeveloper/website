"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  IconVideo,
  IconUsers,
  IconBook,
  IconCalendar,
  IconClock,
  IconClipboardList,
  IconExternalLink,
  IconChevronRight,
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Batches
              </p>
              <p className="text-lg font-bold text-primary">
                {loading ? "—" : stats.totalBatches}
              </p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Students
              </p>
              <p className="text-lg font-bold text-success">
                {loading ? "—" : stats.totalStudents}
              </p>
            </div>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Batches"
          value={stats.totalBatches}
          icon={IconUsers}
          variant="purple"
          href="/instructor/batches"
          loading={loading}
        />
        <StatCard
          label="Total Sessions"
          value={stats.totalSessions}
          icon={IconVideo}
          variant="green"
          href="/instructor/sessions"
          loading={loading}
        />
        <StatCard
          label="Active Students"
          value={stats.totalStudents}
          icon={IconBook}
          variant="blue"
          loading={loading}
        />
        <StatCard
          label="Pending Submissions"
          value={submissionsQuery.isPending ? null : stats.pendingAssignments}
          icon={IconClipboardList}
          variant="orange"
          href="/instructor/assignments"
          loading={submissionsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <IconCalendar size={16} stroke={1.8} className="text-primary" /> Upcoming Schedule
            </h2>
            <Link
              href="/instructor/sessions"
              className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors flex items-center gap-1"
            >
              View all sessions
              <IconChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/20 text-muted-foreground mb-3">
                <IconCalendar size={28} stroke={1.5} />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No upcoming sessions
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Your scheduled classes will appear here when configured.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Card
                  key={session.id}
                  hoverable
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IconVideo size={20} stroke={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
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
                    className="inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.99] h-8 px-3.5 text-xs rounded-lg gap-1.5 shrink-0 ml-3"
                  >
                    Start Class
                    <IconExternalLink size={13} stroke={2} />
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Pending Grading */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
            <IconClipboardList size={16} stroke={1.8} className="text-warning" /> Needs Grading
          </h2>

          <div className="space-y-3">
            {submissionsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <Card className="p-10 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success mb-3">
                  <IconClipboardList size={28} stroke={1.5} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  No submissions currently waiting for grading.
                </p>
              </Card>
            ) : null}
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                hoverable
                className="p-4 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="warning" size="sm" dot>
                      Pending
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <IconClock size={12} />
                      {new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-2 truncate">
                    {sub.assignmentTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Submitted by: <span className="text-foreground font-medium">{sub.studentName}</span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/instructor/assignments")}
                  className="w-full text-xs"
                >
                  Review & Grade
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
