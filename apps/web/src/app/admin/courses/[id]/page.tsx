"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconChevronRight } from "@tabler/icons-react";
import type {
  Course,
  ChecklistItem,
  CourseFormData,
} from "./_components/types";
import CourseDetailsTab from "./_components/CourseDetailsTab";
import ContentTab from "./_components/ContentTab";
import CertificationTab from "./_components/CertificationTab";
import { usePageTitle } from "@/lib/use-page-title";
import TabButton from "./_components/TabButton";
import { IconAward } from "@tabler/icons-react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const ALLOWED_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

export default function CourseDetailPage() {
  usePageTitle("Course Details");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const confirmDelete = useConfirmDialog();

  const [activeTab, setActiveTab] = useState<
    "details" | "content" | "certification"
  >("details");

  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    category: "",
    tags: [],
    learningObjectives: [],
  });

  const fetchCourse = useCallback(async () => {
    try {
      const data = await api.get<Course>(`/api/admin/courses/${id}`);
      setCourse(data);
      setForm({
        title: data.title,
        description: data.description,
        category: data.category || "",
        tags: data.tags || [],
        learningObjectives: data.learningObjectives || [],
      });
    } catch {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(() => fetchCourse());
  }, [fetchCourse]);

  const handleSaveCourse = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/courses/${id}`, {
        title: form.title,
        description: form.description,
        category: form.category || null,
        tags: form.tags.length > 0 ? form.tags : null,
        learningObjectives:
          form.learningObjectives.length > 0 ? form.learningObjectives : null,
      });
      toast.success("Course saved!");
      fetchCourse();
      setActiveTab("content");
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
    if (
      !(await confirmDelete({
        title: "Archive Course",
        message: `Archive course "${course!.title}"? Students will lose access to this course. This action can be reversed by an admin.`,
      }))
    )
      return;
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
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/courses" className="hover:text-foreground transition-colors">Courses</Link>
        <IconChevronRight size={14} />
        <span className="text-foreground">{course?.title || "..."}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
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
        <button
          onClick={() => setActiveTab("certification")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "certification"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <IconAward className="h-4 w-4" />
          Certification
        </button>
      </div>

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

      {activeTab === "content" && (
        <ContentTab
          courseId={course.id}
          modules={sortedModules}
          onContentChanged={fetchCourse}
        />
      )}

      {activeTab === "certification" && <CertificationTab courseId={course.id} />}
    </div>
  );
}
