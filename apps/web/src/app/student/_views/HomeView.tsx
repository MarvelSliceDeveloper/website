"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconCertificate,
  IconHeart,
  IconPlayerPlay,
  IconVideo,
  IconClock,
  IconHelp,
  IconMessage,
  IconPlus,
  IconNotebook,
  IconPencil,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { timeAgo } from "@/lib/time-ago";
import type { ViewState } from "../_types/student-portal";
import type {
  DashboardStats,
  OverdueAssignment,
  ContinueLearningItem,
  LiveSession,
  MentorshipTicket,
  EnrolledCourse,
  CalendarEvent,
} from "@/lib/student-mock-data";
import StudentSectionTabs, {
  type StudentSectionTab,
} from "@/components/student/StudentSectionTabs";
import StudentStatTiles from "@/components/student/StudentStatTiles";

interface HomeViewProps {
  stats: DashboardStats;
  overdueAssignments: OverdueAssignment[];
  continueLearning: ContinueLearningItem[];
  liveSessionsToday: LiveSession[];
  openTickets: MentorshipTicket[];
  enrolledCourses?: EnrolledCourse[];
  calendarEvents?: CalendarEvent[];
  studentName?: string;
  studentEmail?: string;
  sectionApiAvailability: {
    courses: boolean;
    calendar: boolean;
    sessions: boolean;
    notifications: boolean;
    messages: boolean;
    support: boolean;
    notes: boolean;
  };
  firstBatchId?: string; // for the Recordings shortcut
  navigate: (v: ViewState) => void;
}

const SECTION_CARDS = [
  {
    id: "courses" as const,
    icon: <IconBook size={22} className="text-primary" />,
    title: "My Courses",
    view: { view: "COURSES" as const },
    gradient: "from-primary/20 to-violet-500/10",
    border: "hover:border-primary/30",
  },
  {
    id: "live" as const,
    icon: <IconVideo size={22} className="text-danger" />,
    title: "Live Sessions",
    view: { view: "LIVE_SESSIONS" as const },
    gradient: "from-danger/20 to-red-400/10",
    border: "hover:border-danger/30",
    isLive: true,
  },
  {
    id: "calendar" as const,
    icon: <IconCalendar size={22} className="text-accent" />,
    title: "My Calendar",
    view: { view: "CALENDAR" as const },
    gradient: "from-accent/20 to-cyan-400/10",
    border: "hover:border-accent/30",
  },
  {
    id: "certificates" as const,
    icon: <IconCertificate size={22} className="text-warning" />,
    title: "My Certificates",
    view: { view: "CERTIFICATES" as const },
    gradient: "from-warning/20 to-amber-400/10",
    border: "hover:border-warning/30",
  },
  {
    id: "mentorship" as const,
    icon: <IconHeart size={22} className="text-success" />,
    title: "1-on-1 Mentorship",
    view: { view: "MENTORSHIP" as const },
    gradient: "from-success/20 to-emerald-400/10",
    border: "hover:border-success/30",
  },
  {
    id: "recordings" as const,
    icon: <IconPlayerPlay size={22} className="text-violet-400" />,
    title: "Recordings",
    viewFn: (firstBatchId?: string) =>
      firstBatchId
        ? { view: "BATCH_DETAIL" as const, params: { batchId: firstBatchId } }
        : { view: "COURSES" as const },
    gradient: "from-violet-500/20 to-purple-400/10",
    border: "hover:border-violet-400/30",
  },
];

const CARD_ICON_STYLES: Record<string, string> = {
  courses: "bg-primary/15 text-primary border-primary/25",
  live: "bg-danger/15 text-danger border-danger/25",
  calendar: "bg-accent/15 text-accent border-accent/25",
  certificates: "bg-warning/15 text-warning border-warning/25",
  mentorship: "bg-success/15 text-success border-success/25",
  recordings: "bg-violet-500/15 text-violet-400 border-violet-500/25",
};

