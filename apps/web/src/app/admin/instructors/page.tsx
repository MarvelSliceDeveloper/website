"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  IconUsers,
  IconPlus,
  IconCheck,
  IconX,
  IconStar,
  IconEye,
  IconEdit,
} from "@tabler/icons-react";

interface Instructor {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
  designation: string | null;
  experience: number | null;
  currentCompany: string | null;
  activeBatches: number;
  totalStudents: number;
  rating: number | null;
  createdAt: string;
}

type ApiResponse = {
  items: Instructor[];
  total: number;
  page: number;
  limit: number;
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-500/15 text-amber-600 border-amber-500/25" },
  APPROVED: { label: "Approved", classes: "bg-success/15 text-success border-success/25" },
  REJECTED: { label: "Rejected", classes: "bg-danger/15 text-danger border-danger/25" },
  ACTIVE: { label: "Active", classes: "bg-blue-500/15 text-blue-600 border-blue-500/25" },
  INACTIVE: { label: "Inactive", classes: "bg-muted/15 text-muted-foreground border-muted/25" },
};

const statusFilters = ["ALL", "PENDING", "APPROVED", "ACTIVE", "INACTIVE"] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitialsColor(name: string) {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-amber-500/15 text-amber-600",
    "bg-emerald-500/15 text-emerald-600",
    "bg-blue-500/15 text-blue-600",
    "bg-purple-500/15 text-purple-600",
    "bg-rose-500/15 text-rose-600",
    "bg-cyan-500/15 text-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <IconStar
          key={star}
          size={12}
          className={star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted"}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function AdminInstructorsPage() {
  usePageTitle("Instructors");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchInstructors() {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(pageSize),
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const data = await api.get<ApiResponse>("/api/admin/instructors", params);
      setInstructors(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setInstructors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInstructors();
  }, [page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleVerify = async (instructorId: string) => {
    try {
      await api.put(`/api/admin/instructors/${instructorId}/verify`);
      toast.success("Instructor verified successfully");
      fetchInstructors();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns: DataTableColumn<Instructor>[] = [
    {
      key: "name",
      label: "Name",
      render: (_, instructor) => (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold ${getInitialsColor(instructor.name)}`}>
            {instructor.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{instructor.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "status",
      label: "Status",
      render: (_, instructor) => {
        const cfg = statusConfig[instructor.status] ?? { label: instructor.status, classes: "bg-muted/15 text-muted-foreground border-muted/25" };
        return (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
            {instructor.status === "APPROVED" && <IconCheck size={10} />}
            {instructor.status === "REJECTED" && <IconX size={10} />}
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "designation",
      label: "Designation",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground">{instructor.designation || "—"}</span>
      ),
    },
    {
      key: "experience",
      label: "Experience",
      render: (_, instructor) => (
        <span className="text-sm text-foreground">{instructor.experience ? `${instructor.experience} yrs` : "—"}</span>
      ),
    },
    {
      key: "currentCompany",
      label: "Current Company",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground">{instructor.currentCompany || "—"}</span>
      ),
    },
    {
      key: "activeBatches",
      label: "Active Batches",
      render: (_, instructor) => (
        <span className="text-sm font-medium text-foreground">{instructor.activeBatches}</span>
      ),
    },
    {
      key: "totalStudents",
      label: "Students",
      render: (_, instructor) => (
        <span className="text-sm font-medium text-foreground">{instructor.totalStudents}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (_, instructor) =>
        instructor.rating ? <StarRating rating={instructor.rating} /> : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(instructor.createdAt)}</span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, instructor) => (
        <div className="flex items-center gap-1">
          <a
            href={`/admin/instructors/${instructor.id}`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="View instructor"
          >
            <IconEye size={14} />
          </a>
          <a
            href={`/admin/instructors/${instructor.id}/edit`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit instructor"
          >
            <IconEdit size={14} />
          </a>
          {instructor.status === "PENDING" && (
            <button
              onClick={() => handleVerify(instructor.id)}
              className="rounded-md border border-success/20 p-1.5 text-success hover:bg-success/10 transition-colors"
              title="Verify instructor"
            >
              <IconCheck size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Instructors"
        description={`${total} instructor${total !== 1 ? "s" : ""} registered`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Instructors", href: "/admin/instructors" },
        ]}
        action={
          <a href="/admin/instructors/new" className="btn-primary text-sm shadow-md flex items-center gap-1.5">
            <IconPlus size={16} /> Add Instructor
          </a>
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? s === "ALL"
                    ? "bg-primary/15 text-primary border-primary/25"
                    : `${statusConfig[s].classes}`
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              {s === "ALL" ? "All" : statusConfig[s].label}
            </button>
          ))}
        </div>

        <div className="max-w-sm w-full sm:w-64">
          <SearchInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={instructors}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconUsers}
            title="No instructors found"
            description={search || statusFilter !== "ALL" ? "Try adjusting your filters." : "No instructors have been added yet."}
          />
        }
      />
    </div>
  );
}
