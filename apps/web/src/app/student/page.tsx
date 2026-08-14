"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { IconAlertCircle, IconSearch } from "@tabler/icons-react";
import StudentPortalShell, {
  type Breadcrumb,
} from "@/components/StudentPortalShell";
import { Spinner } from "@/components/shared/Spinner";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { useQueryClient } from "@tanstack/react-query";

// Types
import type { ViewState } from "./_types/student-portal";
import type {
  DashboardStats,
  OverdueAssignment,
  EnrolledCourse,
  Batch,
  LiveSession,
  CalendarEvent,
  MentorshipTicket,
  CatalogueCourse,
  ContinueLearningItem,
  StudentResultItem,
} from "@/lib/api-types";

// Views — heavy ones are lazy-loaded to keep the initial bundle small
import HomeView from "./_views/HomeView";
import CoursesView from "./_views/CoursesView";
import LiveSessionsView from "./_views/LiveSessionsView";
import CalendarView from "./_views/CalendarView";
import MentorshipView from "./_views/MentorshipView";
import CourseCompletedView from "./_views/CourseCompletedView";

const BatchDetailView = dynamic(() => import("./_views/BatchDetailView"), {
  loading: () => <LoadingView message="Loading batch details…" />,
});
const RecordingPlayerView = dynamic(
  () => import("./_views/RecordingPlayerView"),
  { loading: () => <LoadingView message="Loading recording…" /> },
);
const CertificatesView = dynamic(() => import("./_views/CertificatesView"), {
  loading: () => <LoadingView message="Loading certificates…" />,
});
const CourseDetailView = dynamic(() => import("./_views/CourseDetailView"), {
  loading: () => <LoadingView message="Loading course…" />,
});
const CourseContentView = dynamic(() => import("./_views/CourseContentView"), {
  loading: () => <LoadingView message="Loading course content…" />,
});
const AssignmentOverdueView = dynamic(
  () => import("./_views/AssignmentOverdueView"),
  { loading: () => <LoadingView message="Loading assignments…" /> },
);
const QuizOverdueView = dynamic(() => import("./_views/QuizOverdueView"), {
  loading: () => <LoadingView message="Loading quizzes…" />,
});
const OnboardingWizardView = dynamic(
  () => import("./_views/OnboardingWizardView"),
  { loading: () => <LoadingView message="Loading…" /> },
);

// ─── Portal data store ────────────────────────────────────────────────────────

interface PortalData {
  stats: DashboardStats;
  overdueAssignments: OverdueAssignment[];
  enrolledCourses: EnrolledCourse[];
  batches: Record<string, Batch>;
  liveSessions: LiveSession[];
  calendarEvents: CalendarEvent[];
  mentorshipTickets: MentorshipTicket[];
  continueLearning: ContinueLearningItem[];
  results: StudentResultItem[];
  failedSections: string[];
}

interface ApiBatchSessionRecord {
  id: string;
  scheduledAt: string;
  scheduledEndAt: string;
  module?: {
    id: string;
    title: string;
  } | null;
  recording?: {
    id: string;
    syncedAt: string;
  } | null;
}

interface ApiSessionRecord {
  id: string;
  title: string;
  status?: string;
  scheduledAt: string;
  scheduledEndAt: string;
  joinUrl: string;
  recording: { id: string } | null;
  course?: { id: string; title: string } | null;
  batch?: {
    name: string;
    course?: { title: string };
    package?: { name: string };
    instructor?: { name: string };
  };
  module?: { title: string } | null;
}

interface ApiMentorshipTicket {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  preferredTime?: string | null;
  notes?: string | null;
  joinUrl?: string | null;
  course?: { title: string } | null;
  mentor?: { name: string } | null;
}

interface ApiBatchDetailResponse {
  batch: {
    id: string;
    course: { id: string; title: string };
    instructor: { id: string; name: string; email: string };
    name: string;
    startDate: string;
    endDate: string;
    sessions: ApiBatchSessionRecord[];
  };
}

