"use client";

import { StatusBadge, LiveBadge } from "@/components/ui/Badge";

const sessions = [
  { id: "1", title: "TypeScript Generics", course: "TS Mastery", instructor: "Dr. Kumar", date: "May 15", time: "10:00 AM", status: "live", attendees: 24 },
  { id: "2", title: "React Server Components", course: "React Pro", instructor: "Prof. Sharma", date: "May 15", time: "2:00 PM", status: "scheduled", attendees: 0 },
  { id: "3", title: "REST API Design", course: "Backend 101", instructor: "Dr. Patel", date: "May 14", time: "11:00 AM", status: "completed", attendees: 31 },
];

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Sessions</h1>
          <p className="text-sm text-muted mt-1">Upcoming and past sessions</p>
        </div>
      </div>

      {sessions.some((s) => s.status === "live") && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-5">
          {sessions.filter((s) => s.status === "live").map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-xl">🎥</div>
                <div>
                  <LiveBadge size="lg" />
                  <p className="text-base font-semibold text-foreground mt-1">{s.title}</p>
                  <p className="text-xs text-muted">{s.course} · {s.attendees} attendees</p>
                </div>
              </div>
              <a href="#" className="btn-primary text-sm">Join →</a>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border text-left">
            <th className="px-6 py-3 text-xs font-medium text-muted uppercase">Session</th>
            <th className="px-6 py-3 text-xs font-medium text-muted uppercase">Date</th>
            <th className="px-6 py-3 text-xs font-medium text-muted uppercase">Status</th>
            <th className="px-6 py-3 text-xs font-medium text-muted uppercase">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-border/50">
            {sessions.map((s) => (
              <tr key={s.id} className="hover:bg-card-hover/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted">{s.course} · {s.instructor}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{s.date} · {s.time}</td>
                <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                <td className="px-6 py-4">
                  {s.status === "live" ? <a href="#" className="btn-primary text-xs py-1.5 px-3">Join</a>
                   : s.status === "completed" ? <a href="#" className="text-xs text-primary hover:text-primary-hover">Recording</a>
                   : <span className="text-xs text-muted">Upcoming</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
