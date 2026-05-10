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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Track your learning progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-xl opacity-80 group-hover:opacity-100 transition-opacity`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Sessions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Upcoming Live Sessions</h2>
          <a href="/sessions" className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
            View all →
          </a>
        </div>
        <div className="divide-y divide-border">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-card-hover">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">
                  🎥
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{session.title}</p>
                  <p className="text-xs text-muted">{session.course} · {session.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.isLive ? (
                  <>
                    <LiveBadge />
                    <a href="#" className="btn-primary text-xs py-1.5 px-4">Join Now</a>
                  </>
                ) : (
                  <span className="text-xs text-muted">Upcoming</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1-on-1 Mentorship CTA */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-2xl">
              🤝
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Need personalized help?
              </h3>
              <p className="text-sm text-muted mt-0.5">
                Request a 1-on-1 mentorship session with an expert instructor
              </p>
            </div>
          </div>
          <a
            href="/mentorship"
            className="btn-primary flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Request Session
          </a>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Activity</h3>
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
          <h3 className="text-base font-semibold text-foreground mb-4">Course Progress</h3>
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
