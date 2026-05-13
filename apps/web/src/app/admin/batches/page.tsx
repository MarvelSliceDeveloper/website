"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.get<Batch[]>("/api/admin/batches", params);
      setBatches(data);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/batches/${id}`);
      fetchBatches();
    } catch (err: any) {
      alert(err.message || "Failed to delete batch");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Batch Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
        </div>
        <Link href="/admin/batches/new" className="btn-primary">+ Create Batch</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {["", "UPCOMING", "ACTIVE", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
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
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-lg font-semibold text-foreground">No batches yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first batch to start enrolling students.</p>
          <Link href="/admin/batches/new" className="btn-primary mt-4 inline-flex">+ Create Batch</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <div key={batch.id} className="glass-card overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/batches/${batch.id}`}
                      className="text-base font-semibold text-foreground hover:text-primary-hover transition-colors block truncate"
                    >
                      {batch.name}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">{batch.course.title}</p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[batch.status]}`}>
                    {batch.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">{batch._count.enrollments}</p>
                    <p className="text-[10px] text-muted uppercase">Students</p>
                  </div>
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">{batch._count.sessions}</p>
                    <p className="text-[10px] text-muted uppercase">Sessions</p>
                  </div>
                  <div className="panel p-2">
                    <p className="text-lg font-bold text-foreground">{batch.maxStudents ?? "∞"}</p>
                    <p className="text-[10px] text-muted uppercase">Capacity</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="text-muted">Instructor:</span>{" "}
                    <span className="text-foreground">{batch.instructor.name}</span>
                  </p>
                  <p>
                    <span className="text-muted">Dates:</span>{" "}
                    {new Date(batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(batch.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link href={`/admin/batches/${batch.id}`} className="btn-secondary text-xs flex-1 justify-center">
                    Manage
                  </Link>
                  <button
                    onClick={() => handleDelete(batch.id, batch.name)}
                    className="btn-secondary text-xs border-danger/30 text-danger hover:bg-danger/10"
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
