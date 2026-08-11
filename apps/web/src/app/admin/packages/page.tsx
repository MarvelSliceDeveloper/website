"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import PaginationBar from "@/components/student/PaginationBar";
import { usePageTitle } from "@/lib/use-page-title";
import { IconPackage, IconPlus, IconEye, IconTrash } from "@tabler/icons-react";
import { AdminWorkflowGuide } from "@/components/admin/AdminWorkflowGuide";

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isInternship?: boolean;
  createdAt: string;
  courses: {
    id: string;
    course: { id: string; title: string; slug: string };
  }[];
  _count: { enrollments: number };
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  DRAFT: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ACTIVE: {
    label: "Active",
    classes: "bg-success/15 text-success border-success/25",
  },
  ARCHIVED: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

export default function AdminPackagesPage() {
  usePageTitle("Packages");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.get<{ items: Package[] }>(
        "/api/admin/packages",
        params,
      );
      setPackages(data.items || []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete package "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/packages/${id}`);
      toast.success("Package deleted");
      fetchPackages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((pkg) => {
      const courseTitles = pkg.courses.map((c) => c.course.title).join(" ");
      return (
        pkg.name.toLowerCase().includes(q) ||
        (pkg.description ?? "").toLowerCase().includes(q) ||
        courseTitles.toLowerCase().includes(q) ||
        (pkg.isInternship ? "internship" : "").includes(q)
      );
    });
  }, [packages, search]);

  const total = filteredPackages.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePackages = filteredPackages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns: DataTableColumn<Package>[] = [
    {
      key: "name",
      label: "Package",
      render: (_, pkg) => (
        <div className="min-w-0">
          <Link
            href={`/admin/packages/${pkg.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary-hover transition-colors truncate block"
          >
            {pkg.name}
          </Link>
          {pkg.description && (
            <p className="text-xs text-muted truncate">{pkg.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "courses",
      label: "Courses",
      render: (_, pkg) => (
        <div className="flex flex-wrap gap-1 max-w-[260px]">
          {pkg.courses.slice(0, 2).map((pc) => (
            <span
              key={pc.id}
              className="rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              {pc.course.title}
            </span>
          ))}
          {pkg.courses.length > 2 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{pkg.courses.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (_, pkg) => (
        <span className="text-sm font-medium text-foreground">
          {pkg.price != null
            ? `₹${(pkg.price / 100).toLocaleString("en-IN")}`
            : "Free"}
        </span>
      ),
    },
    {
      key: "enrollments",
      label: "Enrollments",
      render: (_, pkg) => (
        <span className="text-sm text-muted-foreground">
          {pkg._count.enrollments}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, pkg) => (
        <div className="flex items-center gap-1.5">
          {pkg.isInternship && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Internship
            </span>
          )}
          <StatusBadge status={pkg.status} config={statusConfig} />
        </div>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, pkg) => (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/admin/packages/${pkg.id}`}
            className="btn-secondary text-xs flex items-center gap-1"
          >
            <IconEye size={14} stroke={1.5} />
            View
          </Link>
          {pkg.status === "DRAFT" && (
            <button
              onClick={() => handleDelete(pkg.id, pkg.name)}
              className="btn-danger text-xs flex items-center gap-1"
            >
              <IconTrash size={14} stroke={1.5} />
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Packages"
        description="Create and manage course bundles for students."
        breadcrumbs={[
          { label: "Packages", href: "/admin/packages" },
        ]}
        action={
          <Link
            href="/admin/packages/new"
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <IconPlus size={16} stroke={1.5} />
            Add Package
          </Link>
        }
      />

      <AdminWorkflowGuide activeStep={2} />

      <FilterTabs
        tabs={[
          { value: "", label: "All" },
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        active={statusFilter}
        onChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />

      <div className="min-w-[200px] max-w-sm">
        <SearchInput
          placeholder="Search packages..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Package Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filteredPackages.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconPackage}
          title="No packages yet"
          description="Create your first package to bundle courses together."
          action={
            <Link href="/admin/packages/new" className="btn-primary text-sm">
              Add Package
            </Link>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} data={visiblePackages} />
          <PaginationBar
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
