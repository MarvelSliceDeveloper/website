"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Student = {
  id: string;
  user: { id: string; name: string; email: string };
  appliedAt: string;
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  recording: { id: string; syncedAt: string } | null;
};

type Batch = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxStudents: number | null;
  description: string | null;
  course: { id: string; title: string };
  instructor: { id: string; name: string; email: string };
  enrollments: Student[];
  sessions: Session[];
  _count: { enrollments: number; sessions: number };
};

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-accent/15 text-accent border-accent/25",
  ACTIVE: "bg-success/15 text-success border-success/25",
  COMPLETED: "bg-muted/15 text-muted border-muted/25",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "sessions">("students");

  // Add student form
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const fetchBatch = useCallback(async () => {
    try {
      const data = await api.get<Batch>(`/api/admin/batches/${id}`);
      setBatch(data);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  const handleRemoveStudent = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this batch?`)) return;
    try {
      await api.delete(`/api/admin/batches/${id}/students/${userId}`);
      fetchBatch();
    } catch (err: any) {
      alert(err.message || "Failed to remove student");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">Batch not found</p>
        <Link href="/admin/batches" className="btn-primary mt-4 inline-flex">← Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/batches" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1">
            ← Back to Batches
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{batch.name}</h1>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[batch.status] || ""}`}>
              {batch.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{batch.course.title}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{batch._count.enrollments}</p>
          <p className="text-xs text-muted">Students</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{batch._count.sessions}</p>
          <p className="text-xs text-muted">Sessions</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{batch.maxStudents ?? "∞"}</p>
          <p className="text-xs text-muted">Capacity</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-sm font-medium text-foreground">{batch.instructor.name}</p>
          <p className="text-xs text-muted">Instructor</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {(["students", "sessions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "students" ? `Students (${batch.enrollments.length})` : `Sessions (${batch.sessions.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "students" && (
        <div className="space-y-4">
          {batch.enrollments.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Student</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Email</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Enrolled</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {batch.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-card-hover/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
                            {enrollment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{enrollment.user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{enrollment.user.email}</td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {new Date(enrollment.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleRemoveStudent(enrollment.user.id, enrollment.user.name)}
                          className="text-xs font-medium text-danger hover:text-danger/80 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-3">
          {batch.sessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">No sessions scheduled yet.</p>
            </div>
          ) : (
            batch.sessions.map((session) => {
              const isPast = session.endedAt || new Date(session.scheduledAt) < new Date();
              return (
                <div key={session.id} className="glass-card p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(session.scheduledAt).toLocaleString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-medium bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                        {session.createdFrom}
                      </span>
                      {session.recording && (
                        <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">
                          Recording Available
                        </span>
                      )}
                      {isPast && !session.recording && (
                        <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                          No Recording
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={session.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs"
                  >
                    {isPast ? "View Details" : "Join URL →"}
                  </a>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