interface ApiEnrolledCourse {
  id: string;
  courseId?: string;
  course?: { id: string; title: string; thumbnailUrl?: string | null };
  batchId?: string | null;
  batch?: { id: string; name: string } | null;
}

interface ApiSummaryResponse {
  enrolled?: ApiEnrolledCourse[];
  sessions?: ApiSessionRecord[];
  calendarEvents?: CalendarEvent[];
  tickets?: ApiMentorshipTicket[];
  certificatesCount?: number;
}

interface ApiRecordingResponse {
  recordings: Array<{
    id: string;
    duration: number;
    sessionId: string;
    moduleId?: string | null;
    moduleTitle?: string | null;
    session: {
      id: string;
      scheduledAt: string;
      module?: { id: string; title: string } | null;
    };
    progress: Array<{ watchedSeconds: number; completedAt: string | null }>;
  }>;
}

function computeSessionStatus(
  scheduledAt: string,
  endDateTime: string | null | undefined,
  backendStatus?: string,
): "LIVE" | "UPCOMING" | "PAST" {
  if (backendStatus === "LIVE") return "LIVE";
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  // Fallback: if no end time, assume 2 hours from start
  const end = endDateTime
    ? new Date(endDateTime).getTime()
    : start + 2 * 60 * 60 * 1000;

  if (now >= start && now < end) return "LIVE";
  if (now >= end) return "PAST";
  return "UPCOMING";
}

function assemblePortalData(
  summaryData: ApiSummaryResponse | null,
  overdueItems: OverdueAssignment[],
  continueLearningItems: ContinueLearningItem[],
  resultsItems: StudentResultItem[],
  failedSections: string[],
): PortalData {
  if (summaryData) {
    const enrolledCourses: EnrolledCourse[] = (summaryData.enrolled || []).map(
      (req: ApiEnrolledCourse) => {
        const c = req.course;
        return {
          id: c?.id || req.id,
          title: c?.title || "Untitled Course",
          thumbnail: c?.thumbnailUrl || "📚",
          batchId: req.batchId || "",
          batchLabel: req.batch?.name || "Standard Batch",
          instructor: "—",
          progress: 0,
          status: "ACTIVE" as const,
          source: "enrollment" as const,
        };
      },
    );

    const mappedSessions: LiveSession[] = (summaryData.sessions || []).map(
      (s: ApiSessionRecord) => {
        const courseTitle =
          s.course?.title ||
          s.batch?.course?.title ||
          s.batch?.package?.name ||
          s.batch?.name ||
          "Live Class";

        return {
          id: s.id,
          title:
            s.title ||
            (s.module
              ? `Module ${s.module.title} — ${courseTitle}`
              : `Live Session — ${courseTitle}`),
          courseTitle,
          instructor: s.batch?.instructor?.name || "TBD",
          batchLabel: s.batch?.name || "—",
          status: computeSessionStatus(s.scheduledAt, s.scheduledEndAt, s.status),
          scheduledAt: s.scheduledAt,
          endDateTime:
            s.scheduledEndAt ||
            new Date(
              new Date(s.scheduledAt).getTime() + 2 * 60 * 60 * 1000,
            ).toISOString(),
          joinUrl: s.joinUrl,
          recordingSyncingIn:
            s.scheduledEndAt &&
            new Date(s.scheduledEndAt) <= new Date() &&
            !s.recording
              ? "~20 min"
              : undefined,
        };
      },
    );

    return {
      stats: {
        enrolledCount: enrolledCourses.length,
        completedCount: 0,
        liveTodayCount: mappedSessions.filter((s) => s.status === "LIVE").length,
        certificatesCount: summaryData.certificatesCount ?? 0,
      },
      overdueAssignments: overdueItems,
      enrolledCourses,
      batches: {},
      liveSessions: mappedSessions,
      calendarEvents: summaryData.calendarEvents || [],
      mentorshipTickets: (summaryData.tickets || []).map(
        (t: ApiMentorshipTicket) => ({
          id: t.id,
          courseTitle: t.course?.title || "General",
          topic: t.title,
          status: t.status as MentorshipTicket["status"],
          createdAt: t.createdAt,
          preferredTime: t.preferredTime || undefined,
          notes: t.notes || undefined,
          instructor: t.mentor?.name || undefined,
          joinUrl: t.joinUrl || undefined,
        }),
      ),
      continueLearning: continueLearningItems,
      results: resultsItems,
      failedSections,
    };
  }

  // Summary endpoint unavailable — render the sections that did load. The
  // heavy sections (overdue/results/continue-learning) already fall back to
  // empty arrays on their own, so a failed summary just yields an empty core.
  return {
    stats: {
      enrolledCount: 0,
      completedCount: 0,
      liveTodayCount: 0,
      certificatesCount: 0,
    },
    overdueAssignments: overdueItems,
    enrolledCourses: [],
    batches: {},
    liveSessions: [],
    calendarEvents: [],
    mentorshipTickets: [],
    continueLearning: continueLearningItems,
    results: resultsItems,
    failedSections,
  };
}

