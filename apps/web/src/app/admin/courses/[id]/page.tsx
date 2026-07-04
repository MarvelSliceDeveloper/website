"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import ModuleStudyMaterialsSection from "./_components/ModuleStudyMaterialsSection";
import { toast } from "sonner";
import {
  IconGripVertical,
  IconBrandYoutube,
  IconPlayerPlay,
  IconFileDescription,
  IconQuestionMark,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconX,
} from "@tabler/icons-react";

type Resource = {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: Resource[];
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  lessons: Lesson[];
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

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  batch: { id: string; name: string };
  module: { id: string; title: string } | null;
  recording: { id: string; syncedAt: string } | null;
};

type Recording = {
  id: string;
  sharePointUrl: string;
  duration: number;
  syncedAt: string;
  session: {
    id: string;
    scheduledAt: string;
    joinUrl: string;
    module: { id: string; title: string } | null;
    batch: { id: string; name: string };
  };
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
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "details" | "content" | "materials" | "sessions" | "recordings"
  >("details");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
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
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    api
      .get<Course>(`/api/admin/courses/${id}`)
      .then((data) => {
        setCourse(data);
        setForm({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category || "",
        });
      })
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveCourse = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/courses/${id}`, {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category || null,
      });
      toast.success("Course saved!");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      toast.error("Thumbnail must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error("Thumbnail must be 5 MB or smaller.");
      return;
    }
    setThumbnailUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("thumbnail", file);
      await api.post(`/api/admin/courses/${id}/thumbnail`, uploadData);
      toast.success("Thumbnail updated.");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload thumbnail",
      );
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const result = await api.post<{
        published: boolean;
        checklist: ChecklistItem[];
      }>(`/api/admin/courses/${id}/publish`);
      if (!result.published) {
        const fails = result.checklist
          .filter((c: ChecklistItem) => !c.passed)
          .map((c: ChecklistItem) => `\u2022 ${c.item}`)
          .join("\n");
        toast.error(`Cannot publish:\n${fails}`);
        return;
      }
      toast.success("Course published");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.post(`/api/admin/courses/${id}/unpublish`);
      toast.success("Course unpublished");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unpublish");
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Archive this course? Students will lose access.")) return;
    try {
      await api.delete(`/api/admin/courses/${id}`);
      toast.success("Course archived");
      router.push("/admin/courses");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive course",
      );
    }
  };

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
        <p className="text-lg font-semibold text-foreground">
          Course not found
        </p>
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
            <h1 className="text-2xl font-bold text-foreground">
              {course.title}
            </h1>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[course.status]}`}
            >
              {course.status}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Slug: /{course.slug} · {sortedModules.length} module
            {sortedModules.length !== 1 ? "s" : ""} · {course._count.batches}{" "}
            batch{course._count.batches !== 1 ? "es" : ""}
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/50">
        <TabButton
          label="Course Details"
          active={activeTab === "details"}
          onClick={() => setActiveTab("details")}
        />
        <TabButton
          label="Content"
          active={activeTab === "content"}
          onClick={() => setActiveTab("content")}
        />
        <TabButton
          label="Study Materials"
          active={activeTab === "materials"}
          onClick={() => setActiveTab("materials")}
        />
        <TabButton
          label="Live Sessions"
          active={activeTab === "sessions"}
          onClick={() => setActiveTab("sessions")}
        />
        <TabButton
          label="Recordings"
          active={activeTab === "recordings"}
          onClick={() => setActiveTab("recordings")}
        />
      </div>

      {/* Course Details Tab */}
      {activeTab === "details" && (
        <CourseDetailsTab
          course={course}
          form={form}
          setForm={setForm}
          thumbnailUploading={thumbnailUploading}
          saving={saving}
          onThumbnailUpload={handleThumbnailUpload}
          onSave={handleSaveCourse}
        />
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <ContentTab
          courseId={id}
          modules={sortedModules}
          onContentChanged={fetchCourse}
        />
      )}

      {/* Study Materials Tab */}
      {activeTab === "materials" && (
        <ModuleStudyMaterialsSection
          courseId={id}
          modules={course.modules}
          onResourcesUpdated={fetchCourse}
        />
      )}

      {/* Live Sessions Tab */}
      {activeTab === "sessions" && <SessionsTab courseId={id} />}

      {/* Recordings Tab */}
      {activeTab === "recordings" && <RecordingsTab courseId={id} />}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

type ChecklistItem = {
  item: string;
  passed: boolean;
  message?: string;
};

