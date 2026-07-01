"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IconCalendar, IconVideo, IconUsersGroup, IconBook, IconLink } from "@tabler/icons-react";

interface Course {
  id: string;
  title: string;
  category?: string;
  status: string;
}

interface Batch {
  id: string;
  name: string;
  courseId: string;
  instructor: {
    id: string;
    name: string;
  };
}

interface Module {
  id: string;
  title: string;
  order: number;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ScheduleSessionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  // Data lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  
  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(true);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    moduleId: "",
    instructorOverride: "",
    customJoinUrl: "",
    title: "",
    startDateTime: "",
    endDateTime: "",
  });

  // Fetch courses and instructors on mount
  useEffect(() => {
    api.get<{ courses: Course[] }>("/api/admin/courses?limit=100")
      .then((data) => setCourses(data.courses || []))
      .catch((err: unknown) => {
        console.error("Failed to load courses:", err);
        toast.error("Failed to load courses. Please refresh.");
      })
      .finally(() => setLoadingCourses(false));

    api.get<Instructor[]>("/api/admin/batches/instructors")
      .then((data) => setInstructors(data || []))
      .catch((err: unknown) => {
        console.error("Failed to load instructors:", err);
      })
      .finally(() => setLoadingInstructors(false));
  }, []);

  // Fetch batches and modules when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      Promise.resolve().then(() => {
        setBatches([]);
        setModules([]);
        setForm((prev) => ({ ...prev, batchId: "", moduleId: "", instructorOverride: "", customJoinUrl: "" }));
      });
      return;
    }

    Promise.resolve().then(() => {
      setLoadingBatches(true);
      setLoadingModules(true);
      setForm((prev) => ({ ...prev, batchId: "", moduleId: "", instructorOverride: "", customJoinUrl: "" }));
    });
    
    api.get<Batch[]>(`/api/admin/batches?courseId=${selectedCourseId}`)
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch((err: unknown) => {
        console.error("Failed to load course batches:", err);
        setBatches([]);
      })
      .finally(() => setLoadingBatches(false));

    api.get<{ modules: Module[] }>(`/api/admin/courses/${selectedCourseId}`)
      .then((data) => setModules(data.modules || []))
      .catch((err: unknown) => {
        console.error("Failed to load course modules:", err);
        setModules([]);
      })
      .finally(() => setLoadingModules(false));
  }, [selectedCourseId]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Please select a Course first.");
      return;
    }

    if (!form.batchId) {
      toast.error("Please select a Batch.");
      return;
    }

    // Validate times
    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);

    if (start >= end) {
      toast.error("End time must be after the start time.");
      return;
    }

    if (start < new Date()) {
      toast.error("Start time cannot be in the past.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/sessions", {
        batchId: form.batchId,
        moduleId: form.moduleId || undefined,
        title: form.title,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        customJoinUrl: form.customJoinUrl || undefined,
        instructorOverride: form.instructorOverride || undefined,
      });

      router.push("/admin/sessions");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule live session.");
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
          ← Back to Sessions
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Schedule Live Session
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a course, assign the session to an active student batch, and schedule the online meeting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Course Selector */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <IconBook size={16} className="text-primary" />
            Select Course <span className="text-danger">*</span>
          </label>
          {loadingCourses ? (
            <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="field w-full"
              required
            >
              <option value="">-- Choose a Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Batch Selector (Conditional on Course selection) */}
        {selectedCourseId && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconUsersGroup size={16} className="text-accent" />
              Select Batch <span className="text-danger">*</span>
            </label>
            {loadingBatches ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : batches.length === 0 ? (
              <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-xs text-warning">
                No active student batches found for this course. Please create a batch for this course first.
              </div>
            ) : (
              <select
                value={form.batchId}
                onChange={(e) => update("batchId", e.target.value)}
                className="field w-full"
                required
              >
                <option value="">-- Choose a Student Batch --</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} — Instructor: {batch.instructor?.name || "TBD"}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Module Selector (Conditional on Course selection) */}
        {selectedCourseId && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconBook size={16} className="text-accent" />
              Link to Module
            </label>
            {loadingModules ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : (
              <select
                value={form.moduleId}
                onChange={(e) => update("moduleId", e.target.value)}
                className="field w-full"
              >
                <option value="">-- General / Introductory Session (No specific module) --</option>
                {modules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    Module {mod.order}: {mod.title}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-muted">
              Optional. Linking to a module organizes the session under that course section.
            </p>
          </div>
        )}

        {/* Instructor Override (optional — defaults to batch instructor) */}
        {selectedCourseId && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconUsersGroup size={16} className="text-primary" />
              Session Instructor
            </label>
            {loadingInstructors ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : (
              <select
                value={form.instructorOverride || ""}
                onChange={(e) => update("instructorOverride", e.target.value)}
                className="field w-full"
              >
                <option value="">— Use batch instructor (default)</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.email}) {inst.role === "ADMIN" ? "🛡️ Admin" : "👨‍🏫 Instructor"}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-muted">
              Optional. Override the batch&apos;s default instructor — useful if you (admin) want to lead the session yourself.
            </p>
          </div>
        )}

        {/* Custom Join URL (Optional) */}
        {selectedCourseId && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconLink size={16} className="text-primary" />
              Custom Join URL (Optional)
            </label>
            <input
              type="url"
              value={form.customJoinUrl || ""}
              onChange={(e) => update("customJoinUrl", e.target.value)}
              placeholder="e.g. https://teams.microsoft.com/l/meetup-join/... or Google Meet URL"
              className="field w-full"
            />
            <p className="mt-1 text-xs text-muted">
              Paste a Google Meet, Zoom, or Teams link here. Leave blank to auto-create a Teams meeting via Graph API (requires a Teams license).
            </p>
          </div>
        )}

        {/* Session Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Session Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Session 1: Orientation & Setup"
            className="field"
            required
            minLength={3}
            maxLength={200}
            disabled={!selectedCourseId}
          />
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconCalendar size={16} className="text-primary" />
              Start Date & Time <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.startDateTime}
              onChange={(e) => update("startDateTime", e.target.value)}
              className="field w-full"
              required
              disabled={!selectedCourseId}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconCalendar size={16} className="text-danger" />
              End Date & Time <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.endDateTime}
              onChange={(e) => update("endDateTime", e.target.value)}
              className="field w-full"
              required
              disabled={!selectedCourseId}
            />
          </div>
        </div>

        {/* Teams Notice Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground flex gap-3 items-start">
          <IconVideo size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-0.5">Meeting Link</p>
            <p>
              Provide a Custom Join URL above (Google Meet, Zoom, etc.) — or leave it blank to auto-create a Teams meeting
              via Microsoft Graph (requires a Teams license). Students receive the link in their dashboard.
            </p>
          </div>
        </div>

        {/* Form Actions */}
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
            className="btn-primary flex items-center gap-2"
            disabled={submitting || loadingCourses || !selectedCourseId || !form.batchId}
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Scheduling...
              </>
            ) : (
              "Schedule Session"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
