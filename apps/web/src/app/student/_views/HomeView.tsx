"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconBook, IconCalendar, IconCertificate, IconHeart, IconPlayerPlay, IconVideo } from "@tabler/icons-react";
import type { ViewState } from "../_types/student-portal";
import type {
  DashboardStats,
  ContinueLearningItem,
  LiveSession,
  MentorshipTicket,
} from "@/lib/student-mock-data";

interface HomeViewProps {
  stats: DashboardStats;
  continueLearning: ContinueLearningItem[];
  liveSessionsToday: LiveSession[];
  openTickets: MentorshipTicket[];
  firstBatchId?: string; // for the Recordings shortcut
  navigate: (v: ViewState) => void;
}

// Count-up hook
function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return count;
}

function StatCard({ label, value, icon, gradient, onClick }: {
  label: string; value: number; icon: string; gradient: string; onClick: () => void;
}) {
  const count = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className="glass-card group relative flex flex-col gap-3 overflow-hidden p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl shadow-md`}>
        {icon}
      </div>
      <div>
        <p className="sp-eyebrow">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{count}</p>
      </div>
      <IconArrowRight
        size={14}
        className="absolute right-4 top-4 text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
      />
    </button>
  );
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
        ? ({ view: "BATCH_DETAIL" as const, params: { batchId: firstBatchId } })
        : ({ view: "COURSES" as const }),
    gradient: "from-violet-500/20 to-purple-400/10",
    border: "hover:border-violet-400/30",
  },
];

export default function HomeView({ stats, continueLearning, liveSessionsToday, openTickets, firstBatchId, navigate }: HomeViewProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const liveCount = liveSessionsToday.filter((s) => s.status === "LIVE").length;
  const openTicketCount = openTickets.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED").length;

  const statCards = [
    { label: "Enrolled", value: stats.enrolledCount, icon: "📚", gradient: "from-primary to-violet-600", view: { view: "COURSES" as const } },
    { label: "Completed", value: stats.completedCount, icon: "✅", gradient: "from-success to-emerald-400", view: { view: "COURSES" as const } },
    { label: "Live Today", value: stats.liveTodayCount, icon: "📹", gradient: "from-danger to-red-400", view: { view: "LIVE_SESSIONS" as const } },
    { label: "Certificates", value: stats.certificatesCount, icon: "🎓", gradient: "from-warning to-amber-400", view: { view: "CERTIFICATES" as const } },
  ];

  return (
    <div className="sp-view-enter space-y-8">
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {greeting}, Arjun 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s everything in one place.</p>
      </div>

      {/* ── Stats Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            gradient={s.gradient}
            onClick={() => navigate(s.view)}
          />
        ))}
      </div>

      {/* ── Section Grid ──────────────────────────────────────────────────── */}
      <div>
        <p className="sp-eyebrow mb-3">Sections</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_CARDS.map((card, i) => (
            <button
              key={card.id}
              onClick={() => {
                const view = "viewFn" in card
                  ? (card as { viewFn: (id?: string) => ViewState }).viewFn(firstBatchId)
                  : (card as { view: ViewState }).view;
                navigate(view);
              }}
              className={`glass-card group relative flex items-center gap-4 overflow-hidden p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${card.border}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* bg glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                {card.icon}
              </div>
              <div className="relative min-w-0">
                {card.isLive && liveCount > 0 && (
                  <span className="mb-1 flex items-center gap-1.5">
                    <span className="live-pulse h-2 w-2 rounded-full bg-danger" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-danger">{liveCount} Live</span>
                  </span>
                )}
                <p className="truncate font-semibold text-foreground">{card.title}</p>
                {card.id === "mentorship" && openTicketCount > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{openTicketCount} open request{openTicketCount > 1 ? "s" : ""}</p>
                )}
              </div>
              <IconArrowRight
                size={15}
                className="relative ml-auto flex-shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Schedule ──────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="sp-eyebrow">Today</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{dateStr}</p>
          </div>
          <span className="text-xs text-muted">{liveCount + openTicketCount} events</span>
        </div>
        <div className="divide-y divide-border/60">
          {liveSessionsToday.length === 0 && openTickets.length === 0 ? (
            <p className="py-3 text-sm text-muted">No live sessions or mentorship requests today.</p>
          ) : (
            <>
              {liveSessionsToday.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {s.status === "LIVE"
                      ? <span className="live-pulse h-2.5 w-2.5 flex-shrink-0 rounded-full bg-danger" />
                      : <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-accent/60" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted">{s.courseTitle}</p>
                    </div>
                  </div>
                  {s.status === "LIVE" && s.joinUrl && (
                    <a
                      href={s.joinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))}
              {openTickets.slice(0, 2).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-warning/70" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.topic}</p>
                      <p className="text-xs text-muted">Mentorship · {t.courseTitle}</p>
                    </div>
                  </div>
                  <span className="text-xs text-warning">Open</span>
                </div>
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => navigate({ view: "CALENDAR" })}
          className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View Full Calendar →
        </button>
      </div>

      {/* ── Continue Learning ─────────────────────────────────────────────── */}
      {continueLearning.length > 0 && (
        <div>
          <p className="sp-eyebrow mb-3">Continue Learning</p>
          <div className="space-y-3">
            {continueLearning.map((item) => (
              <button
                key={item.recordingId}
                onClick={() => navigate({ view: "RECORDING_PLAYER", params: { batchId: item.batchId, sessionId: item.recordingId } })}
                className="glass-card group flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-2xl">
                  {item.thumbnail}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.courseTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.dayLabel} · {item.watchedPercent}% watched</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${item.watchedPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Resume →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Browse Courses CTA ────────────────────────────────────────────── */}
      <div className="glass-card flex flex-col items-start justify-between gap-4 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:flex-row sm:items-center">
        <div>
          <p className="sp-eyebrow">Catalogue</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">Explore new courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Expand your skills. New batches starting every month.</p>
        </div>
        <button
          onClick={() => navigate({ view: "BROWSE_CATALOGUE" })}
          className="btn-primary flex-shrink-0"
        >
          Browse Courses →
        </button>
      </div>
    </div>
  );
}