type CourseFormData = {
  title: string;
  description: string;
  price: number;
  category: string;
};

function CourseDetailsTab({
  course,
  form,
  setForm,
  thumbnailUploading,
  saving,
  onThumbnailUpload,
  onSave,
}: {
  course: Course;
  form: CourseFormData;
  setForm: React.Dispatch<React.SetStateAction<CourseFormData>>;
  thumbnailUploading: boolean;
  saving: boolean;
  onThumbnailUpload: (file: File) => void;
  onSave: () => void;
}) {
  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Course Details
      </h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Thumbnail
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-28 overflow-hidden rounded-lg border border-border bg-card flex items-center justify-center text-xl">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt="Course thumbnail"
                width={112}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              "\uD83D\uDCDA"
            )}
          </div>
          <div className="space-y-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onThumbnailUpload(file);
                event.target.value = "";
              }}
              className="field"
              disabled={thumbnailUploading}
            />
            <p className="text-xs text-muted">JPG, PNG, or WebP. Max 5 MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) =>
            setForm((p: CourseFormData) => ({ ...p, title: e.target.value }))
          }
          className="field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((p: CourseFormData) => ({
              ...p,
              description: e.target.value,
            }))
          }
          className="field min-h-[100px] resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Category
          </label>
          <input
            type="text"
            value={form.category}
            onChange={(e) =>
              setForm((p: CourseFormData) => ({
                ...p,
                category: e.target.value,
              }))
            }
            className="field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Price (\u20B9)
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm((p: CourseFormData) => ({
                ...p,
                price: Number(e.target.value),
              }))
            }
            className="field"
            min={0}
          />
        </div>
      </div>

      <button onClick={onSave} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

// --- Content Tab — Visual Course Builder ---

function ContentTab({
  courseId,
  modules,
  onContentChanged,
}: {
  courseId: string;
  modules: Module[];
  onContentChanged: () => void;
}) {
  const [items, setItems] = useState(modules);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(modules);
  }, [modules]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };
  const handleDragLeave = () => {
    setOverIndex(null);
  };
  const handleDrop = async (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) {
      reset();
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIdx, 0, moved);
    setItems(reordered);
    try {
      await api.patch(`/api/admin/courses/${courseId}/modules/reorder`, {
        moduleIds: reordered.map((m) => m.id),
      });
      onContentChanged();
    } catch {
      toast.error("Failed to reorder");
      onContentChanged();
    }
    reset();
  };
  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Course Builder
        </h2>
        <span className="text-xs text-muted">
          {items.length} module{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-10 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <IconPlus size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">No modules yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Add your first module to start building the course content. Drag to
            reorder anytime.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((mod, idx) => (
            <div key={mod.id}>
              {overIndex === idx && dragIndex !== idx && overIndex !== null && (
                <div className="h-1 rounded-full bg-primary/40 mx-1 transition-all" />
              )}
              <ModuleCard
                module={mod}
                index={idx}
                courseId={courseId}
                onChanged={onContentChanged}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(idx)}
                isDragging={dragIndex === idx}
              />
            </div>
          ))}
        </div>
      )}

      <AddModuleForm courseId={courseId} onAdded={onContentChanged} />
    </div>
  );
}

