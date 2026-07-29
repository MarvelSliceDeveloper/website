"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePageTitle } from "@/lib/use-page-title";
import { IconPackage, IconPlus, IconEye, IconTrash } from "@tabler/icons-react";

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
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

      <FilterTabs
        tabs={[
          { value: "", label: "All" },
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Package Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : packages.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="glass-card p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <StatusBadge status={pkg.status} config={statusConfig} />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted">
                <span>
                  {pkg.courses.length} course
                  {pkg.courses.length !== 1 ? "s" : ""}
                </span>
                <span>
                  {pkg._count.enrollments} enrollment
                  {pkg._count.enrollments !== 1 ? "s" : ""}
                </span>
                <span>
                  {pkg.price != null
                    ? `₹${(pkg.price / 100).toLocaleString("en-IN")}`
                    : "Free"}
                </span>
              </div>

              {pkg.courses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pkg.courses.slice(0, 3).map((pc) => (
                    <span
                      key={pc.id}
                      className="rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {pc.course.title}
                    </span>
                  ))}
                  {pkg.courses.length > 3 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      +{pkg.courses.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
