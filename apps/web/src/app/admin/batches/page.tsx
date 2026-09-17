"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { IconUsersGroup, IconPlus } from "@tabler/icons-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdminWorkflowGuide } from "@/components/admin/AdminWorkflowGuide";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";

type Batch = {
  id: string;
  name: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxStudents: number | null;
  course: { id: string; title: string };
  instructor: { id: string; name: string; email: string } | null;
  package: { id: string; name: string } | null;
  _count: {
    enrollments: number;
    packageEnrollmentCourses: number;
    sessions: number;
  };
};

type PaginatedResponse<T> = {
  batches: T[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 10;

export default function AdminBatchesPage() {
  usePageTitle("Batches");
  return (
    <Suspense fallback={<TableSkeleton rows={6} columns={6} />}>
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "";
  const confirmDelete = useConfirmDialog();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // List query keyed on the active filter/search/page so any change refetches.
  const batchesQuery = useApiQuery<PaginatedResponse<Batch>>(
    ["admin", "batches", statusFilter || "all", search || "all", page],
    "/api/admin/batches",
    {
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    },
  );
  const batches = batchesQuery.data?.batches ?? [];
  const total = batchesQuery.data?.total ?? 0;
  const loading = batchesQuery.isPending;

  // Reset to page 1 whenever the filter or search term changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/batches/${id}`),
    onSuccess: (_data, id) => {
      const name = batches.find((b) => b.id === id)?.name ?? "";
      toast.success(`Batch "${name}" deleted`);
      void batchesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (id: string, name: string) => {
    if (
      !(await confirmDelete({
        title: "Delete Batch",
        message: `Delete batch "${name}"?`,
      }))
    )
      return;
    deleteMutation.mutate(id);
  };

  const columns: DataTableColumn<Batch>[] = [
    {
      key: "name",
      label: "Batch",
      render: (_, batch) => (
        <div className="min-w-0">
          <Link
            href={`/admin/batches/${batch.id}`}
            className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
          >
            {batch.name}
          </Link>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {batch.course?.title ?? batch.package?.name ?? "All Courses"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, batch) => (
        <Badge
          variant={
            batch.status === "ACTIVE"
              ? "success"
              : batch.status === "UPCOMING"
                ? "info"
                : "secondary"
          }
          size="sm"
          dot
        >
          {batch.status}
        </Badge>
      ),
    },
    {
      key: "students",
      label: "Students",
      render: (_, batch) => (
        <span className="text-sm font-semibold text-foreground">
          {batch._count.enrollments + batch._count.packageEnrollmentCourses}
          {batch.maxStudents ? ` / ${batch.maxStudents}` : ""}
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (_, batch) => (
        <span className="text-sm font-semibold text-foreground">
          {batch._count.sessions}
        </span>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      render: (_, batch) => (
        <span className="text-xs text-muted-foreground">
          {new Date(batch.startDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          {" → "}
          {new Date(batch.endDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, batch) => (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/admin/batches/${batch.id}`}>
            <Button variant="secondary" size="sm">
              Manage
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(batch.id, batch.name)}
            disabled={deleteMutation.isPending && deleteMutation.variables === batch.id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <AdminPageHeader
        title="Batch Management"
        description={`${total} batch${total !== 1 ? "es" : ""}`}
        breadcrumbs={[{ label: "Batches", href: "/admin/batches" }]}
        action={
          <Link href="/admin/batches/new">
            <Button leftIcon={<IconPlus size={16} />}>
              Add Batch
            </Button>
          </Link>
        }
      />

      <AdminWorkflowGuide activeStep={3} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { value: "", label: "All" },
            { value: "UPCOMING", label: "Upcoming" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
          ]}
          active={statusFilter}
          onChange={(value) =>
            router.push(
              value ? `/admin/batches?status=${value}` : "/admin/batches",
            )
          }
        />

        <div className="min-w-[200px] max-w-sm">
          <SearchInput
            placeholder="Search batches..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Batch Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : batches.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconUsersGroup}
          title="No batches yet"
          description="Create your first batch to start enrolling students."
          action={
            <Link href="/admin/batches/new" className="mt-4 inline-flex">
              <Button leftIcon={<IconPlus size={16} />}>Add Batch</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={batches}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

