"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function CreateCoursePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const course = await api.post<{ id: string }>("/api/admin/courses", {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category || undefined,
      });

      router.push(`/admin/courses/${course.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1"
        >
          ← Back to Courses
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Create New Course
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with the basics. You can add modules, videos, and design the
          course page later.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Course Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Advanced TypeScript Patterns"
            className="field"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What will students learn in this course?"
            className="field min-h-[120px] resize-y"
            required
            minLength={10}
          />
          <p className="mt-1 text-xs text-muted">
            You can add rich formatting in the Course Designer later.
          </p>
        </div>

        {/* Category + Price — side by side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. Programming, Design"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Price (₹)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0 for free"
              className="field"
              min={0}
              step={1}
            />
            <p className="mt-1 text-xs text-muted">
              Set to 0 for a free course.
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">What happens next?</p>
          <p>
            The course will be created as a <strong>Draft</strong>. You'll then
            be taken to the course editor where you can add modules, upload
            videos, design the landing page, and publish when ready.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
