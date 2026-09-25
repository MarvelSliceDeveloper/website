"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconCalendar,
  IconUserCheck,
  IconVideo,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

type CourseSummary = { id: string; title: string };

type Batch = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string | null;
  course: CourseSummary | null;
  courseMentors: { course: CourseSummary }[];
  _count: { enrollments: number; sessions: number };
};

function getCoursesForBatch(b: Batch): CourseSummary[] {
  const fromMentors = b.courseMentors.map((cm) => cm.course);
  if (fromMentors.length > 0) return fromMentors;
  if (b.course) return [b.course];
  return [];
}

export default function InstructorBatchesPage() {
  usePageTitle("Batches");
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      }
    >
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");

  // Shares the cache key with the instructor dashboard's ["instructor","batches"].
  const batchesQuery = useApiQuery<Batch[]>(
    ["instructor", "batches"],
    "/api/instructor/batches",
  );
  const batches = batchesQuery.data ?? [];
  const loading = batchesQuery.isPending;

  const now = new Date();
  let filteredBatches = batches;

  if (statusFilter === "ACTIVE") {
    filteredBatches = batches.filter(
      (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now,
    );
  } else if (statusFilter === "COMPLETED") {
    filteredBatches = batches.filter((b) => new Date(b.endDate) < now);
  }

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="My Batches"
        breadcrumbs={[{ label: "Batches", href: "/instructor/batches" }]}
        role="Instructor"
        description="Monitor enrollment stats and scheduling progress across your assigned student cohorts."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground mb-3 border border-border">
            <IconUsers size={26} stroke={1.8} />
          </div>
          <p className="text-base font-bold text-foreground">
            No cohorts assigned
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Please ask your LMS Admin to assign you to a batch cohort.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredBatches.map((b) => {
            const isCompleted = new Date(b.endDate) < now;
            const isUpcoming = new Date(b.startDate) > now;
            const statusVariant = isCompleted
              ? ("secondary" as const)
              : isUpcoming
                ? ("info" as const)
                : ("success" as const);
            const statusLabel = isCompleted
              ? "Completed"
              : isUpcoming
                ? "Upcoming"
                : "Active";

            return (
              <Card key={b.id} hoverable className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
                  {/* Left: status, name, courses, description, dates */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={statusVariant} size="sm" dot>
                        {statusLabel}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-foreground text-base truncate">
                        {b.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getCoursesForBatch(b).length > 0 ? (
                          getCoursesForBatch(b).map((c) => (
                            <Badge
                              key={c.id}
                              variant="default"
                              size="sm"
                            >
                              {c.title}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No course assigned
                          </span>
                        )}
                      </div>
                    </div>

                    {b.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {b.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconCalendar size={13} className="text-primary" />
                        {new Date(b.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <IconCalendar size={13} className="text-primary" />
                        {new Date(b.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Students / Sessions / Limit */}
                  <div className="flex shrink-0 flex-row gap-2 sm:w-48 sm:flex-col sm:justify-center sm:border-l sm:border-border/60 sm:pl-4">
                    <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-muted/10 px-3 py-2 sm:flex-none">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <IconUserCheck size={13} className="text-primary" />
                        Students
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {b._count?.enrollments ?? 0}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-muted/10 px-3 py-2 sm:flex-none">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <IconVideo size={13} className="text-success" />
                        Sessions
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {b._count?.sessions ?? 0}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-muted/10 px-3 py-2 sm:flex-none">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <IconClock size={13} className="text-warning" />
                        Limit
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {b.maxStudents ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

