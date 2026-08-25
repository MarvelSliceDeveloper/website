"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconArrowLeft, IconUser } from "@tabler/icons-react";
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
type CourseOption = {
  id: string;
  courseId: string;
  course: { id: string; title: string; slug: string };
};

type FormState = {
  packageId: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: string;
  description: string;
  defaultDaysToComplete: string;
};

type CourseInstructor = {
  courseId: string;
  instructorId: string;
};

export default function CreateBatchPage() {
  usePageTitle("New Batch");
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);

  const [form, setForm] = useState<FormState>({
    packageId: "",
    name: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    description: "",
    defaultDaysToComplete: "",
  });

  const packagesQuery = useApiQuery<{
    items: Array<{ id: string; name: string; status: string }>;
  }>(["admin", "packages"], "/api/admin/packages");
  const instructorsQuery = useApiQuery<InstructorOption[]>(
    ["admin", "batches", "instructors"],
    "/api/admin/batches/instructors",
  );
  const packageCoursesQuery = useApiQuery<{
    id: string;
    name: string;
    courses: Array<{
      course: { id: string; title: string; slug: string };
    }>;
  }>(
    ["admin", "packages", form.packageId],
    `/api/admin/packages/${form.packageId}`,
    undefined,
    { enabled: !!form.packageId },
  );

  const packages = useMemo(
    () =>
      (packagesQuery.data?.items ?? [])
        .filter((p) => p.status === "ACTIVE")
        .map((p) => ({ id: p.id, name: p.name })),
    [packagesQuery.data],
  );
  const instructors = instructorsQuery.data ?? [];

  const packageCourses = useMemo(
    () =>
      (packageCoursesQuery.data?.courses ?? []).map((pc) => ({
        id: pc.course.id,
        courseId: pc.course.id,
        course: pc.course,
      })),
    [packageCoursesQuery.data],
  );
  const [courseInstructors, setCourseInstructors] = useState<
    CourseInstructor[]
  >([]);

  useEffect(() => {
    setCourseInstructors(
      packageCourses.map((c) => ({ courseId: c.courseId, instructorId: "" })),
    );
  }, [packageCourses]);

  const update = (field: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const updateCourseInstructor = (courseId: string, instructorId: string) =>
    setCourseInstructors((prev) =>
      prev.map((ci) =>
        ci.courseId === courseId ? { ...ci, instructorId } : ci,
      ),
    );

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.packageId) e.packageId = "Please select a package";
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

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        packageId: form.packageId,
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
        description: form.description || undefined,
        defaultDaysToComplete: form.defaultDaysToComplete
          ? Number(form.defaultDaysToComplete)
          : undefined,
      };

      const assigned = courseInstructors.filter(
        (ci) => ci.instructorId && ci.instructorId.trim(),
      );
      if (assigned.length > 0) body.courseInstructors = assigned;

      return api.post<{ id: string; name: string }>("/api/admin/batches", body);
    },
    onSuccess: (result) => {
      toast.success(`Created batch "${result.name}"`);
      router.push("/admin/batches");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError ?? "Please fix the highlighted fields");
      return;
    }

    createBatchMutation.mutate();
  };

  const showError = (field: keyof FormState) =>
    attempted && errors[field] ? (
      <p className="mt-1 text-xs text-danger">{errors[field]}</p>
    ) : null;

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Add Batch"
        description="Select a package and assign instructors to each course."
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

        {/* Per-Course Instructors */}
        {packageCourses.length > 0 && (
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Course Instructors
            </h2>
            <p className="text-xs text-muted-foreground">
              Assign an instructor for each course. Leave empty to assign later.
            </p>
            <div className="divide-y divide-border/50">
              {packageCourses.map((pc, idx) => {
                const ci = courseInstructors.find(
                  (c) => c.courseId === pc.courseId,
                );
                return (
                  <div
                    key={pc.courseId}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {pc.course.title}
                      </p>
                    </div>
                    <div className="w-64 shrink-0">
                      <Select
                        value={ci?.instructorId ?? ""}
                        onValueChange={(v) =>
                          updateCourseInstructor(pc.courseId, v)
                        }
                      >
                        <SelectTrigger className="field w-full">
                          <SelectValue placeholder="Select instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                onChange={(e) =>
                  update("defaultDaysToComplete", e.target.value)
                }
                placeholder="e.g. 30"
                className="field w-full"
                min={1}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Due dates calculated as enrollment date + N days
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
            disabled={createBatchMutation.isPending}
          >
            {createBatchMutation.isPending ? "Adding..." : "Add Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
