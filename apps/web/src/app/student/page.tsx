"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconAlertCircle, IconSearch } from "@tabler/icons-react";
import StudentPortalShell, {
  type Breadcrumb,
} from "@/components/StudentPortalShell";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

// Types
import type { ViewState } from "./_types/student-portal";

// Mock data
import {
  MOCK_ENABLED,
  MOCK_STATS,
  MOCK_OVERDUE_ASSIGNMENTS,
  MOCK_ENROLLED_COURSES,
  MOCK_LIVE_SESSIONS,
  MOCK_CALENDAR_EVENTS,
  MOCK_MENTORSHIP_TICKETS,
  MOCK_CERTIFICATES,
  MOCK_CATALOGUE,
  MOCK_BATCHES,
  MOCK_CONTINUE_LEARNING,
  type DashboardStats,
  type OverdueAssignment,
  type EnrolledCourse,
  type Batch,
  type LiveSession,
  type CalendarEvent,
  type MentorshipTicket,
  type Certificate,
  type CatalogueCourse,
  type ContinueLearningItem,
} from "@/lib/student-mock-data";

// Views
import HomeView from "./_views/HomeView";
import CoursesView from "./_views/CoursesView";
import BatchDetailView from "./_views/BatchDetailView";
import RecordingPlayerView from "./_views/RecordingPlayerView";
import LiveSessionsView from "./_views/LiveSessionsView";
import CalendarView from "./_views/CalendarView";
import MentorshipView from "./_views/MentorshipView";
import CertificatesView from "./_views/CertificatesView";
import BrowseCatalogueView from "./_views/BrowseCatalogueView";
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
  if (MOCK_ENABLED) {
    return {
      stats: MOCK_STATS,
      overdueAssignments: MOCK_OVERDUE_ASSIGNMENTS,
      enrolledCourses: MOCK_ENROLLED_COURSES,
      batches: MOCK_BATCHES,
      liveSessions: MOCK_LIVE_SESSIONS,
      calendarEvents: MOCK_CALENDAR_EVENTS,
      mentorshipTickets: MOCK_MENTORSHIP_TICKETS,
      certificates: MOCK_CERTIFICATES,
      catalogue: MOCK_CATALOGUE,
      continueLearning: MOCK_CONTINUE_LEARNING,
    };
  }

  // Real API calls — run in parallel
  const [
    enrolled,
    sessionsData,
    calEvents,
    tickets,
    certs,
    catalogue,
    overdueAssignments,
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
      certificatesCount: (certs.certificates ?? []).filter((c) => c.earned)
        .length,
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
        notes: t.notes || undefined,
        instructor: t.mentor?.name || undefined,
        joinUrl: t.joinUrl || undefined,
      }),
    ),
    certificates: certs.certificates,
    catalogue: catalogue.courses,
    continueLearning: [], // loaded from /api/student/continue-learning
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
              const durationSeconds = 100;
              const percent = Math.min(
                100,
                Math.round((progress.watchedSeconds / durationSeconds) * 100),
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
  viewStack: ViewState[],
  data: PortalData | null,
  jumpTo: (index: number) => void,
): Breadcrumb[] {
  return viewStack.map((entry, index) => {
    const isLast = index === viewStack.length - 1;
    const label = (() => {
      switch (entry.view) {
        case "HOME":
          return "Home";
        case "COURSES":
          return "Courses";
        case "BATCH_DETAIL":
          return (
            data?.batches[entry.params?.batchId ?? ""]?.courseTitle ?? "Batch"
          );
        case "RECORDING_PLAYER":
          return "Recording";
        case "LIVE_SESSIONS":
          return "Live Sessions";
        case "CALENDAR":
          return "Calendar";
        case "MENTORSHIP":
          return "Mentorship";
        case "CERTIFICATES":
          return "Certificates";
        case "BROWSE_CATALOGUE":
          return "Browse Courses";
        case "COURSE_DETAIL":
          return (
            data?.catalogue.find((c) => c.id === entry.params?.courseId)
              ?.title ?? "Course"
          );
        case "COURSE_CONTENT":
          return (
            data?.enrolledCourses.find((c) => c.id === entry.params?.courseId)
              ?.title ?? "Course"
          );
        case "ASSIGNMENT_OVERDUE":
          return "Assignment Overdue";
        case "QUIZ_OVERDUE":
          return "Quiz Overdue";
        case "COURSE_COMPLETED":
          return "Courses Completed";
        default:
          return "—";
      }
    })();
    return {
      label,
      onClick: isLast ? undefined : () => jumpTo(index),
    };
  });
}

