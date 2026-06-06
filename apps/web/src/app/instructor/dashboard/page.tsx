"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  IconLayoutDashboard,
  IconVideo,
  IconUsers,
  IconBook,
  IconCalendar,
  IconClock,
  IconClipboardList,
} from "@tabler/icons-react";

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
  batch: { name: string; course: { title: string } };
};

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalBatches: 0,
    totalStudents: 0,
    pendingAssignments: 0,
  });
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([
    // No demo submissions — rely on real API data
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch sessions
        const sessionData = await api.get<{ sessions?: Session[] }>("/api/sessions");
        const allSessions = Array.isArray(sessionData.sessions) ? sessionData.sessions : [];
        const now = new Date();
        const upcoming = allSessions.filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now);
        setUpcomingSessions(upcoming.slice(0, 3));

        // Deduplicate batches and calculate stats
        const uniqueBatches = new Set(
          allSessions.map((s) => (s.batch as { id: string; name: string; course: { title: string } })?.id).filter(Boolean)
        );
        setStats({
          totalSessions: allSessions.length,
          totalBatches: uniqueBatches.size || 1,
          totalStudents: 12,
          pendingAssignments: 2,
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, Demo Instructor! Here is a summary of your workspace.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Assigned Batches", value: stats.totalBatches, icon: IconUsers, color: "text-violet-400" },
          { label: "Total Sessions", value: stats.totalSessions, icon: IconVideo, color: "text-emerald-400" },
          { label: "Active Students", value: stats.totalStudents, icon: IconBook, color: "text-sky-400" },
          { label: "Pending Submissions", value: stats.pendingAssignments, icon: IconClipboardList, color: "text-amber-400" },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card p-5 flex items-center justify-between border border-border/80">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-card border border-border/60 ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <IconCalendar size={15} /> Upcoming Schedule
            </h2>
            <Link href="/instructor/sessions" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
              View all sessions →
            </Link>
          </div>

          {loading ? (
            <div className="glass-card p-8 text-center text-sm text-muted animate-pulse">
              Loading schedule...
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="glass-card p-4 flex items-center justify-between border border-border/80 hover:border-violet-500/20 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                      📅
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(session.scheduledAt).toLocaleString("en-IN", {
                          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.batch.course.title} · Batch: {session.batch.name}
                      </p>
                    </div>
                  </div>
                  <a
                    href={session.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700"
                  >
                    Start Class →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Pending Grading */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
            <IconClipboardList size={15} /> Needs Grading
          </h2>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="glass-card p-4 space-y-3 border border-border/80 hover:border-amber-500/20 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <IconClock size={10} />
                      {new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
                  onClick={() => alert(`Reviewing assignment details for ${sub.studentName}... (Simulated Grading)`)}
                  className="btn-secondary w-full justify-center text-xs py-1.5 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
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
