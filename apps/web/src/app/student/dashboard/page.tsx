import Link from "next/link";
import { LiveBadge } from "@/components/ui/Badge";

const stats = [
  { label: "Enrolled Courses", value: "12", icon: "📚", color: "from-primary to-violet-500" },
  { label: "Completed", value: "8", icon: "✅", color: "from-success to-emerald-400" },
  { label: "Live Sessions Today", value: "2", icon: "🎥", color: "from-accent to-cyan-400" },
  { label: "Certificates", value: "5", icon: "🏆", color: "from-warning to-amber-400" },
];

const upcomingSessions = [
  { id: "1", title: "Advanced TypeScript Patterns", course: "TS Mastery", time: "10:00 AM", isLive: true },
  { id: "2", title: "React Server Components Deep Dive", course: "React Pro", time: "2:00 PM", isLive: false },
  { id: "3", title: "Database Design Principles", course: "Backend 101", time: "4:30 PM", isLive: false },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Learning Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track sessions, progress, and mentorship in one place.</p>
        </div>
        <Link href="/student/courses" className="btn-secondary">
          Browse Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Upcoming Live Sessions</h2>
            <Link href="/student/sessions" className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
            View all →
          </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex flex-col items-start gap-3 px-5 py-4 transition-colors hover:bg-card-hover/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm">
                    🎥
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.title}</p>
                    <p className="text-xs text-muted">{session.course} · {session.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {session.isLive ? (
                    <>
                      <LiveBadge />
                      <Link href="/student/sessions" className="btn-primary text-xs py-1.5 px-4">Join</Link>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">Mentorship</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Need personalized support?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Request a 1-on-1 session with an instructor and get focused guidance on your blockers.
              </p>
            </div>
            <Link href="/student/mentorship" className="btn-primary w-fit">Request Session</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-4">
            {["Completed Module 3 in React Pro", "Earned certificate for Backend 101", "Joined live session: TS Patterns"].map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Course Progress</h3>
          <div className="space-y-4">
            {[
              { name: "TypeScript Mastery", progress: 75 },
              { name: "React Pro", progress: 45 },
              { name: "Backend 101", progress: 90 },
            ].map((course) => (
              <div key={course.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{course.name}</span>
                  <span className="text-xs text-muted">{course.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
