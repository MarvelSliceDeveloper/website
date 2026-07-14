"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PackageOption = { id: string; name: string };
type InstructorOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function CreateBatchPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const [form, setForm] = useState({
    packageId: "",
    instructorId: "",
    name: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    description: "",
  });

  // Fetch active packages and instructors on mount
  useEffect(() => {
    api
      .get<{ packages: any[] }>("/api/admin/packages")
      .then((res) => {
        const active = (res.packages ?? []).filter(
          (p: any) => p.status === "ACTIVE",
        );
        setPackages(active.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    api
      .get<InstructorOption[]>("/api/admin/batches/instructors")
      .then(setInstructors)
      .catch(() => {});
  }, []);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await api.post<{ batches: { id: string }[] }>(
        "/api/admin/batches/bulk",
        {
          packageId: form.packageId,
          instructorId: form.instructorId,
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
          description: form.description || undefined,
        },
      );

      toast.success(
        `Created ${result.batches.length} batch${result.batches.length > 1 ? "es" : ""}`,
      );
      router.push("/admin/batches");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1"
        >
          ← Back to Batches
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Add New Batch
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A batch is created for each course in the selected package.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Batch Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Batch Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Python Batch — June 2025"
            className="field"
            required
          />
        </div>

        {/* Package */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Package <span className="text-danger">*</span>
          </label>
          <Select
            value={form.packageId}
            onValueChange={(v) => update("packageId", v)}
          >
            <SelectTrigger className="field">
              <SelectValue placeholder="Select a package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {packages.length === 0 && (
            <p className="mt-1 text-xs text-warning">
              No active packages found. Create and activate a package first.
            </p>
          )}
        </div>

        {/* Instructor */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Instructor <span className="text-danger">*</span>
          </label>
          <Select
            value={form.instructorId}
            onValueChange={(v) => update("instructorId", v)}
          >
            <SelectTrigger className="field">
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name} ({i.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Start Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="field"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              End Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="field"
              required
            />
          </div>
        </div>

        {/* Max Students + Description */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Max Students
            </label>
            <input
              type="number"
              value={form.maxStudents}
              onChange={(e) => update("maxStudents", e.target.value)}
              placeholder="Leave empty for unlimited"
              className="field"
              min={1}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional notes"
              className="field"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Adding..." : "Add Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