export default function HomeView({
  stats,
  overdueAssignments,
  continueLearning,
  liveSessionsToday,
  openTickets,
  enrolledCourses = [],
  calendarEvents = [],
  studentName = "Student",
  sectionApiAvailability,
  firstBatchId,
  navigate,
}: HomeViewProps) {
  const router = useRouter();
  const [activeInlineTab, setActiveInlineTab] = useState<
    "courses" | "calendar" | "sessions" | "support" | "notes"
  >("courses");
  const [supportTickets, setSupportTickets] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      createdAt: string;
      _count?: { messages: number };
    }>
  >([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDesc, setSupportDesc] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const SUPPORT_STATUS_STYLES: Record<string, string> = {
    OPEN: "border-warning/30 bg-warning/10 text-warning",
    IN_PROGRESS: "border-accent/30 bg-accent/10 text-accent",
    RESOLVED: "border-success/30 bg-success/10 text-success",
    CLOSED: "border-muted/30 bg-muted/10 text-muted",
  };

  const fetchSupportTickets = useCallback(async () => {
    setSupportLoading(true);
    try {
      const data = await api.get<{
        tickets: Array<{
          id: string;
          title: string;
          description: string;
          status: string;
          createdAt: string;
          _count?: { messages: number };
        }>;
      }>("/api/tickets?type=SUPPORT");
      setSupportTickets(data.tickets || []);
    } catch {
      /* ignore */
    } finally {
      setSupportLoading(false);
    }
  }, []);

  async function createSupportTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!supportTitle.trim() || !supportDesc.trim()) return;
    setSupportSubmitting(true);
    try {
      await api.post("/api/tickets", {
        type: "SUPPORT",
        title: supportTitle,
        description: supportDesc,
      });
      toast.success("Support ticket created");
      setShowSupportForm(false);
      setSupportTitle("");
      setSupportDesc("");
      fetchSupportTickets();
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSupportSubmitting(false);
    }
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const liveCount = liveSessionsToday.filter((s) => s.status === "LIVE").length;
  const openTicketCount = openTickets.filter(
    (t) => t.status === "OPEN" || t.status === "ASSIGNED",
  ).length;

  const pendingAssignments = overdueAssignments.filter(
    (item) => item.status === "PENDING" && item.type === "ASSIGNMENT",
  ).length;
  const pendingQuizzes = overdueAssignments.filter(
    (item) => item.status === "PENDING" && item.type === "QUIZ",
  ).length;

  const statTiles = [
    {
      id: "enrolled",
      label: "Courses To Do",
      value: stats.enrolledCount,
      icon: <IconBook size={20} />,
      gradient: "bg-gradient-to-br from-primary/20 to-violet-500/10",
      onClick: () => navigate({ view: "COURSES" }),
      iconColor: "primary",
      trend: { value: 0, label: "this month" },
    },
    {
      id: "assignment-overdue",
      label: "Assignment Overdue",
      value: pendingAssignments,
      icon: <IconPencil size={20} />,
      gradient: "bg-gradient-to-br from-danger/20 to-red-400/10",
      onClick: () => navigate({ view: "ASSIGNMENT_OVERDUE" }),
      iconColor: "danger",
      liveBadge: pendingAssignments > 0 ? "Overdue" : undefined,
    },
    {
      id: "quiz-overdue",
      label: "Quiz Overdue",
      value: pendingQuizzes,
      icon: <IconClock size={20} />,
      gradient: "bg-gradient-to-br from-accent/20 to-cyan-400/10",
      onClick: () => navigate({ view: "QUIZ_OVERDUE" }),
      iconColor: "accent",
      liveBadge: pendingQuizzes > 0 ? "Overdue" : undefined,
    },
    {
      id: "completed",
      label: "Completed Course",
      value: stats.completedCount,
      icon: <IconCertificate size={20} />,
      gradient: "bg-gradient-to-br from-success/20 to-emerald-400/10",
      onClick: () => navigate({ view: "COURSE_COMPLETED" }),
      iconColor: "success",
      trend: { value: stats.completedCount > 0 ? 5 : 0, label: "this month" },
    },
  ];

  const sectionTabs: StudentSectionTab[] = [
    {
      key: "courses",
      label: "My Courses",
      enabled: sectionApiAvailability.courses,
    },
    {
      key: "calendar",
      label: "Calendar",
      enabled: sectionApiAvailability.calendar,
    },
    {
      key: "sessions",
      label: "My Sessions",
      enabled: sectionApiAvailability.sessions,
    },
    {
      key: "notifications",
      label: "Notifications",
      enabled: sectionApiAvailability.notifications,
    },
    {
      key: "messages",
      label: "Messages",
      enabled: sectionApiAvailability.messages,
    },
    {
      key: "support",
      label: "Support",
      enabled: sectionApiAvailability.support,
    },
    { key: "notes", label: "Notes", enabled: sectionApiAvailability.notes },
  ];

  function handleSectionTabChange(key: string) {
    if (
      key === "courses" ||
      key === "calendar" ||
      key === "sessions" ||
      key === "support" ||
      key === "notes"
    ) {
      setActiveInlineTab(key as typeof activeInlineTab);
      if (key === "support") fetchSupportTickets();
    }
  }

  const overdueTotal = pendingAssignments + pendingQuizzes;

  return (
    <div className="sp-view-enter space-y-6 motion-reduce:animate-none">
      {/* ── Greeting Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/15 via-primary/5 to-accent/10 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,125,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-xl font-bold text-white shadow-lg shadow-primary/30">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {greeting}, {studentName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{dateStr}</p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Streak
              </p>
              <p className="text-lg font-bold text-warning">5 days</p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                This Week
              </p>
              <p className="text-lg font-bold text-success">{liveCount} live</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column: Stats + Schedule ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="min-w-0">
          <StudentStatTiles tiles={statTiles} />
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          {/* ── Today's Schedule ───────────────────────────────────────── */}
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="sp-eyebrow">{`Today's Schedule`}</p>
              <button
                onClick={() => navigate({ view: "CALENDAR" })}
                className="text-[11px] font-medium text-primary hover:text-primary-hover transition-colors"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-border/60">
              {liveSessionsToday.filter((s) => s.status !== "PAST").length ===
              0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  No events scheduled today
                </p>
              ) : (
                <>
                  {liveSessionsToday
                    .filter((s) => s.status !== "PAST")
                    .slice(0, 4)
                    .map((s) => {
                      const start = new Date(s.scheduledAt);
                      const end = new Date(s.endDateTime);
                      const timeStr = `${start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                s.status === "LIVE"
                                  ? "bg-danger/15 text-danger"
                                  : "bg-accent/10 text-accent"
                              }`}
                            >
                              {s.status === "LIVE" ? (
                                <span className="live-pulse h-2.5 w-2.5 rounded-full bg-current" />
                              ) : (
                                <IconClock size={16} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {s.title}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                                <IconClock size={11} />
                                {timeStr}
                              </span>
                            </div>
                          </div>
                          {s.status === "LIVE" && s.joinUrl && (
                            <a
                              href={s.joinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-primary shrink-0 ml-2 px-3 py-1 text-xs"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          </div>

          {/* ── Overdue Summary ─────────────────────────────────────────── */}
          <div className="glass-card p-5 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <p className="sp-eyebrow">Overdue</p>
              {overdueTotal > 0 && (
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                  {overdueTotal} items
                </span>
              )}
            </div>
            <div className="space-y-3">
              {overdueTotal === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  All caught up! No overdue items.
                </p>
              ) : (
                <>
                  <button
                    onClick={() => navigate({ view: "ASSIGNMENT_OVERDUE" })}
                    className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 text-left transition-all hover:bg-card-hover hover:border-danger/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
                      <IconPencil size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {pendingAssignments} Assignment
                        {pendingAssignments !== 1 ? "s" : ""} Overdue
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to view & submit
                      </p>
                    </div>
                    <IconArrowRight size={14} className="shrink-0 text-muted" />
                  </button>
                  <button
                    onClick={() => navigate({ view: "QUIZ_OVERDUE" })}
                    className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 text-left transition-all hover:bg-card-hover hover:border-accent/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <IconClock size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {pendingQuizzes} Quiz{pendingQuizzes !== 1 ? "zes" : ""}{" "}
                        Overdue
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to attempt
                      </p>
                    </div>
                    <IconArrowRight size={14} className="shrink-0 text-muted" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Tabs ──────────────────────────────────────────────────── */}
      <StudentSectionTabs
        tabs={sectionTabs}
        activeKey={activeInlineTab}
        onChange={handleSectionTabChange}
      />

      {/* ── Inline Content Display ────────────────────────────────────────── */}
      <div className="glass-card p-5">
        {activeInlineTab === "courses" && (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="sp-eyebrow">My Courses</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your enrolled courses
              </p>
            </div>
            {enrolledCourses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No courses enrolled yet
              </p>
            ) : (
              <div className="space-y-2">
                {enrolledCourses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-3 hover:border-border transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground text-sm">
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {course.instructor}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                        course.status === "ACTIVE"
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-primary/20 text-primary border border-primary/30"
                      }`}
                    >
                      {course.status === "ACTIVE" ? "Active" : "Completed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate({ view: "COURSES" })}
              className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View All Courses →
            </button>
          </div>
        )}

        {activeInlineTab === "calendar" && (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="sp-eyebrow">Calendar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your upcoming events
              </p>
            </div>
            {calendarEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-2">
                {calendarEvents.slice(0, 5).map((event) => {
                  const nowTs = now.getTime();
                  const start = new Date(event.startAt).getTime();
                  const end = new Date(event.endAt).getTime();
                  const isLive = nowTs >= start && nowTs < end;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isLive ? (
                          <span className="live-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                        ) : (
                          <IconClock
                            size={16}
                            className="text-accent shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground text-sm">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isLive
                              ? "Live Now"
                              : new Date(event.startAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {event.joinUrl && (
                        <a
                          href={event.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 ml-2 px-3 py-1 text-xs rounded-lg font-medium ${
                            isLive
                              ? "bg-danger text-white hover:bg-danger/90"
                              : "border border-border bg-background text-foreground hover:bg-card-hover"
                          }`}
                        >
                          {isLive ? "Join" : "Link"}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate({ view: "CALENDAR" })}
              className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View Full Calendar →
            </button>
          </div>
        )}

        {activeInlineTab === "sessions" && (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="sp-eyebrow">My Sessions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Live and upcoming sessions
              </p>
            </div>
            {liveSessionsToday.filter((s) => s.status !== "PAST").length ===
            0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No live sessions today
              </p>
            ) : (
              <div className="space-y-2">
                {liveSessionsToday
                  .filter((s) => s.status !== "PAST")
                  .slice(0, 5)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {session.status === "LIVE" ? (
                          <span className="live-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                        ) : (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent/60" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground text-sm">
                            {session.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {session.courseTitle}
                          </p>
                        </div>
                      </div>
                      {session.status === "LIVE" && session.joinUrl && (
                        <a
                          href={session.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary px-3 py-1 text-xs shrink-0 ml-2"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
            <button
              onClick={() => navigate({ view: "LIVE_SESSIONS" })}
              className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View All Sessions →
            </button>
          </div>
        )}

        {activeInlineTab === "support" && (
          <div className="space-y-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="sp-eyebrow">Support</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Report issues or ask questions
                </p>
              </div>
              <button
                onClick={() => setShowSupportForm((v) => !v)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <IconPlus size={14} />{" "}
                {showSupportForm ? "Cancel" : "New Ticket"}
              </button>
            </div>

            {showSupportForm && (
              <form
                onSubmit={createSupportTicket}
                className="rounded-xl border border-border/60 bg-card p-4 space-y-3 mb-4"
              >
                <p className="font-semibold text-sm text-foreground">
                  Create Support Ticket
                </p>
                <input
                  type="text"
                  value={supportTitle}
                  onChange={(e) => setSupportTitle(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="field w-full text-sm"
                  required
                  minLength={3}
                />
                <textarea
                  value={supportDesc}
                  onChange={(e) => setSupportDesc(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={3}
                  className="field w-full resize-none text-sm"
                  required
                  minLength={10}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSupportForm(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="btn-primary text-xs"
                  >
                    {supportSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}

            {supportLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-card-hover border border-border"
                  />
                ))}
              </div>
            ) : supportTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No support tickets yet
              </p>
            ) : (
              <div className="space-y-2">
                {supportTickets.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/student/support`)}
                    className="w-full flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-3 text-left hover:bg-card-hover transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <IconHelp size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {t.title}
                        </p>
                        <span
                          className={`shrink-0 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${SUPPORT_STATUS_STYLES[t.status] || ""}`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted">
                        <span>{timeAgo(t.createdAt)}</span>
                        {t._count && (
                          <span className="flex items-center gap-1">
                            <IconMessage size={11} /> {t._count.messages}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push("/student/support")}
              className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View All Tickets →
            </button>
          </div>
        )}

        {activeInlineTab === "notes" && (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="sp-eyebrow">Notes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your study notes
              </p>
            </div>
            <a
              href="/student/notes"
              className="inline-flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4 hover:bg-card-hover transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <IconNotebook size={20} />
              </div>
              <span className="text-sm font-medium text-foreground">
                Go to Notes &rarr;
              </span>
            </a>
          </div>
        )}
      </div>
      {/* ── Quick Access Cards ───────────────────────────────────────────── */}
      <div>
        <p className="sp-eyebrow mb-3">Quick Access</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_CARDS.map((card, i) => {
            const iconStyle =
              CARD_ICON_STYLES[card.id] || CARD_ICON_STYLES.courses;
            return (
              <button
                key={card.id}
                onClick={() => {
                  const view =
                    "viewFn" in card
                      ? (card as { viewFn: (id?: string) => ViewState }).viewFn(
                          firstBatchId,
                        )
                      : (card as { view: ViewState }).view;
                  navigate(view);
                }}
                className={`glass-card group relative flex items-center gap-4 overflow-hidden p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${card.border}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm ${iconStyle}`}
                >
                  <div className="[&>svg]:size-[22px]">{card.icon}</div>
                </div>
                <div className="relative min-w-0 flex-1">
                  {card.isLive && liveCount > 0 && (
                    <span className="mb-1 flex items-center gap-1.5">
                      <span className="live-pulse h-2 w-2 rounded-full bg-danger" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-danger">
                        {liveCount} Live
                      </span>
                    </span>
                  )}
                  <p className="truncate font-semibold text-foreground">
                    {card.title}
                  </p>
                  {card.id === "mentorship" && openTicketCount > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {openTicketCount} open request
                      {openTicketCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <IconArrowRight
                  size={15}
                  className="relative ml-auto shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Continue Learning ─────────────────────────────────────────────── */}
      {continueLearning.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="sp-eyebrow">Continue Learning</p>
            <span className="text-xs text-muted-foreground">
              {continueLearning.length} in progress
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {continueLearning.map((item) => {
              const pct = item.watchedPercent;
              const size = 44;
              const stroke = 3;
              const r = (size - stroke) / 2;
              const circumference = 2 * Math.PI * r;
              const offset = circumference - (pct / 100) * circumference;
              return (
                <button
                  key={item.recordingId}
                  onClick={() =>
                    navigate({
                      view: "RECORDING_PLAYER",
                      params: {
                        batchId: item.batchId,
                        sessionId: item.recordingId,
                      },
                    })
                  }
                  className="glass-card group flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                    <svg
                      width={size}
                      height={size}
                      className="absolute inset-0"
                    >
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth={stroke}
                      />
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="relative text-[11px] font-bold text-primary">
                      {pct}%
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.courseTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{item.dayLabel}</p>
                  </div>
                  <span className="btn-primary shrink-0 px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    Resume
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Browse Courses CTA ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/15 via-primary/5 to-violet-500/10 p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 translate-y-4 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="sp-eyebrow">Course Catalogue</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              Expand your skills
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              New batches starting every month. Find the perfect course to
              accelerate your career.
            </p>
          </div>
          <button
            onClick={() => navigate({ view: "BROWSE_CATALOGUE" })}
            className="btn-primary shrink-0 gap-2"
          >
            Browse Courses
            <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
