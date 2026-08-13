"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconArrowLeft, IconPlus, IconX } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUGGESTED_COURSE_TITLES,
  SUGGESTED_CATEGORIES,
  SUGGESTED_TAGS,
  getSuggestedCourseMeta,
} from "@/lib/suggestions";

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const ALLOWED_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function CreateCoursePage() {
  usePageTitle("New Course");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  // DB-backed options (fall back to static suggestions when unavailable)
  const [dbTitles, setDbTitles] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: [] as string[],
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    Promise.all([
      api
        .get<{ titles: { name: string }[] }>("/api/admin/content/titles")
        .then((d) => setDbTitles(d.titles.map((t) => t.name)))
        .catch(() => {}),
      api
        .get<{ categories: { name: string }[] }>("/api/admin/content/categories")
        .then((d) => setDbCategories(d.categories.map((c) => c.name)))
        .catch(() => {}),
      api
        .get<{ tags: { name: string }[] }>("/api/admin/content/tags")
        .then((d) => setDbTags(d.tags.map((t) => t.name)))
        .catch(() => {}),
    ]);
  }, []);

  const titleOptions = dbTitles.length
    ? dbTitles
    : (SUGGESTED_COURSE_TITLES as readonly string[]);
  const categoryOptions = dbCategories.length
    ? dbCategories
    : (SUGGESTED_CATEGORIES as readonly string[]);
  const tagOptions = dbTags.length
    ? dbTags
    : (SUGGESTED_TAGS as readonly string[]);

  // Auto-fill category + tags based on the selected course title.
  useEffect(() => {
    if (!form.title.trim()) return;
    const { category, tags } = getSuggestedCourseMeta(form.title);
    setForm((prev) => ({
      ...prev,
      category: prev.category || category,
      tags: prev.tags.length > 0 ? prev.tags : tags,
    }));
  }, [form.title]);

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  useEffect(() => {
    if (!thumbnailFile) {
      Promise.resolve().then(() => setThumbnailPreview(null));
      return;
    }

    const objectUrl = URL.createObjectURL(thumbnailFile);
    Promise.resolve().then(() => setThumbnailPreview(objectUrl));

    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  const handleThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setThumbnailFile(null);
      return;
    }

    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      setThumbnailFile(null);
      toast.error("Thumbnail must be a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      setThumbnailFile(null);
      toast.error("Thumbnail must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setThumbnailFile(file);
  };

  const validateForm = () => {
    // Checked in display order so the toast matches the first empty field on the page.
    if (!form.title.trim()) {
      toast.error("Course Title is required.");
      return false;
    }
    if (form.title.trim().length < 3) {
      toast.error("Course Title must be at least 3 characters.");
      return false;
    }
    if (!thumbnailFile) {
      toast.error("Thumbnail is required.");
      return false;
    }
    if (!form.description.trim()) {
      toast.error("Description is required.");
      return false;
    }
    if (form.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters.");
      return false;
    }
    if (!form.category.trim()) {
      toast.error("Category is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const course = await api.post<{ id: string }>("/api/admin/courses", {
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        tags: form.tags,
        slug:form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      });

      if (thumbnailFile) {
        const uploadData = new FormData();
        uploadData.append("thumbnail", thumbnailFile);
        try {
          await api.post(
            `/api/admin/courses/${course.id}/thumbnail`,
            uploadData,
          );
        } catch (uploadError: unknown) {
          toast.error(
            (uploadError instanceof Error
              ? uploadError.message
              : String(uploadError)) ||
              "Course created, but thumbnail upload failed. You can upload it in the editor.",
          );
        }
      }

      router.push(`/admin/courses/${course.slug || course.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create course",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Add Course"
        description="Start with the basics. You can add modules, videos, and design the course page later."
        breadcrumbs={[
          { label: "Courses", href: "/admin/courses" },
          { label: "Add", href: "/admin/courses/new" },
        ]}
        action={
          <Link
            href="/admin/courses"
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
            Course Details
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Course Title <span className="text-danger">*</span>
            </label>
            <Select
              value={form.title}
              onValueChange={(val) => update("title", val || "")}
            >
              <SelectTrigger className="field w-full">
                <SelectValue placeholder="-- Select a title --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span>-- Select a title --</span>
                </SelectItem>
                {titleOptions.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
                {form.title &&
                  !(titleOptions as readonly string[]).includes(
                    form.title,
                  ) && (
                    <SelectItem value={form.title}>{form.title}</SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Thumbnail <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-28 overflow-hidden rounded-lg border border-border bg-card flex items-center justify-center text-xl">
                {thumbnailPreview ? (
                  <Image
                    src={thumbnailPreview}
                    alt="Course thumbnail preview"
                    width={112}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  "\ud83d\udcda"
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailChange}
                  className="field w-full"
                  required
                />
                <p className="text-xs text-muted">JPG, PNG, or WebP. Max 5 MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What will students learn in this course?"
              className="field w-full min-h-[120px] resize-y"
              required
              minLength={10}
            />
            <p className="mt-1 text-xs text-muted">
              You can add rich formatting in the Course Designer later.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Category <span className="text-danger">*</span>
            </label>
            <Select
              value={form.category}
              onValueChange={(val) => update("category", val || "")}
            >
              <SelectTrigger className="field w-full">
                <SelectValue placeholder="-- Select a category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span>-- Select a category --</span>
                </SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                {form.category &&
                  !(categoryOptions as readonly string[]).includes(
                    form.category,
                  ) && (
                    <SelectItem value={form.category}>
                      {form.category}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary/70"
                  >
                    <IconX size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select
                onValueChange={(val) =>
                  val &&
                  !form.tags.includes(val) &&
                  setForm((prev) => ({ ...prev, tags: [...prev.tags, val] }))
                }
              >
                <SelectTrigger className="field">
                  <SelectValue placeholder="-- Select a tag --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span>-- Select a tag --</span>
                  </SelectItem>
                  {tagOptions.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Add a custom tag"
                className="field flex-1"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary text-xs px-3"
              >
                <IconPlus size={14} />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Tags auto-fill from the course title. You can add or remove them.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">What happens next?</p>
          <p>
            The course will be created as a <strong>Draft</strong>. You&apos;ll
            then be taken to the course editor where you can add modules, upload
            videos, design the landing page, and publish when ready.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/courses" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Adding..." : "Add Course"}
          </button>
        </div>
      </form>
    </div>
  );
}