function ModuleCard({
  module: mod,
  index,
  courseId,
  onChanged,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
}: {
  module: Module;
  index: number;
  courseId: string;
  onChanged: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isDragging: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: mod.title,
    description: mod.description || "",
  });
  const [lessonDragIdx, setLessonDragIdx] = useState<number | null>(null);
  const [lessonOverIdx, setLessonOverIdx] = useState<number | null>(null);

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/${mod.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update module",
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete module "${mod.title}" and all its lessons?`)) return;
    try {
      await api.delete(`/api/admin/courses/modules/${mod.id}`);
      onChanged();
    } catch {
      toast.error("Failed to delete module");
    }
  };

  const handleLessonDrop = async (dropIdx: number) => {
    if (lessonDragIdx === null || lessonDragIdx === dropIdx) {
      setLessonDragIdx(null);
      setLessonOverIdx(null);
      return;
    }
    const reordered = [...mod.lessons];
    const [moved] = reordered.splice(lessonDragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setLessonDragIdx(null);
    setLessonOverIdx(null);
    try {
      await api.patch(`/api/admin/courses/modules/${mod.id}/lessons/reorder`, {
        lessonIds: reordered.map((l) => l.id),
      });
      onChanged();
    } catch {
      toast.error("Failed to reorder lessons");
      onChanged();
    }
  };

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-200 ${isDragging ? "opacity-40 scale-[0.97]" : "hover:border-primary/30"}`}
    >
      {/* Module header */}
      <div className="p-3.5 flex items-start gap-3">
        <div
          className="flex flex-col items-center gap-1 pt-1.5 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors"
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            onDrop();
          }}
          onDragEnd={() => {}}
        >
          <IconGripVertical size={16} />
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
                className="field text-sm"
                autoFocus
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description"
                className="field text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <IconDeviceFloppy size={14} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {mod.title}
              </p>
              {mod.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {mod.description}
                </p>
              )}
            </>
          )}
          {!editing && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted">
              <span>
                {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted hover:text-foreground transition-colors p-1"
            >
              <span
                className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              >
                &#x25B6;
              </span>
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-danger/5"
              title="Delete module"
            >
              <IconTrash size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Lessons list (collapsible) */}
      {expanded && (
        <div className="border-t border-border/40">
          {mod.lessons.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                No lessons yet. Add one below.
              </p>
            </div>
          ) : (
            <div className="py-2 px-2 space-y-1">
              {mod.lessons.map((lesson, lidx) => (
                <div key={lesson.id}>
                  {lessonOverIdx === lidx &&
                    lessonDragIdx !== lidx &&
                    lessonOverIdx !== null && (
                      <div className="h-0.5 rounded-full bg-primary/30 mx-6" />
                    )}
                  <LessonCard
                    lesson={lesson}
                    index={lidx}
                    onChanged={onChanged}
                    onDragStart={() => setLessonDragIdx(lidx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setLessonOverIdx(lidx);
                    }}
                    onDragLeave={() => setLessonOverIdx(null)}
                    onDrop={() => handleLessonDrop(lidx)}
                    isDragging={lessonDragIdx === lidx}
                  />
                </div>
              ))}
            </div>
          )}
          <AddLessonForm
            moduleId={mod.id}
            courseId={courseId}
            onAdded={onChanged}
          />
        </div>
      )}
    </div>
  );
}

function LessonCard({
  lesson,
  index,
  onChanged,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
}: {
  lesson: Lesson;
  index: number;
  onChanged: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isDragging: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: lesson.title,
    description: lesson.description || "",
    videoUrl: lesson.videoUrl || "",
  });

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/lessons/${lesson.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        videoUrl: editForm.videoUrl || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update lesson",
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await api.delete(`/api/admin/courses/modules/lessons/${lesson.id}`);
      onChanged();
    } catch {
      toast.error("Failed to delete lesson");
    }
  };

  const contentType =
    lesson.videoType === "youtube"
      ? "youtube"
      : lesson.videoUrl
        ? "video"
        : "text";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={() => {}}
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg transition-all duration-200 ml-6 ${
        isDragging ? "opacity-40 scale-[0.98]" : "hover:bg-card/50"
      }`}
    >
      {/* Drag handle */}
      <div className="pt-1 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors">
        <IconGripVertical size={12} />
      </div>

      {/* Order badge + type */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/20 text-[10px] font-bold text-muted-foreground">
          {index + 1}
        </div>
        {contentType === "youtube" ? (
          <IconBrandYoutube size={12} className="text-danger/70" />
        ) : contentType === "video" ? (
          <IconPlayerPlay size={11} className="text-primary/60" />
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-1.5">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, title: e.target.value }))
              }
              className="field text-xs"
              autoFocus
            />
            <input
              type="text"
              value={editForm.description}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Description"
              className="field text-[11px]"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={editForm.videoUrl}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, videoUrl: e.target.value }))
                }
                placeholder="Video URL (YouTube, Vimeo...)"
                className="field text-[11px] flex-1"
              />
              <button
                onClick={handleSave}
                className="btn-primary text-[10px] px-2 py-1"
              >
                <IconDeviceFloppy size={12} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary text-[10px] px-2 py-1"
              >
                <IconX size={12} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-foreground leading-tight">
              {lesson.title}
            </p>
            {lesson.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {lesson.description}
              </p>
            )}
          </>
        )}
        {!editing && (
          <div className="flex items-center gap-2 mt-1 text-[9px] text-muted">
            {lesson.durationSeconds && (
              <span>{Math.floor(lesson.durationSeconds / 60)} min</span>
            )}
            {lesson.videoType && (
              <span className="capitalize bg-muted/10 px-1 py-0.5 rounded">
                {lesson.videoType}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-medium text-primary hover:text-primary-hover transition-colors px-1.5 py-1 rounded hover:bg-primary/5"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-muted hover:text-danger transition-colors rounded hover:bg-danger/5"
          >
            <IconTrash size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function AddModuleForm({
  courseId,
  onAdded,
}: {
  courseId: string;
  onAdded: () => void;
}) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/${courseId}/modules`, {
        title,
        description: desc || undefined,
      });
      setTitle("");
      setDesc("");
      setShow(false);
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add module");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-border/60 rounded-xl hover:border-primary/30 transition-colors">
      {show ? (
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Module title (required)"
            className="field"
            required
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="field"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {adding ? (
                "Adding..."
              ) : (
                <>
                  <IconPlus size={16} /> Add Module
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex items-center justify-center gap-2 w-full py-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <IconPlus size={18} /> Add Module
        </button>
      )}
    </div>
  );
}

