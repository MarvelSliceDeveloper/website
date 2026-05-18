"use client";

import { useCallback, useEffect, useState } from "react";
import StudentPortalShell, { type Breadcrumb } from "@/components/StudentPortalShell";
import { api } from "@/lib/api";

// Types
import type { ViewState } from "./_types/student-portal";

// Mock data
import {
  MOCK_ENABLED,
  MOCK_STATS,
  MOCK_ENROLLED_COURSES,
  MOCK_BATCHES,
  MOCK_LIVE_SESSIONS,
  MOCK_CALENDAR_EVENTS,
  MOCK_MENTORSHIP_TICKETS,
  MOCK_CERTIFICATES,
  MOCK_CATALOGUE,
  MOCK_CONTINUE_LEARNING,
  type DashboardStats,
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

// ─── Portal data store ────────────────────────────────────────────────────────

interface PortalData {
  stats: DashboardStats;
  enrolledCourses: EnrolledCourse[];
  batches: Record<string, Batch>;
  liveSessions: LiveSession[];
  calendarEvents: CalendarEvent[];
  mentorshipTickets: MentorshipTicket[];
  certificates: Certificate[];
  catalogue: CatalogueCourse[];
  continueLearning: ContinueLearningItem[];
}

async function fetchPortalData(): Promise<PortalData> {
  if (MOCK_ENABLED) {
    // Simulate a small network delay for realism
    await new Promise((r) => setTimeout(r, 300));
    return {
      stats: MOCK_STATS,
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
  const [enrolled, sessions, calEvents, tickets, certs, catalogue] = await Promise.all([
    api.get<{ courses: EnrolledCourse[] }>("/api/courses/enrolled").catch(() => ({ courses: MOCK_ENROLLED_COURSES })),
    api.get<{ sessions: LiveSession[] }>("/api/sessions/live").catch(() => ({ sessions: MOCK_LIVE_SESSIONS })),
    api.get<{ events: CalendarEvent[] }>("/api/calendar/events").catch(() => ({ events: MOCK_CALENDAR_EVENTS })),
    api.get<{ tickets: MentorshipTicket[] }>("/api/mentorship/tickets/my").catch(() => ({ tickets: MOCK_MENTORSHIP_TICKETS })),
    api.get<{ certificates: Certificate[] }>("/api/certificates/my").catch(() => ({ certificates: MOCK_CERTIFICATES })),
    api.get<{ courses: CatalogueCourse[] }>("/api/courses/catalogue").catch(() => ({ courses: MOCK_CATALOGUE })),
  ]);

  return {
    stats: {
      enrolledCount: enrolled.courses.length,
      completedCount: enrolled.courses.filter((c) => c.status === "COMPLETED").length,
      liveTodayCount: sessions.sessions.filter((s) => s.status === "LIVE").length,
      certificatesCount: (certs.certificates ?? []).filter((c) => c.earned).length,
    },
    enrolledCourses: enrolled.courses,
    batches: MOCK_BATCHES, // batches loaded on demand
    liveSessions: sessions.sessions,
    calendarEvents: calEvents.events,
    mentorshipTickets: tickets.tickets,
    certificates: certs.certificates,
    catalogue: catalogue.courses,
    continueLearning: MOCK_CONTINUE_LEARNING, // from progress endpoint (use mock for now)
  };
}

async function fetchBatch(batchId: string): Promise<Batch | null> {
  if (MOCK_ENABLED) return MOCK_BATCHES[batchId] ?? null;
  try {
    const res = await api.get<{ batch: Batch }>(`/api/batches/${batchId}`);
    return res.batch;
  } catch {
    return MOCK_BATCHES[batchId] ?? null;
  }
}

// ─── Breadcrumb builder ───────────────────────────────────────────────────────

function buildBreadcrumbs(
  viewStack: ViewState[],
  data: PortalData | null,
  jumpTo: (index: number) => void
): Breadcrumb[] {
  return viewStack.map((entry, index) => {
    const isLast = index === viewStack.length - 1;
    const label = (() => {
      switch (entry.view) {
        case "HOME":             return "Home";
        case "COURSES":          return "Courses";
        case "BATCH_DETAIL":     return data?.batches[entry.params?.batchId ?? ""]?.courseTitle ?? "Batch";
        case "RECORDING_PLAYER": return "Recording";
        case "LIVE_SESSIONS":    return "Live Sessions";
        case "CALENDAR":         return "Calendar";
        case "MENTORSHIP":       return "Mentorship";
        case "CERTIFICATES":     return "Certificates";
        case "BROWSE_CATALOGUE": return "Browse Courses";
        case "COURSE_DETAIL":    return data?.catalogue.find((c) => c.id === entry.params?.courseId)?.title ?? "Course";
        default:                 return "—";
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
  const [viewStack, setViewStack] = useState<ViewState[]>([{ view: "HOME" }]);
  const [data, setData] = useState<PortalData | null>(null);
  const [batchCache, setBatchCache] = useState<Record<string, Batch>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const currentView = viewStack[viewStack.length - 1];

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

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchPortalData()
      .then((d) => {
        if (!active) return;
        setData(d);
        setBatchCache(d.batches);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load portal data");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Load batch on-demand when navigating to BATCH_DETAIL or RECORDING_PLAYER
  useEffect(() => {
    const batchId = currentView.params?.batchId;
    if (!batchId || batchCache[batchId]) return;
    let active = true;
    setLoadingBatch(true);
    fetchBatch(batchId).then((b) => {
      if (!active || !b) return;
      setBatchCache((prev) => ({ ...prev, [batchId]: b }));
    }).finally(() => {
      if (active) setLoadingBatch(false);
    });
    return () => { active = false; };
  }, [currentView, batchCache]);

  // ── Breadcrumbs ───────────────────────────────────────────────────────────

  const breadcrumbs = buildBreadcrumbs(viewStack, data ? { ...data, batches: batchCache } : null, jumpTo);

  // ── Mentorship submit handler ─────────────────────────────────────────────

  async function handleMentorshipSubmit(courseId: string, topic: string, preferredDate: string) {
    if (MOCK_ENABLED) {
      await new Promise((r) => setTimeout(r, 600)); // mock delay
      return;
    }
    await api.post("/api/mentorship/tickets", { courseId, topic, preferredDate });
  }

  // ── Enroll handler ────────────────────────────────────────────────────────

  async function handleEnroll(courseId: string) {
    if (MOCK_ENABLED) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }
    await api.post("/api/payments/create-order", { courseId });
  }

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <StudentPortalShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
          {MOCK_ENABLED && (
            <p className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning">
              🧪 Mock Mode — set NEXT_PUBLIC_USE_MOCK_DATA=false to use real API
            </p>
          )}
        </div>
      </StudentPortalShell>
    );
  }

  if (error && !data) {
    return (
      <StudentPortalShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="font-semibold text-foreground">Failed to load portal</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">
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
          (c) => c.status === "ACTIVE" && !!c.batchId
        )?.batchId;
        return (
          <HomeView
            stats={portalData.stats}
            continueLearning={portalData.continueLearning}
            liveSessionsToday={portalData.liveSessions}
            openTickets={portalData.mentorshipTickets}
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
        return <RecordingPlayerView batch={batch} recordingId={recordingId} />;
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
        return <BrowseCatalogueView courses={portalData.catalogue} navigate={navigate} />;

      case "COURSE_DETAIL": {
        const courseId = currentView.params?.courseId ?? "";
        const course = portalData.catalogue.find((c) => c.id === courseId);
        if (!course) return <NotFoundView />;
        return <CourseDetailView course={course} onEnroll={handleEnroll} />;
      }

      default:
        return <NotFoundView />;
    }
  }

  return (
    <StudentPortalShell
      breadcrumbs={breadcrumbs}
      showBack={showBack}
      onBack={goBack}
    >
      {/* Mock mode banner */}
      {MOCK_ENABLED && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          <span>🧪 <strong>Mock Mode</strong> — displaying sample data. Set <code>NEXT_PUBLIC_USE_MOCK_DATA=false</code> in .env.local to use real API.</span>
        </div>
      )}

      {/* View transition wrapper */}
      <div key={viewStack.map((v) => v.view).join("-")}>
        {renderView()}
      </div>
    </StudentPortalShell>
  );
}

// ─── Helper views ─────────────────────────────────────────────────────────────

function LoadingView({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-4xl">🔍</span>
      <p className="font-semibold text-foreground">Page not found</p>
      <p className="text-sm text-muted-foreground">This view doesn&apos;t exist in the portal.</p>
    </div>
  );
}
