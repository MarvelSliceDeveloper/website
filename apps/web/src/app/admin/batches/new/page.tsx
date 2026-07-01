"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";

type CourseOption = { id: string; title: string };
type InstructorOption = { id: string; name: string; email: string; role: string };

export default function CreateBatchPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const [form, setForm] = useState({
    courseId: "",
    instructorId: "",
    name: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    description: "",
  });

  useEffect(() => {
    api.get<CourseOption[]>("/api/admin/batches/courses").then(setCourses).catch(() => {});
    api.get<InstructorOption[]>("/api/admin/batches/instructors").then(setInstructors).catch(() => {});
  }, []);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const batch = await api.post<{ id: string }>("/api/admin/batches", {
        courseId: form.courseId,
        instructorId: form.instructorId,
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
        description: form.description || undefined,
      });

      router.push(`/admin/batches/${batch.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1">
          ← Back to Batches
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Create New Batch</h1>
        <p className="mt-1 text-sm text-muted-foreground">A batch is a cohort of students taking a course together.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Batch Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Batch Name <span className="text-danger">*</span>
          </label>
          <input
            type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Python Batch — June 2025" className="field" required
          />
        </div>

        {/* Course + Instructor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Course <span className="text-danger">*</span>
            </label>
            <select value={form.courseId} onChange={(e) => update("courseId", e.target.value)} className="field" required>
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="mt-1 text-xs text-warning">No published courses found. Publish a course first.</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Instructor <span className="text-danger">*</span>
            </label>
            <select value={form.instructorId} onChange={(e) => update("instructorId", e.target.value)} className="field" required>
              <option value="">Select an instructor</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Start Date <span className="text-danger">*</span>
            </label>
            <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="field" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              End Date <span className="text-danger">*</span>
            </label>
            <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="field" required />
          </div>
        </div>

        {/* Max Students + Description */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Max Students</label>
            <input type="number" value={form.maxStudents} onChange={(e) => update("maxStudents", e.target.value)} placeholder="Leave empty for unlimited" className="field" min={1} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Optional notes" className="field" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