function AddLessonForm({
  moduleId,
  courseId,
  onAdded,
}: {
  moduleId: string;
  courseId: string;
  onAdded: () => void;
}) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/modules/${moduleId}/lessons`, {
        title,
        description: desc || undefined,
        videoUrl: videoUrl || undefined,
      });
      setTitle("");
      setDesc("");
      setVideoUrl("");
      setShow(false);
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add lesson");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-t border-border/30 ml-6">
      {show ? (
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson title (required)"
            className="field text-xs"
            required
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="field text-xs"
          />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video URL — YouTube, Vimeo (optional)"
            className="field text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              {adding ? (
                "Adding..."
              ) : (
                <>
                  <IconPlus size={14} /> Add Lesson
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <IconPlus size={14} /> Add Lesson
        </button>
      )}
    </div>
  );
}

// --- Live Sessions Tab ---

function SessionsTab({ courseId }: { courseId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: Session[] }>(
        `/api/admin/courses/${courseId}/sessions`,
      );
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    api
      .get<{ sessions: Session[] }>(`/api/admin/courses/${courseId}/sessions`)
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSync = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully!");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No recording found yet.",
      );
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Live Sessions ({sessions.length})
        </h2>
        <Link href="/admin/sessions/new" className="btn-primary text-xs">
          + Schedule Session
        </Link>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted animate-pulse text-sm">
            Loading sessions...
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No sessions scheduled for this course yet.
          </p>
          <Link
            href="/admin/sessions/new"
            className="btn-primary mt-4 inline-flex text-sm"
          >
            + Schedule Session
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(session.scheduledAt).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.batch.name}
                  {session.module && ` \u00B7 ${session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {session.recording ? (
                    <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">
                      Recording
                    </span>
                  ) : new Date(session.scheduledAt) > new Date() ? (
                    <span className="text-[10px] uppercase font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                      Upcoming
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                      No Recording
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {!session.recording &&
                  new Date(session.scheduledAt) <= new Date() && (
                    <button
                      onClick={() => handleSync(session.id)}
                      disabled={syncingId === session.id}
                      className="btn-secondary text-xs px-2.5 py-1.5"
                    >
                      {syncingId === session.id ? "Syncing..." : "Sync"}
                    </button>
                  )}
                <a
                  href={session.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs shrink-0"
                >
                  {new Date(session.scheduledAt) > new Date()
                    ? "Join \u2192"
                    : "View"}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Recordings Tab ---

function RecordingsTab({ courseId }: { courseId: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = useCallback(async () => {
    try {
      const data = await api.get<{ recordings: Recording[] }>(
        `/api/admin/courses/${courseId}/recordings`,
      );
      setRecordings(data.recordings || []);
    } catch {
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    api
      .get<{ recordings: Recording[] }>(
        `/api/admin/courses/${courseId}/recordings`,
      )
      .then((data) => setRecordings(data.recordings || []))
      .catch(() => setRecordings([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Recordings ({recordings.length})
      </h2>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted animate-pulse text-sm">
            Loading recordings...
          </p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No recordings available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordings.map((rec) => (
            <div
              key={rec.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(rec.session.scheduledAt).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rec.session.batch.name}
                  {rec.session.module && ` \u00B7 ${rec.session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    {rec.duration > 0
                      ? `${Math.floor(rec.duration / 60)}m ${rec.duration % 60}s`
                      : "Duration unknown"}
                  </span>
                  <span className="text-xs text-muted">\u00B7</span>
                  <span className="text-xs text-muted">
                    Synced {new Date(rec.syncedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <a
                href={rec.session.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs shrink-0 ml-2"
              >
                View Recording
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
