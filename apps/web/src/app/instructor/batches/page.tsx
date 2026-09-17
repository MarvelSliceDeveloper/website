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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Card
                key={b.id}
                hoverable
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
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
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center bg-muted/10 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Students
                    </p>
                    <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                      <IconUserCheck size={14} className="text-primary" />
                      {b._count?.enrollments ?? 0}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Sessions
                    </p>
                    <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                      <IconVideo size={14} className="text-success" />
                      {b._count?.sessions ?? 0}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Limit
                    </p>
                    <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                      <IconClock size={14} className="text-warning" />
                      {b.maxStudents ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-between pt-1">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

