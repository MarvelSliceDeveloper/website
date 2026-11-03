"use client";

import { useMemo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/ui/utils";
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
  IconChartBar,
  IconTrendingUp,
  IconUsersGroup,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Same palette as the admin dashboard so charts read consistently across roles.
const COLORS = {
  primary: "#4F5FE0",
  accent: "#14B8A6",
  success: "#22A06B",
  warning: "#E0A030",
  danger: "#E0526B",
  violet: "#8B7CF6",
};

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
  _count?: { attendance: number };
  attendance?: { _avg?: { durationSeconds: number | null } };
};

type Batch = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: number | null;
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

// Monday-based start of week, in local time.
function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const shortDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/**
 * Chart card shell matching the admin dashboard: icon chip + title + subtitle
 * in the header, chart body in the content area.
 */
function ChartCard({
  title,
  subtitle,
  icon,
  tone = "primary",
  loading,
  empty,
  emptyText = "No data available",
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone?: "primary" | "accent" | "success" | "warning";
  loading: boolean;
  empty: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-2.5 pb-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            toneClass,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div
            className="animate-pulse rounded-lg bg-border/50"
            style={{ height: 260 }}
          />
        ) : empty ? (
          <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

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

  // Submissions: fetched per-assignment (only those with submissions),
  // aggregated + sorted. Keyed by the assignment ids so it re-runs when the
  // assignment list changes; disabled until assignments have loaded.
  // Keeps both PENDING and GRADED so the grading split chart has real totals.
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
              (res.submissions || []).map((sub) => ({
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
      const all = results
        .filter(
          (r): r is PromiseFulfilledResult<AssignmentSubmission[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value);

      const pending = all
        .filter((sub) => sub.status === "PENDING")
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        );

      return {
        pending,
        pendingCount: pending.length,
        gradedCount: all.filter((sub) => sub.status === "GRADED").length,
      };
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

  const pendingSubmissions = submissionsQuery.data?.pending ?? [];
  const submissions = pendingSubmissions.slice(0, 5);
  const stats: DashboardStats = {
    totalSessions: allSessions.length,
    totalBatches: batches.length,
    totalStudents,
    pendingAssignments: submissionsQuery.data?.pendingCount ?? 0,
  };

  // ----- Chart data (all derived from data already on this page) -----

  // Attendance for the most recent completed sessions.
  const attendanceTrend = useMemo(() => {
    const now = new Date();
    const past = allSessions
      .filter((s) => s.endedAt || new Date(s.scheduledAt) < now)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      )
      .slice(-10);

    const minutes = past.map((s) => {
      const seconds = s.attendance?._avg?.durationSeconds;
      return seconds == null ? null : Math.round(seconds / 60);
    });

    return {
      categories: past.map((s) => shortDate(s.scheduledAt)),
      counts: past.map((s) => s._count?.attendance ?? 0),
      minutes,
      hasMinutes: minutes.some((m) => m !== null),
    };
  }, [allSessions]);

  // Sessions per week for the last 8 weeks, split completed vs upcoming.
  const teachingLoad = useMemo(() => {
    const now = new Date();
    const currentWeek = startOfWeek(now);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(currentWeek);
      start.setDate(start.getDate() - (7 - i) * 7);
      return { start, key: start.getTime(), completed: 0, upcoming: 0 };
    });
    const byKey = new Map(weeks.map((w) => [w.key, w]));

    for (const session of allSessions) {
      const scheduled = new Date(session.scheduledAt);
      const bucket = byKey.get(startOfWeek(scheduled).getTime());
      if (!bucket) continue;
      if (session.endedAt || scheduled < now) bucket.completed += 1;
      else bucket.upcoming += 1;
    }

    return {
      categories: weeks.map((w) => shortDate(w.start)),
      completed: weeks.map((w) => w.completed),
      upcoming: weeks.map((w) => w.upcoming),
      total: weeks.reduce((sum, w) => sum + w.completed + w.upcoming, 0),
    };
  }, [allSessions]);

  // Enrollment fill rate per batch. Sorted ascending so the fullest cohort
  // renders at the top of a horizontal bar chart.
  const enrollmentFill = useMemo(
    () =>
      batches
        .map((batch) => {
          const enrolled = batch._count?.enrollments ?? 0;
          const capacity = batch.maxStudents ?? 0;
          return {
            id: batch.id,
            name: batch.name,
            enrolled,
            capacity,
            pct: capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0,
          };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 8)
        .sort((a, b) => a.pct - b.pct),
    [batches],
  );

  const gradingSplit = useMemo(() => {
    const pending = submissionsQuery.data?.pendingCount ?? 0;
    const graded = submissionsQuery.data?.gradedCount ?? 0;
    return { pending, graded, total: pending + graded };
  }, [submissionsQuery.data]);

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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Attendance Trend"
          subtitle="Students who joined each of your last 10 completed sessions"
          icon={<IconChartBar size={18} stroke={1.8} />}
          tone="primary"
          loading={loading}
          empty={attendanceTrend.categories.length === 0}
          emptyText="No completed sessions yet"
        >
          <Chart
            options={{
              chart: {
                type: "bar",
                toolbar: { show: false },
                fontFamily: "inherit",
              },
              colors: attendanceTrend.hasMinutes
                ? [COLORS.primary, COLORS.warning]
                : [COLORS.primary],
              plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
              stroke: {
                width: attendanceTrend.hasMinutes ? [0, 3] : 0,
                curve: "smooth",
              },
              markers: { size: 4 },
              dataLabels: { enabled: false },
              xaxis: {
                categories: attendanceTrend.categories,
                labels: {
                  style: { colors: "var(--muted)", fontSize: "11px" },
                },
              },
              yaxis: [
                {
                  title: {
                    text: "Students",
                    style: { color: "var(--muted)", fontSize: "11px" },
                  },
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                ...(attendanceTrend.hasMinutes
                  ? [
                      {
                        opposite: true,
                        title: {
                          text: "Avg minutes",
                          style: { color: "var(--muted)", fontSize: "11px" },
                        },
                        labels: {
                          style: { colors: "var(--muted)", fontSize: "11px" },
                        },
                      },
                    ]
                  : []),
              ],
              grid: { borderColor: "var(--border)", strokeDashArray: 4 },
              legend: {
                show: attendanceTrend.hasMinutes,
                position: "top",
                horizontalAlign: "right",
                labels: { colors: "var(--muted-foreground)" },
              },
              tooltip: { theme: "light", shared: true, intersect: false },
            }}
            series={[
              {
                name: "Students attended",
                type: "column",
                data: attendanceTrend.counts,
              },
              ...(attendanceTrend.hasMinutes
                ? [
                    {
                      name: "Avg minutes",
                      type: "line",
                      data: attendanceTrend.minutes,
                    },
                  ]
                : []),
            ]}
            type="bar"
            height={280}
          />
        </ChartCard>
        {/* 2. Teaching load */}
        <ChartCard
          title="Teaching Load"
          subtitle="Sessions scheduled per week across the last 8 weeks"
          icon={<IconTrendingUp size={18} stroke={1.8} />}
          tone="accent"
          loading={loading}
          empty={teachingLoad.total === 0}
          emptyText="No sessions in the last 8 weeks"
        >
          <Chart
            options={{
              chart: {
                type: "bar",
                stacked: true,
                toolbar: { show: false },
                fontFamily: "inherit",
              },
              colors: [COLORS.success, COLORS.primary],
              plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
              dataLabels: { enabled: false },
              xaxis: {
                categories: teachingLoad.categories,
                labels: {
                  style: { colors: "var(--muted)", fontSize: "11px" },
                },
              },
              yaxis: {
                labels: {
                  minWidth: 28,
                  style: { colors: "var(--muted)", fontSize: "11px" },
                },
              },
              grid: { borderColor: "var(--border)", strokeDashArray: 4 },
              legend: {
                position: "top",
                horizontalAlign: "right",
                labels: { colors: "var(--muted-foreground)" },
              },
              tooltip: { theme: "light", shared: true, intersect: false },
            }}
            series={[
              { name: "Completed", data: teachingLoad.completed },
              { name: "Upcoming", data: teachingLoad.upcoming },
            ]}
            type="bar"
            height={280}
          />
        </ChartCard>
        {/* 3. Batch enrollment fill */}
        <ChartCard
          title="Batch Enrollment"
          subtitle="Seats filled per assigned cohort"
          icon={<IconUsersGroup size={18} stroke={1.8} />}
          tone="success"
          loading={loading}
          empty={enrollmentFill.length === 0}
          emptyText="No batches assigned yet"
        >
          <Chart
            options={{
              chart: {
                type: "bar",
                toolbar: { show: false },
                fontFamily: "inherit",
              },
              colors: [COLORS.accent],
              plotOptions: {
                bar: { borderRadius: 6, horizontal: true, barHeight: "55%" },
              },
              dataLabels: {
                enabled: true,
                offsetX: 8,
                style: {
                  fontSize: "10px",
                  fontWeight: 600,
                  colors: ["var(--muted-foreground)"],
                },
                formatter: (val: string | number | number[]) =>
                  `${Math.round(Number(val))}%`,
              },
              xaxis: {
                categories: enrollmentFill.map((batch) => {
                  const label =
                    batch.name.length > 22
                      ? `${batch.name.slice(0, 21)}…`
                      : batch.name;
                  return batch.capacity > 0
                    ? `${label} · ${batch.enrolled}/${batch.capacity}`
                    : label;
                }),
                max: 100,
                title: {
                  text: "Fill rate (%)",
                  style: { color: "var(--muted)", fontSize: "11px" },
                },
                labels: {
                  rotate: 0,
                  style: { colors: "var(--muted)", fontSize: "11px" },
                },
              },
              yaxis: {
                labels: {
                  maxWidth: 190,
                  style: { colors: "var(--muted)", fontSize: "11px" },
                },
              },
              grid: { borderColor: "var(--border)", strokeDashArray: 4 },
              tooltip: {
                theme: "light",
                y: { formatter: (val: number) => `${Math.round(val)}%` },
              },
            }}
            series={[
              {
                name: "Fill rate",
                data: enrollmentFill.map((batch) => batch.pct),
              },
            ]}
            type="bar"
            height={Math.min(300, Math.max(240, enrollmentFill.length * 38 + 40))}
          />
        </ChartCard>
        {/* 4. Grading queue */}
        <ChartCard
          title="Grading Queue"
          subtitle="Submitted work split by review status"
          icon={<IconClipboardList size={18} stroke={1.8} />}
          tone="warning"
          loading={submissionsLoading}
          empty={gradingSplit.total === 0}
          emptyText="No submissions received yet"
        >
          <Chart
            options={{
              chart: { type: "donut", fontFamily: "inherit" },
              labels: ["Pending", "Graded"],
              colors: [COLORS.warning, COLORS.success],
              plotOptions: {
                pie: {
                  donut: {
                    size: "68%",
                    labels: {
                      show: true,
                      name: {
                        color: "var(--muted-foreground)",
                        fontSize: "12px",
                      },
                      value: {
                        color: "var(--foreground)",
                        fontSize: "20px",
                        fontWeight: 700,
                      },
                      total: {
                        show: true,
                        label: "Total",
                        color: "var(--muted-foreground)",
                        fontSize: "12px",
                        formatter: (w: {
                          globals: { seriesTotals: number[] };
                        }) =>
                          String(
                            w.globals.seriesTotals.reduce(
                              (a, b) => a + b,
                              0,
                            ),
                          ),
                      },
                    },
                  },
                },
              },
              legend: {
                position: "bottom",
                labels: { colors: "var(--muted-foreground)" },
              },
              dataLabels: { enabled: false },
              tooltip: { theme: "light" },
            }}
            series={[gradingSplit.pending, gradingSplit.graded]}
            type="donut"
            height={280}
          />
        </ChartCard>
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
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground mb-3">
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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <Card className="p-10 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success mb-3">
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