// Parallelizes the four dashboard endpoints with TanStack Query. All four
// fire together (no summary-first waterfall); results are cached/refetched
// per query key. `isLoading` mirrors the old behavior: the skeleton stays up
// until every section has settled.
function usePortalData() {
  const queryClient = useQueryClient();
  const summaryQuery = useApiQuery<ApiSummaryResponse>(
    ["student", "summary"],
    "/api/student/summary",
  );
  const overdueQuery = useApiQuery<{ items: OverdueAssignment[] }>(
    ["student", "overdue"],
    "/api/student/assignments/overdue",
  );
  const continueQuery = useApiQuery<{ items: ContinueLearningItem[] }>(
    ["student", "continue-learning"],
    "/api/student/continue-learning",
  );
  const resultsQuery = useApiQuery<{ items: StudentResultItem[] }>(
    ["student", "results"],
    "/api/student/results",
  );

  const isLoading =
    summaryQuery.isPending ||
    overdueQuery.isPending ||
    continueQuery.isPending ||
    resultsQuery.isPending;

  const data = useMemo<PortalData | null>(() => {
    if (summaryQuery.isPending) return null;
    return assemblePortalData(
      summaryQuery.data ?? null,
      overdueQuery.data?.items ?? [],
      continueQuery.data?.items ?? [],
      resultsQuery.data?.items ?? [],
      summaryQuery.isError ? ["summary"] : [],
    );
  }, [
    summaryQuery.isPending,
    summaryQuery.data,
    summaryQuery.isError,
    overdueQuery.data,
    continueQuery.data,
    resultsQuery.data,
  ]);

  const refetch = useCallback(() => {
    return queryClient.refetchQueries({
      predicate: (query) => query.queryKey[0] === "student",
    });
  }, [queryClient]);

  return { data, isLoading, refetch };
}

