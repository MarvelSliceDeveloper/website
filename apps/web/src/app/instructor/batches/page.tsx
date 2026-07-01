"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  IconCalendar,
  IconUserCheck,
  IconVideo,
  IconClock
} from "@tabler/icons-react";

type Batch = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string | null;
  course: { id: string; title: string };
  _count: { enrollments: number; sessions: number };
};

export default function InstructorBatchesPage() {
  return (
    <Suspense fallback={
      <div className="glass-card p-12 text-center">
        <p className="text-muted animate-pulse">Loading batches...</p>
      </div>
    }>
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      try {
        const data = await api.get<Batch[]>("/api/admin/batches");
        setBatches(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error("Failed to load batches:", err);
        if (err instanceof Error && (err.message?.includes("Authentication") || err.message?.includes("401"))) {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  const now = new Date();
  let filteredBatches = batches;

  if (statusFilter === "ACTIVE") {
    filteredBatches = batches.filter((b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now);
  } else if (statusFilter === "COMPLETED") {
    filteredBatches = batches.filter((b) => new Date(b.endDate) < now);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">My Cohorts & Batches</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor enrollment stats and scheduling progress across your assigned student batches.</p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading cohorts...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-lg font-semibold text-foreground">No cohorts assigned</p>
          <p className="text-sm text-muted-foreground mt-1">Please ask your LMS Admin to enroll you into a batch cohort.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((b) => (
            <div key={b.id} className="glass-card p-5 space-y-4 border border-border/80 hover:border-violet-500/20 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-2">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    new Date(b.endDate) < now
                      ? "text-muted-foreground bg-muted/20"
                      : new Date(b.startDate) > now
                        ? "text-sky-400 bg-sky-500/10"
                        : "text-violet-400 bg-violet-500/10"
                  }`}>
                    {new Date(b.endDate) < now ? "Completed" : new Date(b.startDate) > now ? "Upcoming" : "Active"}
                  </span>
                  <h3 className="font-bold text-foreground text-base mt-2 truncate">{b.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{b.course.title}</p>
                </div>

                {b.description && (
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {b.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/40 text-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Students</p>
                  <p className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                    <IconUserCheck size={14} className="text-violet-400" />
                    {b._count?.enrollments ?? 0}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Sessions</p>
                  <p className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                    <IconVideo size={14} className="text-emerald-400" />
                    {b._count?.sessions ?? 0}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Limit</p>
                  <p className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                    <IconClock size={14} className="text-sky-400" />
                    {b.maxStudents ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1.5 justify-between">
                <span className="flex items-center gap-1">
                  <IconCalendar size={13} />
                  Start: {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span className="flex items-center gap-1">
                  End: {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
