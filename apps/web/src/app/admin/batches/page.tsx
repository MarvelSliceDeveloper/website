"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { IconUsersGroup } from "@tabler/icons-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdminWorkflowGuide } from "@/components/admin/AdminWorkflowGuide";
import { SearchInput } from "@/components/ui/SearchInput";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import PaginationBar from "@/components/student/PaginationBar";


type Batch = {
  id: string;
  name: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxStudents: number | null;
  course: { id: string; title: string };
  instructor: { id: string; name: string; email: string };
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

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-accent/15 text-accent border-accent/25",
  ACTIVE: "bg-success/15 text-success border-success/25",
  COMPLETED: "bg-muted/15 text-muted border-muted/25",
};

const PAGE_SIZE = 10;

export default function AdminBatchesPage() {
  usePageTitle("Batches");
  return (
    <Suspense fallback={<TableSkeleton rows={6} columns={7} />}>
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const data = await api.get<PaginatedResponse<Batch>>(
        "/api/admin/batches",
        params,
      );
      setBatches(data.batches);
      setTotal(data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Reset to page 1 whenever the filter or search term changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/batches/${id}`);
      toast.success(`Batch "${name}" deleted`);
      fetchBatches();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns: DataTableColumn<Batch>[] = [
    {
      key: "name",
      label: "Batch",
      render: (_, batch) => (
        <div className="min-w-0">
          <Link
            href={`/admin/batches/${batch.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary-hover transition-colors truncate block"
          >
            {batch.name}
          </Link>
          <p className="text-xs text-muted truncate">
            {batch.course?.title ?? batch.package?.name ?? "All Courses"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, batch) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[batch.status]}`}
        >
          {batch.status}
        </span>
      ),
    },
    {
      key: "instructor",
      label: "Instructor",
      render: (_, batch) => (
        <span className="text-sm text-muted-foreground">
          {batch.instructor.name}
        </span>
      ),
    },
    {
      key: "students",
      label: "Students",
      render: (_, batch) => (
        <span className="text-sm text-muted-foreground">
          {batch._count.enrollments + batch._count.packageEnrollmentCourses}
          {batch.maxStudents ? ` / ${batch.maxStudents}` : ""}
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (_, batch) => (
        <span className="text-sm text-muted-foreground">
          {batch._count.sessions}
        </span>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      render: (_, batch) => (
        <span className="text-xs text-muted">
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
          <Link
            href={`/admin/batches/${batch.id}`}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Manage
          </Link>
          <button
            onClick={() => handleDelete(batch.id, batch.name)}
            className="btn-danger text-xs px-3 py-1.5"
          >
            Delete
          </button>
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
        breadcrumbs={[
          { label: "Batches", href: "/admin/batches" },
        ]}
        action={
          <Link href="/admin/batches/new" className="btn-primary">
            + Add Batch
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
            router.push(value ? `/admin/batches?status=${value}` : "/admin/batches")
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
        <TableSkeleton rows={6} columns={7} />
      ) : batches.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconUsersGroup}
          title="No batches yet"
          description="Create your first batch to start enrolling students."
          action={
            <Link href="/admin/batches/new" className="btn-primary inline-flex">
              + Add Batch
            </Link>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} data={batches} />
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}