async function fetchBatch(batchId: string): Promise<Batch | null> {
  try {
    const [batchRes, recordingsRes] = await Promise.all([
      api.get<ApiBatchDetailResponse>(`/api/batches/${batchId}`),
      api.get<ApiRecordingResponse>(`/api/recordings?batchId=${batchId}`),
    ]);

    const batch = batchRes.batch;
    const recordingsBySession = new Map(
      recordingsRes.recordings.map((recording) => [
        recording.sessionId,
        recording,
      ]),
    );

    const recordings: Batch["recordings"] = batch.sessions.map(
      (session, index) => {
        const matchedRecording = recordingsBySession.get(session.id);
        const watchedPercent = matchedRecording
          ? matchedRecording.progress.reduce((max, progress) => {
              const dur = matchedRecording.duration || 1;
              const percent = Math.min(
                100,
                Math.round((progress.watchedSeconds / dur) * 100),
              );
              return Math.max(max, percent);
            }, 0)
          : 0;

        return {
          id: matchedRecording?.id ?? session.id,
          sessionId: session.id,
          moduleId:
            matchedRecording?.moduleId ?? session.module?.id ?? undefined,
          dayLabel: `Day ${index + 1}`,
          title:
            session.module?.title ??
            matchedRecording?.moduleTitle ??
            "Recording",
          duration: matchedRecording ? "Recorded session" : "Pending",
          watchedPercent,
          videoUrl: "",
        };
      },
    );

    const modules = Array.from(
      new Map(
        batch.sessions
          .map((session) => session.module)
          .filter((module): module is NonNullable<typeof module> =>
            Boolean(module),
          )
          .map((module) => [
            module.id,
            { id: module.id, title: module.title, completionPercent: 0 },
          ]),
      ).values(),
    );

    return {
      id: batch.id,
      courseTitle: batch.course.title,
      batchLabel: batch.name,
      instructor: batch.instructor.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      overallProgress:
        recordings.length > 0
          ? Math.round(
              recordings.reduce((sum, item) => sum + item.watchedPercent, 0) /
                recordings.length,
            )
          : 0,
      sessions: batch.sessions.map((session, index) => ({
        id: session.id,
        dayLabel: `Day ${index + 1}`,
        title: session.module?.title ?? "Session",
        status: computeSessionStatus(
          session.scheduledAt,
          session.scheduledEndAt,
        ),
        scheduledAt: session.scheduledAt,
        endDateTime: session.scheduledEndAt,
        instructor: batch.instructor.name,
      })),
      recordings,
      modules,
    };
  } catch {
    return null;
  }
}

// ─── Breadcrumb builder ───────────────────────────────────────────────────────

function buildBreadcrumbs(
  currentView: ViewState,
  navigate: (v: ViewState) => void,
  data: PortalData | null,
  courseDetailCache: Record<string, CatalogueCourse>,
): Breadcrumb[] {
  const home: Breadcrumb = {
    label: "Home",
    onClick: () => navigate({ view: "HOME" }),
  };

  switch (currentView.view) {
    case "HOME":
      return [home];
    case "COURSES":
      return [home, { label: "Courses" }];
    case "BATCH_DETAIL":
      return [
        home,
        { label: "Courses", onClick: () => navigate({ view: "COURSES" }) },
        {
          label:
            data?.batches[currentView.params?.batchId ?? ""]?.courseTitle ??
            "Batch",
        },
      ];
    case "RECORDING_PLAYER":
      return [
        home,
        { label: "Courses", onClick: () => navigate({ view: "COURSES" }) },
        { label: "Recording" },
      ];
    case "LIVE_SESSIONS":
      return [home, { label: "Live Sessions" }];
    case "CALENDAR":
      return [home, { label: "Calendar" }];
    case "MENTORSHIP":
      return [home, { label: "Mentorship" }];
    case "CERTIFICATES":
      return [home, { label: "Certificates" }];
    case "COURSE_DETAIL":
      return [
        home,
        {
          label: "Courses",
          onClick: () => navigate({ view: "COURSES" }),
        },
        {
          label:
            courseDetailCache[currentView.params?.courseId ?? ""]?.title ??
            "Course",
        },
      ];
    case "COURSE_CONTENT":
      return [
        home,
        { label: "Courses", onClick: () => navigate({ view: "COURSES" }) },
        {
          label:
            data?.enrolledCourses.find(
              (c) => c.id === currentView.params?.courseId,
            )?.title ?? "Course",
        },
      ];
    case "ASSIGNMENT_OVERDUE":
      return [home, { label: "Assignment Overdue" }];
    case "QUIZ_OVERDUE":
      return [home, { label: "Quiz Overdue" }];
    case "COURSE_COMPLETED":
      return [home, { label: "Courses Completed" }];
    default:
      return [home];
  }
}

// ─── Main Portal Page ─────────────────────────────────────────────────────────

