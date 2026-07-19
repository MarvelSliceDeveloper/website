"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconAlertCircle, IconSearch } from "@tabler/icons-react";
import StudentPortalShell, {
  type Breadcrumb,
} from "@/components/StudentPortalShell";
import { Spinner } from "@/components/shared/Spinner";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

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
  Certificate,
  CatalogueCourse,
  ContinueLearningItem,
} from "@/lib/api-types";

// Views
import HomeView from "./_views/HomeView";
import CoursesView from "./_views/CoursesView";
import BatchDetailView from "./_views/BatchDetailView";
import RecordingPlayerView from "./_views/RecordingPlayerView";
import LiveSessionsView from "./_views/LiveSessionsView";
import CalendarView from "./_views/CalendarView";
import MentorshipView from "./_views/MentorshipView";
import CertificatesView from "./_views/CertificatesView";
import CourseDetailView from "./_views/CourseDetailView";
import CourseContentView from "./_views/CourseContentView";
import AssignmentOverdueView from "./_views/AssignmentOverdueView";
import QuizOverdueView from "./_views/QuizOverdueView";
import CourseCompletedView from "./_views/CourseCompletedView";

// ─── Portal data store ────────────────────────────────────────────────────────

interface PortalData {
  stats: DashboardStats;
  overdueAssignments: OverdueAssignment[];
  enrolledCourses: EnrolledCourse[];
  batches: Record<string, Batch>;
  liveSessions: LiveSession[];
  calendarEvents: CalendarEvent[];
  mentorshipTickets: MentorshipTicket[];
  certificates: Certificate[];
  catalogue: CatalogueCourse[];
  continueLearning: ContinueLearningItem[];
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
  scheduledAt: string;
  scheduledEndAt: string;
  joinUrl: string;
  recording: { id: string } | null;
  batch?: {
    name: string;
    course?: { title: string };
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
  endDateTime?: string,
): "LIVE" | "UPCOMING" | "PAST" {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = endDateTime
    ? new Date(endDateTime).getTime()
    : start + 60 * 60 * 1000; // fallback to 1hr

  if (now >= start && now < end) return "LIVE";
  if (now >= end) return "PAST";
  return "UPCOMING";
}

async function fetchPortalData(): Promise<PortalData> {
  // Real API calls — run in parallel
  const [
    enrolled,
    sessionsData,
    calEvents,
    tickets,
    certs,
    catalogue,
    overdueAssignments,
    continueLearningData,
  ] = await Promise.all([
    api
      .get<{ courses: EnrolledCourse[] }>("/api/courses/enrolled")
      .catch(() => ({ courses: [] })),
    api
      .get<{ sessions: ApiSessionRecord[] }>("/api/sessions")
      .catch(() => ({ sessions: [] })),
    api
      .get<{ events: CalendarEvent[] }>("/api/calendar/events")
      .catch(() => ({ events: [] })),
    api
      .get<{ tickets: ApiMentorshipTicket[] }>("/api/mentorship/tickets/my")
      .catch(() => ({ tickets: [] })),
    api
      .get<{ certificates: Certificate[] }>("/api/certificates/my")
      .catch(() => ({ certificates: [] })),
    api
      .get<{ courses: CatalogueCourse[] }>("/api/courses/catalogue")
      .catch(() => ({ courses: [] })),
    api
      .get<{ items: OverdueAssignment[] }>("/api/student/assignments/overdue")
      .catch(() => ({ items: [] })),
    api
      .get<{ items: ContinueLearningItem[] }>("/api/student/continue-learning")
      .catch(() => ({ items: [] })),
  ]);

  // AFTER ✅ — endDateTime passed through, status computed dynamically
  const mappedSessions: LiveSession[] = (sessionsData.sessions || []).map(
    (s: ApiSessionRecord) => ({
      id: s.id,
      title:
        s.title ||
        (s.module
          ? `Module ${s.module.title} — ${s.batch?.course?.title}`
          : `Live Session — ${s.batch?.course?.title}`),
      courseTitle: s.batch?.course?.title || "Unknown Course",
      instructor: s.batch?.instructor?.name || "TBD",
      batchLabel: s.batch?.name || "—",
      status: computeSessionStatus(s.scheduledAt, s.scheduledEndAt),
      scheduledAt: s.scheduledAt,
      endDateTime: s.scheduledEndAt,
      joinUrl: s.joinUrl,
      recordingSyncingIn:
        s.scheduledEndAt &&
        new Date(s.scheduledEndAt) <= new Date() &&
        !s.recording
          ? "~20 min"
          : undefined,
    }),
  );

  return {
    stats: {
      enrolledCount: enrolled.courses.length,
      completedCount: enrolled.courses.filter((c) => c.status === "COMPLETED")
        .length,
      liveTodayCount: mappedSessions.filter((s) => s.status === "LIVE").length,
      certificatesCount: (certs.certificates ?? []).length,
    },
    overdueAssignments: overdueAssignments.items,
    enrolledCourses: enrolled.courses,
    batches: {}, // batches loaded on demand via API
    liveSessions: mappedSessions,
    calendarEvents: calEvents.events,
    mentorshipTickets: (tickets.tickets || []).map(
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
    certificates: certs.certificates,
    catalogue: catalogue.courses,
    continueLearning: continueLearningData.items,
  };
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
            data?.catalogue.find((c) => c.id === currentView.params?.courseId)
              ?.title ?? "Course",
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
  const [data, setData] = useState<PortalData | null>(null);
  const [batchCache, setBatchCache] = useState<Record<string, Batch>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("Demo Student");
  const [studentEmail, setStudentEmail] = useState("demo@student.example.com");

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

  const loadData = useCallback(async () => {
    const d = await fetchPortalData();
    setData(d);
    setBatchCache(d.batches);
  }, []);

  useEffect(() => {
    let active = true;
    fetchPortalData()
      .then((d) => {
        if (!active) return;
        setData(d);
        setBatchCache(d.batches);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Failed to load portal data",
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load current user profile for greeting
  useEffect(() => {
    let active = true;
    api
      .get<{ user: { id: string; name: string; email: string; role: string } }>(
        "/api/auth/me",
      )
      .then((res) => {
        if (!active || !res || !res.user) return;
        setStudentName(res.user.name || "");
        setStudentEmail(res.user.email || "");
      })
      .catch(() => {
        // ignore — keep demo values if unauthenticated
      });
    return () => {
      active = false;
    };
  }, []);

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

  // ── Breadcrumbs ───────────────────────────────────────────────────────────

  const breadcrumbs = buildBreadcrumbs(
    currentView,
    navigate,
    data ? { ...data, batches: batchCache } : null,
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
        courseId,
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

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <StudentPortalShell>
        <HomeSkeleton />
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
              setIsLoading(true);
              loadData().finally(() => setIsLoading(false));
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
            liveSessionsToday={portalData.liveSessions}
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
        return <CertificatesView certificates={portalData.certificates} />;

      case "COURSE_DETAIL": {
        const courseId = currentView.params?.courseId ?? "";
        const course = portalData.catalogue.find((c) => c.id === courseId);
        if (!course) return <NotFoundView />;
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
