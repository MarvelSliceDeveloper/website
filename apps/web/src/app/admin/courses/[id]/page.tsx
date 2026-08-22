"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
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

  const courseQuery = useApiQuery<Course>(
    ["admin", "courses", id],
    `/api/admin/courses/${id}`,
  );
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

  useEffect(() => {
    const data = courseQuery.data;
    if (data) {
      setForm({
        title: data.title,
        description: data.description,
        category: data.category || "",
        tags: data.tags || [],
        learningObjectives: data.learningObjectives || [],
      });
    }
  }, [courseQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/admin/courses/${id}`, {
        title: form.title,
        description: form.description,
        category: form.category || null,
        tags: form.tags.length > 0 ? form.tags : null,
        learningObjectives:
          form.learningObjectives.length > 0 ? form.learningObjectives : null,
      }),
    onSuccess: () => {
      toast.success("Course saved!");
      void courseQuery.refetch();
      setActiveTab("content");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSaveCourse = () => saveMutation.mutate();

  const thumbnailMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadData = new FormData();
      uploadData.append("thumbnail", file);
      await withLoadingToast(
        api.post(`/api/admin/courses/${id}/thumbnail`, uploadData),
        {
          loading: "Uploading thumbnail...",
          success: () => "Thumbnail updated.",
        },
      );
    },
    onSuccess: () => void courseQuery.refetch(),
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleThumbnailUpload = (file: File) => {
    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      toast.error("Thumbnail must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error("Thumbnail must be 5 MB or smaller.");
      return;
    }
    thumbnailMutation.mutate(file);
  };

  const publishMutation = useMutation({
    mutationFn: () =>
      withLoadingToast(
        api.post<{
          published: boolean;
          checklist: ChecklistItem[];
        }>(`/api/admin/courses/${id}/publish`),
        {
          loading: "Publishing course...",
          success: (r) => {
            if (!r.published) {
              const fails = r.checklist
                .filter((c: ChecklistItem) => !c.passed)
                .map((c: ChecklistItem) => `\u2022 ${c.item}`)
                .join("\n");
              return { message: `Cannot publish:\n${fails}`, type: "error" };
            }
            return "Course published";
          },
        },
      ),
    onSuccess: (result) => {
      if (result.published) void courseQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handlePublish = () => publishMutation.mutate();

  const unpublishMutation = useMutation({
    mutationFn: () =>
      withLoadingToast(api.post(`/api/admin/courses/${id}/unpublish`), {
        loading: "Unpublishing course...",
        success: () => "Course unpublished",
      }),
    onSuccess: () => void courseQuery.refetch(),
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleUnpublish = () => unpublishMutation.mutate();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (
        !(await confirmDelete({
          title: "Archive Course",
          message: `Archive course "${courseQuery.data!.title}"? Students will lose access to this course. This action can be reversed by an admin.`,
        }))
      )
        throw new Error("cancelled");
      await withLoadingToast(api.delete(`/api/admin/courses/${id}`), {
        loading: "Archiving course...",
        success: () => "Course archived",
      });
    },
    onSuccess: () => router.push("/admin/courses"),
    onError: (err: unknown) => {
      if ((err as Error).message === "cancelled") return;
      toast.error(getErrorMessage(err));
    },
  });

  const handleDeleteCourse = () => deleteMutation.mutate();

  const course = courseQuery.data;

  if (courseQuery.isPending) {
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
          thumbnailUploading={thumbnailMutation.isPending}
          saving={saveMutation.isPending}
          onThumbnailUpload={handleThumbnailUpload}
          onSave={handleSaveCourse}
        />
      )}

      {activeTab === "content" && (
        <ContentTab
          courseId={course.id}
          courseTitle={course.title}
          courseDescription={course.description}
          modules={sortedModules}
          onContentChanged={() => void courseQuery.refetch()}
        />
      )}

      {activeTab === "certification" && <CertificationTab courseId={course.id} />}
    </div>
  );
}