export default function StudentPortalPage() {
  usePageTitle("Student Dashboard");
  return (
    <Suspense
      fallback={
        <StudentPortalShell>
          <Spinner
            size={40}
            label="Loading your portal…"
            className="min-h-[60vh]"
          />
        </StudentPortalShell>
      }
    >
      <StudentPortalContent />
    </Suspense>
  );
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, isLoading, refetch } = usePortalData();
  const [batchCache, setBatchCache] = useState<Record<string, Batch>>({});
  const [courseDetailCache, setCourseDetailCache] = useState<
    Record<string, CatalogueCourse>
  >({});
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [error, setError] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState(false);

  // Derive current view from URL search params
  const currentView: ViewState = (() => {
    const view = searchParams?.get("view");
    switch (view) {
      case "courses":
        return { view: "COURSES" };
      case "batch":
        return {
          view: "BATCH_DETAIL",
          params: { batchId: searchParams.get("batchId") ?? undefined },
        };
      case "recording":
        return {
          view: "RECORDING_PLAYER",
          params: {
            batchId: searchParams.get("batchId") ?? undefined,
            sessionId: searchParams.get("recordingId") ?? undefined,
          },
        };
      case "sessions":
        return { view: "LIVE_SESSIONS" };
      case "calendar":
        return { view: "CALENDAR" };
      case "mentorship":
        return { view: "MENTORSHIP" };
      case "certificates":
        return { view: "CERTIFICATES" };
      case "course-detail":
        return {
          view: "COURSE_DETAIL",
          params: { courseId: searchParams.get("courseId") ?? undefined },
        };
      case "course-content":
        return {
          view: "COURSE_CONTENT",
          params: {
            courseId: searchParams.get("courseId") ?? undefined,
            quizId: searchParams.get("quizId") ?? undefined,
            assignmentId: searchParams.get("assignmentId") ?? undefined,
          },
        };
      case "assignments":
        return { view: "ASSIGNMENT_OVERDUE" };
      case "quizzes":
        return { view: "QUIZ_OVERDUE" };
      case "completed":
        return { view: "COURSE_COMPLETED" };
      default:
        return { view: "HOME" };
    }
  })();

  const sectionApiAvailability = {
    courses: true,
    calendar: true,
    sessions: true,
    notifications: false,
    messages: false,
    mentorship: false,
    support: true,
    notes: true,
  };

  // ── URL helpers ───────────────────────────────────────────────────────────

  function viewStateToUrl(state: ViewState): string {
    const params = new URLSearchParams();
    switch (state.view) {
      case "HOME":
        return "/student";
      case "COURSES":
        params.set("view", "courses");
        break;
      case "BATCH_DETAIL":
        params.set("view", "batch");
        if (state.params?.batchId) params.set("batchId", state.params.batchId);
        break;
      case "RECORDING_PLAYER":
        params.set("view", "recording");
        if (state.params?.batchId) params.set("batchId", state.params.batchId);
        if (state.params?.sessionId)
          params.set("recordingId", state.params.sessionId);
        break;
      case "LIVE_SESSIONS":
        params.set("view", "sessions");
        break;
      case "CALENDAR":
        params.set("view", "calendar");
        break;
      case "MENTORSHIP":
        params.set("view", "mentorship");
        break;
      case "CERTIFICATES":
        params.set("view", "certificates");
        break;
      case "COURSE_DETAIL":
        params.set("view", "course-detail");
        if (state.params?.courseId)
          params.set("courseId", state.params.courseId);
        break;
      case "COURSE_CONTENT":
        params.set("view", "course-content");
        if (state.params?.courseId)
          params.set("courseId", state.params.courseId);
        break;
      case "ASSIGNMENT_OVERDUE":
        params.set("view", "assignments");
        break;
      case "QUIZ_OVERDUE":
        params.set("view", "quizzes");
        break;
      case "COURSE_COMPLETED":
        params.set("view", "completed");
        break;
    }
    const qs = params.toString();
    return qs ? `/student?${qs}` : "/student";
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = useCallback(
    (next: ViewState) => {
      router.push(viewStateToUrl(next));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

  const goBack = useCallback(() => {
    router.back();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router]);

  // ── Data loading ──────────────────────────────────────────────────────────

  // TanStack Query owns the four dashboard endpoints (see usePortalData).
  // `loadData` is kept as the refresh hook used after actions (enroll,
  // mentorship submit, certificate claim).
  const loadData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Greeting + onboarding gate — query is cached so navigating between portal
  // views never refetches /api/auth/me; the profile query only runs when
  // onboarding is complete (dependent query).
  const meQuery = useApiQuery<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      mustChangePassword: boolean;
      onboardingComplete: boolean;
    };
  }>(["auth", "me"], "/api/auth/me");

  const profileQuery = useApiQuery<{ user: { phone?: string } }>(
    ["student", "profile"],
    "/api/student/profile",
    undefined,
    { enabled: Boolean(meQuery.data?.user?.onboardingComplete) },
  );

  // needsProfile is cleared by the onboarding wizard's completion handler, so
  // it's local state synced from the dependent profile query.
  useEffect(() => {
    if (!profileQuery.data) return;
    if (!profileQuery.data.user?.phone?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeedsProfile(true);
    }
  }, [profileQuery.data]);

  // onboardingComplete is state (the wizard completion handler overrides it
  // client-side), so sync it from the cached /api/auth/me query here.
  useEffect(() => {
    const user = meQuery.data?.user;
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnboardingComplete(user.onboardingComplete);
  }, [meQuery.data]);

  // Name/email are pure display values — derive them from the cached query
  // during render instead of copying into state.
  const studentName = meQuery.data?.user?.name || "Demo Student";
  const studentEmail = meQuery.data?.user?.email || "demo@student.example.com";

  // Load batch on-demand when navigating to BATCH_DETAIL or RECORDING_PLAYER
  useEffect(() => {
    const batchId = currentView.params?.batchId;
    if (!batchId || batchCache[batchId]) return;
    setLoadingBatch(true);
    let active = true;
    fetchBatch(batchId)
      .then((b) => {
        if (!active) return;
        if (b) {
          setBatchCache((prev) => ({ ...prev, [batchId]: b }));
        } else {
          setError("Failed to load batch details");
        }
      })
      .catch(() => {
        if (active) setError("Failed to load batch details");
      })
      .finally(() => {
        if (active) setLoadingBatch(false);
      });
    return () => {
      active = false;
    };
  }, [currentView, batchCache]);

  // Fetch course detail on-demand (not in the summary) when opening COURSE_DETAIL
  useEffect(() => {
    const courseId = currentView.params?.courseId;
    if (!courseId || currentView.view !== "COURSE_DETAIL") return;
    if (courseDetailCache[courseId]) return;
    let active = true;
    api
      .get<{ course: CatalogueCourse }>(`/api/courses/${courseId}`)
      .then((res) => {
        if (!active || !res?.course) return;
        setCourseDetailCache((prev) => ({ ...prev, [courseId]: res.course }));
      })
      .catch(() => {
        // Leave missing — NotFoundView will render
      });
    return () => {
      active = false;
    };
  }, [currentView, courseDetailCache]);

  // ── Breadcrumbs ───────────────────────────────────────────────────────────

  const breadcrumbs = buildBreadcrumbs(
    currentView,
    navigate,
    data ? { ...data, batches: batchCache } : null,
    courseDetailCache,
  );

  // ── Mentorship submit handler ─────────────────────────────────────────────

  async function handleMentorshipSubmit(
    courseId: string,
    topic: string,
    preferredDate: string,
  ) {
    try {
      await api.post("/api/mentorship/tickets", {
        title: topic.length > 50 ? topic.slice(0, 50) + "..." : topic,
        description: topic,
        courseId: courseId || undefined,
        preferredDate: preferredDate || undefined,
      });
      toast.success("Mentorship request submitted.");
      await loadData();
    } catch {
      toast.error("Failed to submit mentorship request");
    }
  }

  // ── Enroll handler ────────────────────────────────────────────────────────

  async function handleEnroll(courseId: string) {
    try {
      await api.post("/api/courses/enroll", { courseId });
      toast.success("Enrollment request submitted! Wait for admin approval.");
      await loadData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit enrollment request",
      );
      throw err;
    }
  }

  function handleOnboardingComplete() {
    setOnboardingComplete(true);
  }

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <StudentPortalShell>
        <HomeSkeleton />
      </StudentPortalShell>
    );
  }

  if (!onboardingComplete || needsProfile) {
    return (
      <StudentPortalShell hideLogo={false}>
        <OnboardingWizardView
          onComplete={() => {
            handleOnboardingComplete();
            setNeedsProfile(false);
          }}
        />
      </StudentPortalShell>
    );
  }

  if (error && !data) {
    return (
      <StudentPortalShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <IconAlertCircle size={40} stroke={1.2} className="text-danger" />
          <p className="font-semibold text-foreground">Failed to load portal</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setError("");
              void refetch();
            }}
            className="btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      </StudentPortalShell>
    );
  }

  const portalData = data!;
  const showBack = currentView.view !== "HOME";

  // ── View renderer ─────────────────────────────────────────────────────────

  function renderView() {
    switch (currentView.view) {
      case "HOME": {
        const firstBatchId = portalData.enrolledCourses.find(
          (c) => c.status === "ACTIVE" && !!c.batchId,
        )?.batchId;
        return (
          <HomeView
            stats={portalData.stats}
            overdueAssignments={portalData.overdueAssignments}
            continueLearning={portalData.continueLearning}
            results={portalData.results}
            liveSessions={portalData.liveSessions}
            openTickets={portalData.mentorshipTickets}
            enrolledCourses={portalData.enrolledCourses}
            calendarEvents={portalData.calendarEvents}
            studentName={studentName}
            studentEmail={studentEmail}
            sectionApiAvailability={sectionApiAvailability}
            firstBatchId={firstBatchId}
            navigate={navigate}
            onMentorshipSubmit={handleMentorshipSubmit}
          />
        );
      }

      case "COURSES":
        return (
          <CoursesView
            courses={portalData.enrolledCourses}
            navigate={navigate}
          />
        );

      case "BATCH_DETAIL": {
        const batchId = currentView.params?.batchId ?? "";
        const batch = batchCache[batchId];
        if (loadingBatch || !batch) {
          return <LoadingView message="Loading batch details…" />;
        }
        return <BatchDetailView batch={batch} navigate={navigate} />;
      }

      case "RECORDING_PLAYER": {
        const batchId = currentView.params?.batchId ?? "";
        const recordingId = currentView.params?.sessionId ?? "";
        const batch = batchCache[batchId];
        if (loadingBatch || !batch) {
          return <LoadingView message="Loading recording…" />;
        }
        return (
          <RecordingPlayerView
            batch={batch}
            recordingId={recordingId}
            onSelectRecording={(nextRecordingId) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("recordingId", nextRecordingId);
              router.replace(`/student?${params.toString()}`);
            }}
          />
        );
      }

      case "LIVE_SESSIONS":
        return <LiveSessionsView sessions={portalData.liveSessions} />;

      case "CALENDAR":
        return <CalendarView events={portalData.calendarEvents} />;

      case "MENTORSHIP":
        return (
          <MentorshipView
            tickets={portalData.mentorshipTickets}
            enrolledCourses={portalData.enrolledCourses}
            onSubmit={handleMentorshipSubmit}
          />
        );

      case "CERTIFICATES":
        return (
          <CertificatesView onCertificateClaimed={loadData} />
        );

      case "COURSE_DETAIL": {
        const courseId = currentView.params?.courseId ?? "";
        const course = courseDetailCache[courseId];
        if (!course) return <LoadingView message="Loading course…" />;
        return <CourseDetailView course={course} onEnroll={handleEnroll} />;
      }

      case "COURSE_CONTENT": {
        const courseId = currentView.params?.courseId ?? "";
        if (!courseId) return <NotFoundView />;
        return (
          <CourseContentView
            courseId={courseId}
            navigate={navigate}
            goBack={goBack}
            initialQuizId={currentView.params?.quizId}
            initialAssignmentId={currentView.params?.assignmentId}
            initialLessonId={currentView.params?.lessonId}
            initialResourceUrl={currentView.params?.resourceUrl}
            initialResourceName={currentView.params?.resourceName}
          />
        );
      }

      case "ASSIGNMENT_OVERDUE":
        return (
          <AssignmentOverdueView
            assignments={portalData.overdueAssignments.filter(
              (a) => a.type === "ASSIGNMENT",
            )}
            navigate={navigate}
          />
        );

      case "QUIZ_OVERDUE":
        return (
          <QuizOverdueView
            quizzes={portalData.overdueAssignments.filter(
              (a) => a.type === "QUIZ",
            )}
            navigate={navigate}
          />
        );

      case "COURSE_COMPLETED":
        return <CourseCompletedView courses={portalData.enrolledCourses} />;

      default:
        return <NotFoundView />;
    }
  }

  return (
    <StudentPortalShell
      breadcrumbs={breadcrumbs}
      showBack={showBack}
      onBack={goBack}
      studentName={studentName}
      studentEmail={studentEmail}
      fullWidth={currentView.view === "COURSE_CONTENT"}
    >
      {/* View transition wrapper */}
      <div key={currentView.view} className="sp-view-enter">
        {!dismissedWarnings && portalData.failedSections.length > 0 && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <IconAlertCircle
                size={18}
                stroke={1.5}
                className="mt-0.5 shrink-0"
              />
              <span>
                Some sections couldn&apos;t load
                {portalData.failedSections.length > 1 ? "s" : ""}:{" "}
                {portalData.failedSections.join(", ")}. Showing what&apos;s
                available.
              </span>
            </div>
            <button
              onClick={() => setDismissedWarnings(true)}
              className="shrink-0 font-medium text-amber-700 hover:text-amber-900"
              aria-label="Dismiss warning"
            >
              Dismiss
            </button>
          </div>
        )}
        {renderView()}
      </div>
    </StudentPortalShell>
  );
}

