"use client";

import Link from "next/link";

const stats = [
  { label: "Total Courses", value: "—", icon: "📚", color: "from-primary to-violet-500", href: "/admin/courses" },
  { label: "Active Batches", value: "—", icon: "👥", color: "from-accent to-cyan-400", href: "/admin/batches" },
  { label: "Live Sessions", value: "—", icon: "🎥", color: "from-success to-emerald-400", href: "/admin/sessions" },
  { label: "Total Students", value: "—", icon: "🎓", color: "from-warning to-amber-400", href: "/admin/users" },
];

const quickActions = [
  { label: "Create Course", href: "/admin/courses/new", icon: "📝" },
  { label: "Manage Batches", href: "/admin/batches", icon: "👥" },
  { label: "View Sessions", href: "/admin/sessions", icon: "📅" },
  { label: "Mentorship Tickets", href: "/admin/mentorship", icon: "🎫" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and quick actions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card p-5 group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg group-hover:scale-110 transition-transform`}
              >
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="panel p-4 text-center hover:border-primary/30 hover:bg-card-hover transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Placeholder for future widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            Activity feed will be populated when course and enrollment APIs are connected.
          </p>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">
            Revenue data will appear when the payment system is integrated.
          </p>
        </div>
      </div>
    </div>
  );
}
