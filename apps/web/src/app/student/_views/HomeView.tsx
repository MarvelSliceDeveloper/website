"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconBook,
  IconCalendar,
  IconCertificate,
  IconHeart,
  IconPlayerPlay,
  IconVideo,
  IconClock,
  IconPencil,
  IconSparkles,
  IconSearch,
  IconMail,
  IconUser,
  IconPhone,
  IconBell,
  IconNotes,
  IconHelp,
  IconUsers,
} from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type {
  DashboardStats,
  OverdueAssignment,
  ContinueLearningItem,
  LiveSession,
  MentorshipTicket,
  EnrolledCourse,
  CalendarEvent,
} from "@/lib/api-types";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import StudentStatTiles from "@/components/student/StudentStatTiles";
import LiveSessionBanner from "@/components/LiveSessionBanner";

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
  firstBatchId?: string;
  navigate: (v: ViewState) => void;
  onMentorshipSubmit?: (
    courseId: string,
    topic: string,
    preferredDate: string,
  ) => Promise<void>;
}

export default function HomeView({
  stats,
  overdueAssignments,
  continueLearning = [],
  liveSessionsToday,
  openTickets,
  enrolledCourses = [],
  calendarEvents = [],
  studentName = "Student",
  firstBatchId,
  navigate,
  onMentorshipSubmit,
}: HomeViewProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "courses" | "calendar" | "sessions" | "notifications" | "support"
  >("courses");
  const [innerTab, setInnerTab] = useState<"my_courses" | "results">(
    "my_courses",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralPhone, setReferralPhone] = useState("");

  const [mentorQueryType, setMentorQueryType] = useState<
    "course" | "generic" | "career" | "other"
  >("course");
  const [mentorCourseId, setMentorCourseId] = useState(
    enrolledCourses[0]?.id ?? "",
  );
  const [mentorOtherQuery, setMentorOtherQuery] = useState("");
  const [mentorTopic, setMentorTopic] = useState("");
  const [mentorDateTime, setMentorDateTime] = useState("");
  const [mentorSubmitting, setMentorSubmitting] = useState(false);

  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

  const liveSessions = liveSessionsToday.filter((s) => s.status === "LIVE");
  const liveCount = liveSessions.length;
  const openTicketCount = openTickets.filter(
    (t) => t.status === "OPEN" || t.status === "ASSIGNED",
  ).length;

  const pendingAssignments = overdueAssignments.filter(
    (item) => item.status === "PENDING" && item.type === "ASSIGNMENT",
  ).length;
  const pendingQuizzes = overdueAssignments.filter(
    (item) =>
      item.status === "PENDING" &&
      item.type === "QUIZ" &&
      item.dueDate &&
      new Date(item.dueDate).getTime() < Date.now(),
  ).length;
  const overdueTotal = pendingAssignments + pendingQuizzes;

  // Option C color scheme: Blue=learning, Orange=urgent, Grey=neutral
  const statTiles = [
    {
      id: "enrolled",
      label: "Courses To Do",
      value:
        enrolledCourses.filter((c) => c.status !== "COMPLETED").length ||
        stats.enrolledCount,
      icon: <IconBook size={20} />,
      onClick: () => navigate({ view: "COURSES" }),
      iconColor: "blue" as const,  // Blue = learning/content
      trend: { value: 0, label: "this month" },
    },
    {
      id: "assignment-overdue",
      label: "Assignment Overdue",
      value: pendingAssignments,
      icon: <IconPencil size={20} />,
      onClick: () => navigate({ view: "ASSIGNMENT_OVERDUE" }),
      iconColor: "orange" as const,  // Orange = urgent/time-sensitive
      liveBadge: pendingAssignments > 0 ? "Overdue" : undefined,
    },
    {
      id: "quiz-overdue",
      label: "Quiz Overdue",
      value: pendingQuizzes,
      icon: <IconClock size={20} />,
      onClick: () => navigate({ view: "QUIZ_OVERDUE" }),
      iconColor: "orange" as const,  // Orange = urgent/time-sensitive
      liveBadge: pendingQuizzes > 0 ? "Overdue" : undefined,
    },
    {
      id: "completed",
      label: "Completed Course",
      value:
        enrolledCourses.filter((c) => c.status === "COMPLETED").length ||
        stats.completedCount,
      icon: <IconCertificate size={20} />,
      onClick: () => navigate({ view: "COURSE_COMPLETED" }),
      iconColor: "green" as const,
      trend: { value: stats.completedCount > 0 ? 5 : 0, label: "this month" },
    },
  ];

  // Filtering courses by search term
  const filteredActiveCourses = enrolledCourses
    .filter((c) => c.status !== "COMPLETED")
    .filter((c) => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredCompletedCourses = enrolledCourses
    .filter((c) => c.status === "COMPLETED")
    .filter((c) => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  function handleReferralSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(`Thank you! Referral for ${referralName} submitted successfully.`);
    setReferralName("");
    setReferralEmail("");
    setReferralPhone("");
  }

  async function handleJoinSession(session: LiveSession) {
    if (!session.joinUrl) return;
    setJoiningSessionId(session.id);
    try {
      await api.post(`/api/attendance/${session.id}/join`);
    } catch (err) {
      console.error("Failed to log attendance:", err);
    } finally {
      setJoiningSessionId(null);
      window.open(session.joinUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="sp-view-enter space-y-6 motion-reduce:animate-none">
      {/* ── Live / Upcoming Session Banner ───────────────────────────────── */}
      {liveSessionsToday
        .filter(
          (s) =>
            s.status === "LIVE" ||
            (s.status === "UPCOMING" &&
              new Date(s.scheduledAt).getTime() - Date.now() <
                30 * 60 * 1000),
        )
        .slice(0, 1)
        .map((s) => (
          <LiveSessionBanner
            key={s.id}
            session={{
              title: s.title,
              courseName: s.courseTitle,
              startTime: s.scheduledAt,
              endTime: s.endDateTime || s.scheduledAt,
              joinUrl: s.joinUrl,
            }}
            onJoin={() => handleJoinSession(s)}
          />
        ))}

      {/* ── Stat Tiles (full width) ──────────────────────────────────────── */}
      <StudentStatTiles tiles={statTiles} />

      {/* ── Quick Access Links ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Quick Access
        </p>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              label: "Calendar",
              sub: "View schedule",
              icon: <IconCalendar size={20} />,
              color: "blue",
              onClick: () => navigate({ view: "CALENDAR" }),
            },
            {
              label: "Study Notes",
              sub: "Review saved notes",
              icon: <IconNotes size={20} />,
              color: "blue",
              onClick: () => router.push("/student/notes"),
            },
            {
              label: "Certificates",
              sub: "View credentials",
              icon: <IconCertificate size={20} />,
              color: "blue",
              onClick: () => navigate({ view: "CERTIFICATES" }),
            },
            {
              label: "Inbox Messages",
              sub: "Check alerts & mails",
              icon: <IconMail size={20} />,
              color: "blue",
              onClick: () => router.push("/student/inbox"),
            },
            {
              label: "Support Center",
              sub: "Get help from staff",
              icon: <IconHelp size={20} />,
              color: "orange",
              onClick: () => router.push("/student/support"),
            },
          ].map((action, idx) => {
            const colorClasses = {
              blue: "border-brand-blue/20 bg-gradient-to-br from-white via-brand-blue/[0.04] to-brand-blue/[0.1] hover:from-brand-blue/[0.06] hover:to-brand-blue/[0.15] hover:border-brand-blue/40 hover:shadow-brand-blue/10 hover:shadow-lg text-brand-blue",
              orange: "border-brand-orange/20 bg-gradient-to-br from-white via-brand-orange/[0.04] to-brand-orange/[0.1] hover:from-brand-orange/[0.06] hover:to-brand-orange/[0.15] hover:border-brand-orange/40 hover:shadow-brand-orange/10 hover:shadow-lg text-brand-orange",
            }[action.color];

            const iconBg = {
              blue: "bg-gradient-to-br from-brand-blue-tint to-brand-blue/20 text-brand-blue border border-brand-blue/10",
              orange: "bg-gradient-to-br from-brand-orange-tint to-brand-orange/20 text-brand-orange border border-brand-orange/10",
            }[action.color];

            return (
              <button
                key={idx}
                onClick={action.onClick}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`tile-stagger relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden ${colorClasses}`}
              >
                <div className={`p-2 rounded-xl mb-2.5 ${iconBg}`}>
                  {action.icon}
                </div>
                <p className="text-[13px] font-bold text-foreground leading-snug">
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  {action.sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── In-line Menu ────────────────────────────────────────────────── */}
      <div className="border-b border-border/70">
        <nav className="flex flex-wrap gap-6 text-sm font-semibold">
          {(
            [
              { id: "courses" as const, label: "My Courses" },
              { id: "calendar" as const, label: "Calendar" },
              { id: "sessions" as const, label: "My Sessions" },
              {
                id: "notifications" as const,
                label: `Notifications ${
                  overdueTotal > 0 ? `(${overdueTotal})` : ""
                }`,
              },
              { id: "support" as const, label: "Mentorship" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 relative transition-colors ${
                  isActive
                    ? "text-brand-orange font-bold"
                    : "text-slate hover:text-ink"
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-orange rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content Area ────────────────────────────────────────────── */}
      <div className="sp-view-enter">
        {/* ═══ TAB: MY COURSES ═══ */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/50">
                <button
                  onClick={() => setInnerTab("my_courses")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    innerTab === "my_courses"
                      ? "bg-brand-blue text-white shadow-sm"
                      : "text-slate hover:text-ink"
                  }`}
                >
                  MY COURSES
                </button>
                <button
                  onClick={() => setInnerTab("results")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    innerTab === "results"
                      ? "bg-brand-blue text-white shadow-sm"
                      : "text-slate hover:text-ink"
                  }`}
                >
                  RESULTS
                </button>
              </div>
              <div className="relative w-64">
                <IconSearch
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
                />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-mist pl-10 pr-4 py-1.5 text-xs text-ink placeholder:text-slate focus:border-brand-orange focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              {/* Left Column: Course Cards */}
              <div className="space-y-4">
                {innerTab === "results" ? (
                  filteredCompletedCourses.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed border-border/80 rounded-2xl">
                      <IconCertificate
                        size={40}
                        className="text-muted/60 mb-2.5"
                      />
                      <p className="font-semibold text-foreground">
                        No completed courses yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Completed courses will appear here with your final
                        grades.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCompletedCourses.map((c) => (
                        <div
                          key={c.id}
                          className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-card/50"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 border border-success/20 overflow-hidden">
                            {c.thumbnail &&
                            (c.thumbnail.startsWith("/") ||
                              c.thumbnail.startsWith("http")) ? (
                              <Image
                                src={c.thumbnail}
                                alt={c.title}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xl">📚</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-foreground truncate">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              Instructor: {c.instructor} | Completed
                            </p>
                          </div>
                          <button
                            onClick={() => navigate({ view: "CERTIFICATES" })}
                            className="btn-primary py-2 px-4 text-xs font-semibold shrink-0 w-full sm:w-auto"
                          >
                            View Certificate
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    {searchTerm === "" && continueLearning.length > 0 && (
                      <div className="border border-border/70 rounded-2xl bg-card/30 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <IconSparkles
                            size={12}
                            className="text-warning animate-pulse"
                          />
                          Continue where you left..
                        </p>
                        {continueLearning.slice(0, 1).map((item) => (
                          <div
                            key={item.recordingId}
                            className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/40 transition-colors"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm overflow-hidden">
                              {item.thumbnail &&
                              (item.thumbnail.startsWith("/") ||
                                item.thumbnail.startsWith("http")) ? (
                                <Image
                                  src={item.thumbnail}
                                  alt={item.courseTitle}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <IconBook size={20} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-foreground truncate">
                                {item.courseTitle}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                {item.dayLabel}
                              </p>
                              <div className="mt-2.5 flex items-center gap-3">
                                <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{
                                      width: `${item.watchedPercent}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-primary shrink-0">
                                  {item.watchedPercent}% watched
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                navigate({
                                  view: "RECORDING_PLAYER",
                                  params: {
                                    batchId: item.batchId,
                                    sessionId: item.recordingId,
                                  },
                                })
                              }
                              className="btn-primary py-2 px-4.5 text-xs font-semibold shrink-0 w-full sm:w-auto"
                            >
                              Continue →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        My Enrolled Courses
                      </p>
                      {filteredActiveCourses.length === 0 ? (
                        <div className="glass-card flex flex-col items-center justify-center p-10 text-center border-dashed border-border/80 rounded-2xl">
                          <IconBook size={36} className="text-muted/60 mb-2" />
                          <p className="font-semibold text-foreground">
                            No active courses found
                          </p>
                        </div>
                      ) : (
                        filteredActiveCourses.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-accent/10 border border-border/60 shadow-inner overflow-hidden">
                              {c.thumbnail &&
                              (c.thumbnail.startsWith("/") ||
                                c.thumbnail.startsWith("http")) ? (
                                <Image
                                  src={c.thumbnail}
                                  alt={c.title}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <IconBook size={20} className="text-primary" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-foreground truncate">
                                {c.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Instructor: {c.instructor} | Batch:{" "}
                                {c.batchLabel}
                              </p>
                              <div className="mt-2.5 flex items-center gap-3">
                                <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                                  <div
                                    className="h-full bg-success rounded-full transition-all"
                                    style={{ width: `${c.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-success shrink-0">
                                  {c.progress}% completed
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigate({
                                  view: "COURSE_CONTENT",
                                  params: { courseId: c.id },
                                });
                              }}
                              className="btn-primary border border-border bg-card text-foreground hover:bg-card-hover hover:border-primary/30 py-2 px-4 text-xs font-semibold shrink-0 w-full sm:w-auto transition-colors"
                            >
                              Launch Course
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Referral Box */}
              <div>
                <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
                  <div className="tile-stagger relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-orange via-orange-500 to-amber-500 p-5 text-white shadow-md hero-shimmer">
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                    <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/10 blur-lg" />
                    <h3 className="text-base font-bold">Refer your friend</h3>
                    <p className="mt-1 text-xs text-white/80">
                      and earn rewards up to Rs. 5000/-
                    </p>
                  </div>
                  <form
                    onSubmit={handleReferralSubmit}
                    className="mt-4 space-y-3"
                  >
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referral Name
                      </label>
                      <div className="relative mt-1">
                        <IconUser
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          type="text"
                          placeholder="Enter full name"
                          value={referralName}
                          onChange={(e) => setReferralName(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referral Email
                      </label>
                      <div className="relative mt-1">
                        <IconMail
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={referralEmail}
                          onChange={(e) => setReferralEmail(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Mobile Number
                      </label>
                      <div className="relative mt-1">
                        <IconPhone
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          type="tel"
                          placeholder="Enter mobile number"
                          value={referralPhone}
                          onChange={(e) => setReferralPhone(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full btn-primary py-2.5 text-sm font-semibold shadow-md mt-1"
                    >
                      Submit Referral
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: CALENDAR ═══ */}
        {activeTab === "calendar" && (
          <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <p className="sp-eyebrow">Upcoming Schedule</p>
              <button
                onClick={() => navigate({ view: "CALENDAR" })}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View Interactive Calendar
              </button>
            </div>

            <div className="divide-y divide-border/60">
              {calendarEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                  <IconCalendar size={32} className="mb-2 text-muted/60" />
                  <p className="text-sm font-semibold">
                    No schedule events found
                  </p>
                </div>
              ) : (
                calendarEvents.map((evt) => {
                  const start = new Date(evt.startAt);
                  const end = new Date(evt.endAt);
                  const day = start.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  });
                  const weekday = start.toLocaleDateString("en-IN", {
                    weekday: "short",
                  });
                  const time = `${start.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })} – ${end.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}`;

                  const typeColor =
                    evt.type === "live"
                      ? "bg-danger/10 text-danger border-danger/25"
                      : evt.type === "mentorship"
                        ? "bg-success/10 text-success border-success/25"
                        : "bg-brand-blue-tint text-brand-blue border-brand-blue/20";

                  return (
                    <div
                      key={evt.id}
                      className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                    >
                      {/* Date Bubble */}
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/10 border border-border/80 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {weekday}
                        </span>
                        <span className="text-sm font-bold text-foreground mt-0.5">
                          {day}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">
                          {evt.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-muted">
                            <IconClock size={12} />
                            {time}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeColor}`}
                          >
                            {evt.type}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      {evt.joinUrl && (
                        <a
                          href={evt.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-orange/90 shrink-0"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: MY SESSIONS ═══ */}
        {activeTab === "sessions" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            {/* Live & Upcoming Sessions */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <p className="sp-eyebrow">Sessions Today & Upcoming</p>
              <div className="divide-y divide-border/60">
                {liveSessionsToday.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                    <IconVideo size={32} className="mb-2 text-muted/60" />
                    <p className="text-sm font-semibold">
                      No active sessions scheduled
                    </p>
                  </div>
                ) : (
                  liveSessionsToday.map((s) => {
                    const start = new Date(s.scheduledAt);
                    const time = start.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const date = start.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                    const isLive = s.status === "LIVE";

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            {isLive && (
                              <span className="live-pulse h-2.5 w-2.5 rounded-full bg-danger shrink-0" />
                            )}
                            <p className="font-bold text-sm text-foreground truncate">
                              {s.title}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Course: {s.courseTitle} | Instructor: {s.instructor}
                          </p>
                          <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1.5">
                            <IconCalendar size={12} />
                            {date} at {time}
                          </p>
                        </div>
                        {isLive && s.joinUrl ? (
                          <a
                            href={s.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-xl bg-brand-orange py-1.5 px-4 text-xs font-semibold text-white shadow-sm hover:bg-brand-orange/90 shrink-0"
                          >
                            Join Session
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-muted bg-muted/10 border border-border/80 rounded-lg px-2.5 py-1 shrink-0">
                            Upcoming
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Past Recordings */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <p className="sp-eyebrow">Recent Recordings</p>
              {continueLearning.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
                  <IconPlayerPlay size={28} className="mb-2 text-muted/60" />
                  <p className="text-sm font-semibold">No recordings found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {continueLearning.map((item) => (
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
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-border bg-card/60 hover:border-primary/45 transition-colors text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <IconPlayerPlay size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-foreground truncate">
                          {item.courseTitle}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          {item.dayLabel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: NOTIFICATIONS / ALERTS ═══ */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            {/* Overdue Alerts */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <p className="sp-eyebrow">Pending Overdue Tasks</p>
              <div className="space-y-3">
                {overdueTotal === 0 ? (
                  <div className="flex items-center gap-3.5 p-5 rounded-2xl border border-success/20 bg-success/[0.03]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success border border-success/25">
                      <IconSparkles size={20} className="animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-success">
                        All caught up!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        There are no pending assignments or quizzes overdue.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {overdueAssignments
                      .filter((item) => item.status === "PENDING")
                      .map((item) => {
                        const isQuiz = item.type === "QUIZ";
                        return (
                          <div
                            key={item.id}
                            className={`tile-stagger flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-300 ${
                              isQuiz
                                ? "border-brand-orange/20 bg-gradient-to-br from-white via-brand-orange/[0.04] to-brand-orange/[0.1]"
                                : "border-danger/25 bg-gradient-to-br from-white via-danger/[0.03] to-danger/[0.08]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  isQuiz
                                    ? "bg-gradient-to-br from-brand-orange-tint to-brand-orange/20 text-brand-orange border border-brand-orange/20"
                                    : "bg-gradient-to-br from-danger-tint to-danger/15 text-danger border border-danger/25"
                                }`}
                              >
                                {isQuiz ? (
                                  <IconClock size={16} />
                                ) : (
                                  <IconPencil size={16} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground">
                                  {item.assignmentName}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                  Course: {item.courseName} | Unit:{" "}
                                  {item.unitName}
                                </p>
                                <p className="text-[10px] text-danger font-semibold mt-1">
                                  Due Date:{" "}
                                  {new Date(item.dueDate).toLocaleDateString(
                                    "en-IN",
                                    { day: "numeric", month: "short" },
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                navigate(
                                  isQuiz
                                    ? { view: "QUIZ_OVERDUE" }
                                    : { view: "ASSIGNMENT_OVERDUE" },
                                )
                              }
                              className="inline-flex items-center justify-center rounded-xl bg-brand-orange py-1.5 px-3 text-xs font-semibold text-white shadow-sm hover:bg-brand-orange/90 shrink-0 self-start sm:self-center"
                            >
                              Attempt Now
                            </button>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>

            {/* Notification History */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <p className="sp-eyebrow">General Feed</p>
              <div className="space-y-3.5">
                <div className="flex gap-3 text-left">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <IconBell size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      LMS Update Rolled Out
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Check out the streamlined tabs, solid color stats, and
                      updated branding!
                    </p>
                    <p className="text-[10px] text-muted mt-1">Today</p>
                  </div>
                </div>
                <div className="flex gap-3 text-left">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success border border-success/20 mt-0.5">
                    <IconCertificate size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      Certificate Earned
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Congratulations on completing Python Foundations Course!
                    </p>
                    <p className="text-[10px] text-muted mt-1">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: SUPPORT & MENTORSHIP ═══ */}
        {activeTab === "support" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            {/* Mentorship Booking */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <p className="sp-eyebrow">Book 1-on-1 Mentorship</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!mentorTopic.trim()) return;
                  setMentorSubmitting(true);
                  try {
                    const topicWithType =
                      mentorQueryType === "other" && mentorOtherQuery.trim()
                        ? `[${mentorOtherQuery.trim()}] ${mentorTopic}`
                        : `[${mentorQueryType.toUpperCase()}] ${mentorTopic}`;
                    const effectiveCourseId =
                      mentorQueryType === "course" ? mentorCourseId : "";
                    await onMentorshipSubmit?.(
                      effectiveCourseId,
                      topicWithType,
                      mentorDateTime,
                    );
                    toast.success("Mentorship request submitted!");
                    setMentorQueryType("course");
                    setMentorOtherQuery("");
                    setMentorTopic("");
                    setMentorDateTime("");
                  } catch {
                    toast.error("Failed to submit request");
                  } finally {
                    setMentorSubmitting(false);
                  }
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Query Type
                  </label>
                  <div className="mt-1 flex gap-2">
                    {(["course", "generic", "career", "other"] as const).map(
                      (t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMentorQueryType(t)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            mentorQueryType === t
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {t === "course"
                            ? "Course"
                            : t === "generic"
                              ? "Generic"
                              : t === "career"
                                ? "Career"
                                : "Other"}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {mentorQueryType === "other" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Specify Query Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Technical, Project, etc."
                      value={mentorOtherQuery}
                      onChange={(e) => setMentorOtherQuery(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {mentorQueryType === "course" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Select Course
                    </label>
                    <select
                      value={mentorCourseId}
                      onChange={(e) => setMentorCourseId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {enrolledCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {mentorQueryType === "course"
                      ? "Describe Your Query"
                      : "Tell Us About It"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      mentorQueryType === "course"
                        ? "Describe your doubt or issue related to the selected course..."
                        : mentorQueryType === "generic"
                          ? "Describe your general query or concern..."
                          : mentorQueryType === "career"
                            ? "Describe your career-related question..."
                            : "Describe your query in detail..."
                    }
                    value={mentorTopic}
                    onChange={(e) => setMentorTopic(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Preferred Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={mentorDateTime}
                    onChange={(e) => setMentorDateTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMentorQueryType("course");
                      setMentorOtherQuery("");
                      setMentorTopic("");
                      setMentorDateTime("");
                    }}
                    className="flex-1 btn-secondary py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mentorSubmitting}
                    className="flex-1 btn-primary py-2.5 text-sm font-semibold shadow-md disabled:opacity-50"
                  >
                    {mentorSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>

            {/* Tickets Status — Mentorship Log */}
            <div className="glass-card p-5 border border-border/80 rounded-2xl bg-card space-y-4">
              <div className="flex items-center justify-between">
                <p className="sp-eyebrow">Mentorship Log</p>
                {openTicketCount > 0 && (
                  <span className="rounded-full bg-success/15 border border-success/20 px-2 py-0.5 text-[9px] font-bold text-success animate-pulse">
                    {openTicketCount} active
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {(() => {
                  const active = openTickets.filter(
                    (t) =>
                      t.status === "OPEN" ||
                      t.status === "ASSIGNED" ||
                      t.status === "SCHEDULED",
                  );
                  const past = openTickets.filter(
                    (t) => t.status === "COMPLETED" || t.status === "CANCELLED",
                  );

                  if (active.length === 0 && past.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-muted">
                        <IconHeart size={28} className="mb-2 text-muted/60" />
                        <p className="text-xs font-semibold">
                          No booking log found
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {active.length > 0 &&
                        active.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl border border-border bg-card/60"
                          >
                            <p className="font-bold text-xs text-foreground truncate">
                              {t.topic}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Course: {t.courseTitle} | Instructor:{" "}
                              {t.instructor || "Assigning..."}
                            </p>
                            {t.preferredTime && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Preferred:{" "}
                                {new Date(t.preferredTime).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  t.status === "OPEN"
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : t.status === "ASSIGNED"
                                      ? "bg-brand-blue-tint text-brand-blue border-brand-blue/20"
                                      : "bg-success/10 text-success border-success/20"
                                }`}
                              >
                                {t.status}
                              </span>
                              {t.joinUrl && (
                                <a
                                  href={t.joinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-primary py-1 px-2.5 text-[10px] font-bold"
                                >
                                  Join Meeting
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      {past.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-px flex-1 bg-border/60" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
                              Past
                            </span>
                            <div className="h-px flex-1 bg-border/60" />
                          </div>
                          {past.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-xl border border-border/50 bg-card/30 opacity-70"
                            >
                              <p className="font-bold text-xs text-foreground truncate">
                                {t.topic}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Course: {t.courseTitle} | Instructor:{" "}
                                {t.instructor || "N/A"}
                              </p>
                              <div className="mt-2.5">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    t.status === "COMPLETED"
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "bg-muted/10 text-muted border-border"
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
