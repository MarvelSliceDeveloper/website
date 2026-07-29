"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconArrowLeft } from "@tabler/icons-react";
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

type FormState = {
  packageId: string;
  instructorId: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: string;
  description: string;
  defaultDaysToComplete: string;
  lateSubmissionPenaltyPercent: string;
};

export default function CreateBatchPage() {
  usePageTitle("New Batch");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const [form, setForm] = useState<FormState>({
    packageId: "",
    instructorId: "",
    name: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    description: "",
    defaultDaysToComplete: "",
    lateSubmissionPenaltyPercent: "25",
  });

  // Fetch active packages and instructors on mount
  useEffect(() => {
    api
      .get<{ packages: Array<{ id: string; name: string; status: string }> }>(
        "/api/admin/packages",
      )
      .then((res) => {
        const active = (res.packages ?? []).filter(
          (p) => p.status === "ACTIVE",
        );
        setPackages(active.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    api
      .get<InstructorOption[]>("/api/admin/batches/instructors")
      .then(setInstructors)
      .catch(() => {});
  }, []);

  const update = (field: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.packageId) e.packageId = "Please select a package";
    if (!form.instructorId) e.instructorId = "Please select an instructor";
    if (form.name.trim().length < 3)
      e.name = "Name must be at least 3 characters";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      e.endDate = "End date must be after the start date";
    }
    if (form.maxStudents && Number(form.maxStudents) < 1) {
      e.maxStudents = "Max students must be at least 1";
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError ?? "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<
        | { id: string; name: string }
        | { message: string; batches: { id: string; name: string }[] }
      >("/api/admin/batches", {
        packageId: form.packageId,
        instructorId: form.instructorId,
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
        description: form.description || undefined,
        defaultDaysToComplete: form.defaultDaysToComplete
          ? Number(form.defaultDaysToComplete)
          : undefined,
        lateSubmissionPenaltyPercent: form.lateSubmissionPenaltyPercent
          ? Number(form.lateSubmissionPenaltyPercent)
          : undefined,
      });

      if ("batches" in result) {
        toast.success(result.message);
      } else {
        toast.success(`Created batch "${result.name}"`);
      }
      router.push("/admin/batches");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (field: keyof FormState) =>
    attempted && errors[field] ? (
      <p className="mt-1 text-xs text-danger">{errors[field]}</p>
    ) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        title="Add Batch"
        description="Select a package to create a batch for each of its courses."
        breadcrumbs={[
          { label: "Batches", href: "/admin/batches" },
          { label: "Add", href: "/admin/batches/new" },
        ]}
        action={
          <Link
            href="/admin/batches"
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Batch Details
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Package <span className="text-danger">*</span>
            </label>
            <Select
              value={form.packageId}
              onValueChange={(v) => update("packageId", v)}
            >
              <SelectTrigger className="field w-full">
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
            {showError("packageId")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Instructor <span className="text-danger">*</span>
            </label>
            <Select
              value={form.instructorId}
              onValueChange={(v) => update("instructorId", v)}
            >
              <SelectTrigger className="field w-full">
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
            {showError("instructorId")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Batch Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Python Batch — June 2025"
              className="field w-full"
            />
            {showError("name")}
          </div>

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
            />
            {showError("startDate")}
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
            />
            {showError("endDate")}
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
            {showError("maxStudents")}
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
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Submission Settings
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Default Days to Complete
              </label>
              <input
                type="number"
                value={form.defaultDaysToComplete}
                onChange={(e) => update("defaultDaysToComplete", e.target.value)}
                placeholder="e.g. 30"
                className="field w-full"
                min={1}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Due dates calculated as enrollment date + N days
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Late Submission Penalty %
              </label>
              <input
                type="number"
                value={form.lateSubmissionPenaltyPercent}
                onChange={(e) => update("lateSubmissionPenaltyPercent", e.target.value)}
                placeholder="25"
                className="field w-full"
                min={0}
                max={100}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default penalty for late submissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/batches" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !isValid}
          >
            {submitting ? "Adding..." : "Add Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
