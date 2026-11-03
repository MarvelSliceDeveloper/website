"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";

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

type BatchStatus = "ACTIVE" | "UPCOMING" | "COMPLETED";

const statusConfig: Record<
  BatchStatus,
  { label: string; variant: "success" | "info" | "secondary" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  UPCOMING: { label: "Upcoming", variant: "info" },
  COMPLETED: { label: "Completed", variant: "secondary" },
};

const statusRank: Record<BatchStatus, number> = {
  ACTIVE: 0,
  UPCOMING: 1,
  COMPLETED: 2,
};

function getCoursesForBatch(b: Batch): CourseSummary[] {
  const fromMentors = b.courseMentors?.map((cm) => cm.course) ?? [];
  if (fromMentors.length > 0) return fromMentors;
  if (b.course) return [b.course];
  return [];
}

function getBatchStatus(b: Batch, now: Date): BatchStatus {
  if (new Date(b.endDate) < now) return "COMPLETED";
  if (new Date(b.startDate) > now) return "UPCOMING";
  return "ACTIVE";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InstructorBatchesPage() {
  usePageTitle("Batches");
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <p className="text-muted animate-pulse">Loading batches...</p>
        </div>
      }
    >
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusFilter = searchParams.get("status");
  const [search, setSearch] = useState("");

  const setStatusFilter = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Shares the cache key with the instructor dashboard's ["instructor","batches"].
  const batchesQuery = useApiQuery<Batch[]>(
    ["instructor", "batches"],
    "/api/instructor/batches",
  );
  const batches = batchesQuery.data ?? [];
  const loading = batchesQuery.isPending;

  const now = new Date();

  // Memoized so the table's data reference stays stable between renders
  // (DataTable keeps its own page state and resets whenever `data` changes).
  const counts = useMemo(() => {
    const reference = new Date();
    const result: Record<BatchStatus, number> = {
      ACTIVE: 0,
      UPCOMING: 0,
      COMPLETED: 0,
    };
    for (const batch of batches) {
      result[getBatchStatus(batch, reference)] += 1;
    }
    return result;
  }, [batches]);

  const rows = useMemo(() => {
    const reference = new Date();
    let list = batches;

    if (
      statusFilter === "ACTIVE" ||
      statusFilter === "UPCOMING" ||
      statusFilter === "COMPLETED"
    ) {
      list = list.filter(
        (batch) => getBatchStatus(batch, reference) === statusFilter,
      );
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((batch) =>
        [
          batch.name,
          batch.description,
          ...getCoursesForBatch(batch).map((course) => course.title),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term)),
      );
    }

    // Active cohorts first, then upcoming, then completed.
    return [...list].sort((a, b) => {
      const aStatus = getBatchStatus(a, reference);
      const bStatus = getBatchStatus(b, reference);
      if (aStatus !== bStatus) return statusRank[aStatus] - statusRank[bStatus];
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      return aStatus === "COMPLETED" ? bTime - aTime : aTime - bTime;
    });
  }, [batches, statusFilter, search]);

  const columns: DataTableColumn<Batch>[] = [
    {
      key: "name",
      label: "Batch",
      render: (_, batch) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {batch.name}
          </p>
          {batch.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {batch.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "courses",
      label: "Courses",
      render: (_, batch) => {
        const courses = getCoursesForBatch(batch);
        if (courses.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">
              No course assigned
            </span>
          );
        }
        return (
          <div className="flex max-w-xs flex-wrap gap-1.5">
            {courses.map((course) => (
              <Badge key={course.id} variant="default" size="sm">
                {course.title}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "startDate",
      label: "Schedule",
      render: (_, batch) => (
        <div className="whitespace-nowrap">
          <p className="text-sm font-medium text-foreground">
            {formatDate(batch.startDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            to {formatDate(batch.endDate)}
          </p>
        </div>
      ),
    },
    {
      key: "students",
      label: "Students",
      render: (_, batch) => (
        <span className="text-sm font-semibold text-foreground">
          {batch._count?.enrollments ?? 0}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            / {batch.maxStudents ?? "—"}
          </span>
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (_, batch) => (
        <span className="text-sm font-semibold text-foreground">
          {batch._count?.sessions ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, batch) => {
        const cfg = statusConfig[getBatchStatus(batch, now)];
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="My Batches"
        breadcrumbs={[{ label: "Batches", href: "/instructor/batches" }]}
        role="Instructor"
        description={
          loading
            ? "Monitor enrollment stats and scheduling progress across your assigned student cohorts."
            : `${rows.length} cohort${rows.length === 1 ? "" : "s"} · monitor enrollment and scheduling across your assigned batches.`
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        pageSize={10}
        headerVariant="blue"
        toolbar={
          <>
            <div className="flex items-center gap-2">
              <label
                htmlFor="batch-status-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </label>
              <select
                id="batch-status-filter"
                value={
                  statusFilter === "ACTIVE" ||
                  statusFilter === "UPCOMING" ||
                  statusFilter === "COMPLETED"
                    ? statusFilter
                    : "ALL"
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value === "ALL" ? null : e.target.value,
                  )
                }
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="ALL">All ({batches.length})</option>
                <option value="ACTIVE">Active ({counts.ACTIVE})</option>
                <option value="UPCOMING">Upcoming ({counts.UPCOMING})</option>
                <option value="COMPLETED">
                  Completed ({counts.COMPLETED})
                </option>
              </select>
            </div>

            <div className="w-full max-w-xs">
              <SearchInput
                placeholder="Search batch or course..."
                value={search}
                onChange={setSearch}
              />
            </div>
          </>
        }
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconUsers}
            title={
              search.trim()
                ? "No matching cohorts"
                : statusFilter
                  ? "No cohorts in this status"
                  : "No cohorts assigned"
            }
            description={
              search.trim()
                ? "No batches match your search. Try a different keyword."
                : statusFilter
                  ? "Try a different filter to see your other batches."
                  : "Please ask your LMS Admin to assign you to a batch cohort."
            }
          />
        }
      />
    </div>
  );
}
