"use client";

import { useEffect, useState } from "react";
import { useApiQuery } from "@/lib/query";
import { useAIGenerate } from "@/lib/use-ai-generate";
import {
  SUGGESTED_CATEGORIES,
  SUGGESTED_TAGS,
  getSuggestedCourseMeta,
} from "@/lib/suggestions";
import { toast, getErrorMessage } from "@/lib/toast";

export interface CourseFormState {
  title: string;
  description: string;
  category: string;
  tags: string[];
  learningObjectives: string[];
}

export function useCreateCourseForm(enabled = true) {
  const [form, setForm] = useState<CourseFormState>({
    title: "",
    description: "",
    category: "",
    tags: [],
    learningObjectives: [],
  });
  const [aiTopic, setAiTopic] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const categoriesQuery = useApiQuery<{ categories: { name: string }[] }>(
    ["admin", "content", "categories"],
    "/api/admin/content/categories",
    undefined,
    { enabled },
  );
  const tagsQuery = useApiQuery<{ tags: { name: string }[] }>(
    ["admin", "content", "tags"],
    "/api/admin/content/tags",
    undefined,
    { enabled },
  );

  const dbCategories = categoriesQuery.data?.categories.map((c) => c.name) ?? [];
  const dbTags = tagsQuery.data?.tags.map((t) => t.name) ?? [];

  const categoryOptions = dbCategories.length ? dbCategories : (SUGGESTED_CATEGORIES as readonly string[]);
  const tagOptions = dbTags.length ? dbTags : (SUGGESTED_TAGS as readonly string[]);

  const update = (field: keyof CourseFormState, value: string) =>
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
            ...(Array.isArray(d.tags) && d.tags.length ? { tags: [...d.tags] } : {}),
            ...(Array.isArray(d.objectives) && d.objectives.length ? { learningObjectives: [...d.objectives] } : {}),
          }));
          toast.success("Course draft generated — review before adding");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleAiTitleGenerate = () => {
    const promptSource = aiTopic.trim() || form.description.trim() || form.category.trim() || form.tags.join(", ");
    if (!promptSource || promptSource.length < 3) {
      toast.error("Enter a topic or description first so the AI can generate a title");
      return;
    }
    aiTitleGenerate.mutate(
      {
        type: "COURSE_TITLE",
        prompt: promptSource,
        context: {
          ...(form.description.trim() ? { courseDescription: form.description.trim() } : {}),
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
  const removeTag = (tag: string) => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  const addObjective = () => {
    if (newObjective.trim()) {
      setForm((p) => ({ ...p, learningObjectives: [...p.learningObjectives, newObjective.trim()] }));
      setNewObjective("");
    }
  };
  const removeObjective = (index: number) =>
    setForm((p) => ({ ...p, learningObjectives: p.learningObjectives.filter((_, i) => i !== index) }));

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
  const ALLOWED_THUMBNAIL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const reset = () => {
    setForm({ title: "", description: "", category: "", tags: [], learningObjectives: [] });
    setAiTopic("");
    setNewTag("");
    setNewObjective("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const validate = () => {
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

  return {
    form,
    setForm,
    aiTopic,
    setAiTopic,
    newTag,
    setNewTag,
    newObjective,
    setNewObjective,
    thumbnailFile,
    thumbnailPreview,
    categoryOptions,
    tagOptions,
    update,
    aiGenerate,
    aiTitleGenerate,
    handleAiGenerate,
    handleAiTitleGenerate,
    addTag,
    removeTag,
    addObjective,
    removeObjective,
    handleThumbnailChange,
    reset,
    validate,
  };
}