// ─── Helper views ─────────────────────────────────────────────────────────────

function LoadingView({ message }: { message: string }) {
  return <Spinner size={32} label={message} className="min-h-[40vh]" />;
}

function NotFoundView() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <IconSearch size={40} stroke={1.2} className="text-muted" />
      <p className="font-semibold text-foreground">Page not found</p>
      <p className="text-sm text-muted-foreground">
        This view doesn&apos;t exist in the portal.
      </p>
    </div>
  );
}

// Skeleton that matches HOME layout — keeps perceived structure stable during load
function HomeSkeleton() {
  return (
    <div className="sp-view-enter space-y-6 motion-reduce:animate-none">
      {/* Greeting banner skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card-hover/50 p-5 sm:p-6">
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-card-hover" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-card-hover" />
            <div className="h-3 w-36 rounded bg-card-hover" />
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="space-y-1.5 text-right">
              <div className="h-3 w-16 rounded bg-card-hover" />
              <div className="h-5 w-12 rounded bg-card-hover" />
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="space-y-1.5 text-right">
              <div className="h-3 w-16 rounded bg-card-hover" />
              <div className="h-5 w-12 rounded bg-card-hover" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: stat tiles */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border/40 bg-card-hover/40 p-5"
            >
              <div className="mb-4 h-12 w-12 rounded-xl bg-card-hover" />
              <div className="mb-2 h-3 w-20 rounded bg-card-hover" />
              <div className="h-8 w-16 rounded bg-card-hover" />
            </div>
          ))}
        </div>

        {/* Right: schedule skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="rounded-2xl border border-border/40 bg-card-hover/40 p-5">
            <div className="mb-4 h-4 w-28 rounded bg-card-hover" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-card-hover" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-card-hover" />
                  <div className="h-3 w-24 rounded bg-card-hover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section tabs skeleton */}
      <div className="animate-pulse flex gap-1 border-b border-border pb-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-9 w-20 rounded bg-card-hover px-4 py-2.5" />
        ))}
      </div>
    </div>
  );
}
