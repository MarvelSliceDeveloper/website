"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import ModuleStudyMaterialsSection from "./_components/ModuleStudyMaterialsSection";

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: any[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price: number;
  category: string | null;
  tags: string[] | null;
  learningObjectives: string[] | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  modules: Module[];
  _count: { batches: number };
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const ALLOWED_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const [thumbnailSuccess, setThumbnailSuccess] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"details" | "modules" | "materials">("details");

  // Edit form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
  });

  // Module add form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
  });
  const [addingModule, setAddingModule] = useState(false);

  // Editing module
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleForm, setEditModuleForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
  });

  const fetchCourse = useCallback(async () => {
    try {
      const data = await api.get<Course>(`/api/admin/courses/${id}`);
      setCourse(data);
      setForm({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category || "",
      });
    } catch {
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // --- Course Actions ---

  const handleSaveCourse = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/admin/courses/${id}`, {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category || null,
      });
      setSuccess("Course saved!");
      fetchCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailError("");
    setThumbnailSuccess("");

    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      setThumbnailError("Thumbnail must be a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      setThumbnailError("Thumbnail must be 5 MB or smaller.");
      return;
    }

    setThumbnailUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("thumbnail", file);
      await api.post(`/api/admin/courses/${id}/thumbnail`, uploadData);
      setThumbnailSuccess("Thumbnail updated.");
      fetchCourse();
      setTimeout(() => setThumbnailSuccess(""), 3000);
    } catch (err: any) {
      setThumbnailError(err.message || "Failed to upload thumbnail");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const result = await api.post<{ published: boolean; checklist: any[] }>(
        `/api/admin/courses/${id}/publish`
      );
      if (!result.published) {
        const fails = result.checklist
          .filter((c: any) => !c.passed)
          .map((c: any) => `• ${c.item}`)
          .join("\n");
        alert(`Cannot publish:\n${fails}`);
        return;
      }
      fetchCourse();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.post(`/api/admin/courses/${id}/unpublish`);
      fetchCourse();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Archive this course? Students will lose access.")) return;
    try {
      await api.delete(`/api/admin/courses/${id}`);
      router.push("/admin/courses");
    } catch (err: any) {
      alert(err.message || "Failed to archive course");
    }
  };

  // --- Module Actions ---

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingModule(true);
    try {
      await api.post(`/api/admin/courses/${id}/modules`, {
        title: moduleForm.title,
        description: moduleForm.description || undefined,
        videoUrl: moduleForm.videoUrl || undefined,
      });
      setModuleForm({ title: "", description: "", videoUrl: "" });
      setShowModuleForm(false);
      fetchCourse();
    } catch (err: any) {
      alert(err.message || "Failed to add module");
    } finally {
      setAddingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Delete module "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/courses/modules/${moduleId}`);
      fetchCourse();
    } catch {
      alert("Failed to delete module");
    }
  };

  const startEditModule = (mod: Module) => {
    setEditingModuleId(mod.id);
    setEditModuleForm({
      title: mod.title,
      description: mod.description || "",
      videoUrl: mod.videoUrl || "",
    });
  };

  const handleSaveModule = async (moduleId: string) => {
    try {
      await api.put(`/api/admin/courses/modules/${moduleId}`, {
        title: editModuleForm.title,
        description: editModuleForm.description || undefined,
        videoUrl: editModuleForm.videoUrl || undefined,
      });
      setEditingModuleId(null);
      fetchCourse();
    } catch (err: any) {
      alert(err.message || "Failed to update module");
    }
  };

  const handleMoveModule = async (moduleId: string, direction: "up" | "down") => {
    if (!course) return;
    const modules = [...course.modules].sort((a, b) => a.order - b.order);
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === modules.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [modules[idx], modules[swapIdx]] = [modules[swapIdx], modules[idx]];

    try {
      await api.patch(`/api/admin/courses/${id}/modules/reorder`, {
        moduleIds: modules.map((m) => m.id),
      });
      fetchCourse();
    } catch {
      alert("Failed to reorder");
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">Course not found</p>
        <Link href="/admin/courses" className="btn-primary mt-4 inline-flex">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/courses"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1"
          >
            ← Back to Courses
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[course.status]}`}
            >
              {course.status}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Slug: /{course.slug} · {sortedModules.length} module{sortedModules.length !== 1 ? "s" : ""} · {course._count.batches} batch{course._count.batches !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          {course.status === "DRAFT" && (
            <button onClick={handlePublish} className="btn-primary">
              Publish
            </button>
          )}
          {course.status === "PUBLISHED" && (
            <button onClick={handleUnpublish} className="btn-secondary">
              Unpublish
            </button>
          )}
          <button onClick={handleDeleteCourse} className="btn-danger">
            Archive
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "details"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Course Details
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "modules"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Modules
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "materials"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Study Materials
        </button>
      </div>

      {/* Course Details Tab */}
      {activeTab === "details" && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Course Details</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Thumbnail
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-28 overflow-hidden rounded-lg border border-border bg-card flex items-center justify-center text-xl">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt="Course thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "\ud83d\udcda"
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleThumbnailUpload(file);
                    }
                    event.target.value = "";
                  }}
                  className="field"
                  disabled={thumbnailUploading}
                />
                <p className="text-xs text-muted">JPG, PNG, or WebP. Max 5 MB.</p>
                {thumbnailError && (
                  <p className="text-xs text-danger">{thumbnailError}</p>
                )}
                {thumbnailSuccess && (
                  <p className="text-xs text-success">{thumbnailSuccess}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="field min-h-[100px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="field"
                min={0}
              />
            </div>
          </div>

          <button
            onClick={handleSaveCourse}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Modules ({sortedModules.length})
            </h2>
            <button
              onClick={() => setShowModuleForm(!showModuleForm)}
              className="btn-secondary text-xs"
            >
              {showModuleForm ? "Cancel" : "+ Add Module"}
            </button>
          </div>

          {/* Add Module Form */}
          {showModuleForm && (
            <form onSubmit={handleAddModule} className="glass-card p-4 space-y-3">
              <input
                type="text"
                value={moduleForm.title}
                onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Module title"
                className="field"
                required
              />
              <input
                type="text"
                value={moduleForm.description}
                onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description (optional)"
                className="field"
              />
              <input
                type="url"
                value={moduleForm.videoUrl}
                onChange={(e) => setModuleForm((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="Video URL — YouTube, Vimeo, Loom, or direct link"
                className="field"
              />
              <button type="submit" disabled={addingModule} className="btn-primary text-sm">
                {addingModule ? "Adding..." : "Add Module"}
              </button>
            </form>
          )}

          {/* Module List */}
          {sortedModules.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No modules yet. Add your first module above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedModules.map((mod, idx) => (
                <div key={mod.id} className="glass-card p-4">
                  {editingModuleId === mod.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editModuleForm.title}
                        onChange={(e) => setEditModuleForm((p) => ({ ...p, title: e.target.value }))}
                        className="field"
                      />
                      <input
                        type="text"
                        value={editModuleForm.description}
                        onChange={(e) => setEditModuleForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description"
                        className="field"
                      />
                      <input
                        type="url"
                        value={editModuleForm.videoUrl}
                        onChange={(e) => setEditModuleForm((p) => ({ ...p, videoUrl: e.target.value }))}
                        placeholder="Video URL"
                        className="field"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveModule(mod.id)} className="btn-primary text-xs">
                          Save
                        </button>
                        <button onClick={() => setEditingModuleId(null)} className="btn-secondary text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start gap-3">
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button
                          onClick={() => handleMoveModule(mod.id, "up")}
                          disabled={idx === 0}
                          className="text-muted hover:text-foreground disabled:opacity-20 text-xs"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveModule(mod.id, "down")}
                          disabled={idx === sortedModules.length - 1}
                          className="text-muted hover:text-foreground disabled:opacity-20 text-xs"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Order number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary-hover">
                        {idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{mod.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {mod.videoType && (
                            <span className="text-[10px] font-medium uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                              {mod.videoType}
                            </span>
                          )}
                          {mod.isFreePreview && (
                            <span className="text-[10px] font-medium uppercase bg-success/15 text-success px-1.5 py-0.5 rounded">
                              Free Preview
                            </span>
                          )}
                          {mod.durationSeconds && (
                            <span className="text-xs text-muted">
                              {Math.floor(mod.durationSeconds / 60)}m {mod.durationSeconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEditModule(mod)}
                          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          className="text-xs font-medium text-danger hover:text-danger/80 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Study Materials Tab */}
      {activeTab === "materials" && (
        <ModuleStudyMaterialsSection
          courseId={id}
          modules={course.modules}
          onResourcesUpdated={fetchCourse}
        />
      )}
    </div>
  );
}