// ─── Main Portal Page ─────────────────────────────────────────────────────────

export default function StudentPortalPage() {
  return (
    <Suspense
      fallback={
        <StudentPortalShell>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">
              Loading your portal…
            </p>
          </div>
        </StudentPortalShell>
      }
    >
      <StudentPortalContent />
    </Suspense>
  );
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const [viewStack, setViewStack] = useState<ViewState[]>(() => {
    const viewParam = searchParams?.get("view");
    if (viewParam === "calendar") return [{ view: "CALENDAR" }];
    return [{ view: "HOME" }];
  });
  const [data, setData] = useState<PortalData | null>(null);
  const [batchCache, setBatchCache] = useState<Record<string, Batch>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("Demo Student");
  const [studentEmail, setStudentEmail] = useState("demo@student.example.com");

  const currentView = viewStack[viewStack.length - 1];

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

  // ── Navigation helpers ────────────────────────────────────────────────────

  const navigate = useCallback((next: ViewState) => {
    setViewStack((prev) => [...prev, next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goBack = useCallback(() => {
    setViewStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const jumpTo = useCallback((index: number) => {
    setViewStack((prev) => prev.slice(0, index + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
    let active = true;
    fetchBatch(batchId).then((b) => {
      if (active && b) {
        setBatchCache((prev) => ({ ...prev, [batchId]: b }));
      }
    });
    return () => {
      active = false;
    };
  }, [currentView, batchCache]);

  // ── Breadcrumbs ───────────────────────────────────────────────────────────

  const breadcrumbs = buildBreadcrumbs(
    viewStack,
    data ? { ...data, batches: batchCache } : null,
    jumpTo,
  );

  // ── Mentorship submit handler ─────────────────────────────────────────────

  async function handleMentorshipSubmit(
    courseId: string,
    topic: string,
    preferredDate: string,
  ) {
    setIsLoading(true);
    try {
      await api.post("/api/mentorship/tickets", {
        title: topic.length > 50 ? topic.slice(0, 50) + "..." : topic,
        description: topic,
        courseId,
        preferredDate: preferredDate || undefined,
      });
      await loadData();
    } catch {
      setError("Failed to submit mentorship request");
    } finally {
      setIsLoading(false);
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your portal...
          </p>
        </div>
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
            onClick={() => window.location.reload()}
            className="btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      </StudentPortalShell>
    );
  }

  const portalData = data!;
  const showBack = viewStack.length > 1;

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
            onSelectRecording={(nextRecordingId) =>
              setViewStack((prev) => [
                ...prev.slice(0, -1),
                {
                  view: "RECORDING_PLAYER",
                  params: { batchId, sessionId: nextRecordingId },
                },
              ])
            }
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

      case "BROWSE_CATALOGUE":
        return (
          <BrowseCatalogueView
            courses={portalData.catalogue}
            navigate={navigate}
          />
        );

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
          />
        );
      }

      case "ASSIGNMENT_OVERDUE":
        return (
          <AssignmentOverdueView
            assignments={portalData.overdueAssignments.filter(
              (a) => a.type === "ASSIGNMENT",
            )}
          />
        );

      case "QUIZ_OVERDUE":
        return (
          <QuizOverdueView
            quizzes={portalData.overdueAssignments.filter(
              (a) => a.type === "QUIZ",
            )}
          />
        );

      case "COURSE_COMPLETED":
        return <CourseCompletedView courses={portalData.enrolledCourses} />;

      default:
        return <NotFoundView />;
    }
  }

  const isCourseContent = currentView.view === "COURSE_CONTENT";

  return (
    <StudentPortalShell
      breadcrumbs={breadcrumbs}
      showBack={showBack}
      onBack={goBack}
      studentName={studentName}
      studentEmail={studentEmail}
      hideProfile={isCourseContent}
      hideLogo={isCourseContent}
      hideHeader={isCourseContent}
    >
      {/* View transition wrapper */}
      <div key={viewStack.map((v) => v.view).join("-")}>{renderView()}</div>
    </StudentPortalShell>
  );
}

// ─── Helper views ─────────────────────────────────────────────────────────────

function LoadingView({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
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
