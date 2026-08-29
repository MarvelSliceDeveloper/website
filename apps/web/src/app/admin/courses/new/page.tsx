"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconArrowLeft,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useAIGenerate } from "@/lib/use-ai-generate";
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const titlesQuery = useApiQuery<{ titles: { name: string }[] }>(
    ["admin", "content", "titles"],
    "/api/admin/content/titles",
  );
  const categoriesQuery = useApiQuery<{ categories: { name: string }[] }>(
    ["admin", "content", "categories"],
    "/api/admin/content/categories",
  );
  const tagsQuery = useApiQuery<{ tags: { name: string }[] }>(
    ["admin", "content", "tags"],
    "/api/admin/content/tags",
  );

  const dbTitles = titlesQuery.data?.titles.map((t) => t.name) ?? [];
  const dbCategories =
    categoriesQuery.data?.categories.map((c) => c.name) ?? [];
  const dbTags = tagsQuery.data?.tags.map((t) => t.name) ?? [];

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: [] as string[],
  });
  const [aiTopic, setAiTopic] = useState("");

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const aiGenerate = useAIGenerate<{
    title: string;
    description: string;
    category: string;
    tags: string[];
    objectives: string[];
  }>();

  const aiTitleGenerate = useAIGenerate<{ title: string }>();

  const handleAiGenerate = () => {
    if (!aiTopic.trim()) {
      toast.error("Enter a course topic for the AI");
      return;
    }
    aiGenerate.mutate(
      { type: "COURSE_OUTLINE", prompt: aiTopic.trim() },
      {
        onSuccess: (res) => {
          const d = res.data;
          setForm((p) => ({
            ...p,
            ...(d.title ? { title: d.title } : {}),
            ...(d.description ? { description: d.description } : {}),
            ...(d.category ? { category: d.category } : {}),
            ...(Array.isArray(d.tags) && d.tags.length
              ? { tags: [...d.tags] }
              : {}),
          }));
          toast.success("Course draft generated — review before adding");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleAiTitleGenerate = () => {
    const promptSource =
      aiTopic.trim() ||
      form.description.trim() ||
      form.category.trim() ||
      form.tags.join(", ");
    if (!promptSource || promptSource.length < 3) {
      toast.error(
        "Enter a topic or description first so the AI can generate a title",
      );
      return;
    }
    aiTitleGenerate.mutate(
      {
        type: "COURSE_TITLE",
        prompt: promptSource,
        context: {
          ...(form.description.trim()
            ? { courseDescription: form.description.trim() }
            : {}),
          ...(form.category.trim() ? { courseTitle: form.category } : {}),
        },
      },
      {
        onSuccess: (res) => {
          const t = res.data?.title?.trim();
          if (t) {
            setForm((p) => ({ ...p, title: t }));
            toast.success("Title generated — review before adding");
          }
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

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

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      const course = await api.post<{ id: string; slug: string }>(
        "/api/admin/courses",
        {
          title: form.title,
          description: form.description,
          category: form.category || undefined,
          tags: form.tags,
          slug: form.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        },
      );

      if (thumbnailFile) {
        const uploadData = new FormData();
        uploadData.append("thumbnail", thumbnailFile);
        try {
          await api.post(
            `/api/admin/courses/${course.id}/thumbnail`,
            uploadData,
          );
        } catch (uploadError: unknown) {
          toast.error(getErrorMessage(uploadError));
        }
      }

      return course;
    },
    onSuccess: (course) => {
      router.push(`/admin/courses/${course.slug || course.id}`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createCourseMutation.mutate();
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

          {/* AI generation menu — same as edit course (CourseDetailsTab) */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-300/50 bg-violet-500/5 p-3">
            <IconSparkles size={16} className="shrink-0 text-violet-500" />
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAiGenerate())
              }
              placeholder="Describe the course you want, e.g. Python for data analysis beginners"
              className="field flex-1 min-w-[220px] text-xs"
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerate.isPending}
              className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
            >
              {aiGenerate.isPending ? "Generating…" : "Generate Draft"}
            </button>
            <p className="w-full text-[10px] text-muted-foreground">
              Fills title, description, category, and tags below — review and
              edit before adding.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
              <span>
                Course Title <span className="text-danger">*</span>
              </span>
              <button
                type="button"
                onClick={handleAiTitleGenerate}
                disabled={aiTitleGenerate.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
                title="Generate a title from your topic / description"
              >
                <IconSparkles size={12} className="text-violet-500" />
                {aiTitleGenerate.isPending ? "Generating…" : "Generate title"}
              </button>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Python for Data Analysis Beginners"
              className="field w-full"
              list="course-title-suggestions"
              required
              minLength={3}
            />
            <datalist id="course-title-suggestions">
              {titleOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {titleOptions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {titleOptions.slice(0, 8).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("title", t)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      form.title === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Top AI bar fills title + details together; &quot;Generate
              title&quot; creates just the title from your topic/description.
            </p>
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
                <p className="text-xs text-muted">
                  JPG, PNG, or WebP. Max 5 MB.
                </p>
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
          <button
            type="submit"
            className="btn-primary"
            disabled={createCourseMutation.isPending}
          >
            {createCourseMutation.isPending ? "Adding..." : "Add Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
