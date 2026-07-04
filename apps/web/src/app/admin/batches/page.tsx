"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { IconUsersGroup } from "@tabler/icons-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/admin/EmptyState";

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
  _count: { enrollments: number; sessions: number };
};

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-accent/15 text-accent border-accent/25",
  ACTIVE: "bg-success/15 text-success border-success/25",
  COMPLETED: "bg-muted/15 text-muted border-muted/25",
};

export default function AdminBatchesPage() {
  return (
    <Suspense fallback={<CardSkeleton count={6} />}>
      <BatchesPageContent />
    </Suspense>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async (status: string) => {
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const data = await api.get<Batch[]>("/api/admin/batches", params);
      setBatches(data);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get<Batch[]>(
        "/api/admin/batches",
        statusFilter ? { status: statusFilter } : {},
      )
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/batches/${id}`);
      toast.success(`Batch "${name}" deleted`);
      fetchBatches(statusFilter);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <AdminPageHeader
        title="Batch Management"
        description={`${batches.length} batch${batches.length !== 1 ? "es" : ""}`}
        action={
          <Link href="/admin/batches/new" className="btn-primary">
            + Create Batch
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-1.5">
        {["", "UPCOMING", "ACTIVE", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() =>
              router.push(s ? `/admin/batches?status=${s}` : "/admin/batches")
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-primary/15 text-primary-hover border border-primary/25"
                : "text-muted-foreground hover:bg-card-hover border border-transparent"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Batch Cards */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={IconUsersGroup}
          title="No batches yet"
          description="Create your first batch to start enrolling students."
          action={
            <Link href="/admin/batches/new" className="btn-primary inline-flex">
              + Create Batch
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/batches/${batch.id}`}
                      className="text-base font-semibold text-foreground hover:text-primary-hover transition-colors block truncate"
                    >
                      {batch.name}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">
                      {batch.course.title}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[batch.status]}`}
                  >
                    {batch.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">
                      {batch._count.enrollments}
                    </p>
                    <p className="text-[10px] text-muted uppercase">Students</p>
                  </div>
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">
                      {batch._count.sessions}
                    </p>
                    <p className="text-[10px] text-muted uppercase">Sessions</p>
                  </div>
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">
                      {batch.maxStudents ?? "∞"}
                    </p>
                    <p className="text-[10px] text-muted uppercase">Capacity</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="text-muted">Instructor:</span>{" "}
                    <span className="text-foreground">
                      {batch.instructor.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Dates:</span>{" "}
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
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/admin/batches/${batch.id}`}
                    className="btn-secondary text-xs flex-1 justify-center"
                  >
                    Manage
                  </Link>
                  <button
                    onClick={() => handleDelete(batch.id, batch.name)}
                    className="btn-danger text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
