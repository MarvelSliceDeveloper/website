"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconPlus, IconX } from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import {
  SUGGESTED_CATEGORIES,
  SUGGESTED_TAGS,
  SUGGESTED_COURSE_TITLES,
} from "@/lib/suggestions";
import type { Course, CourseFormData } from "./types";

export default function CourseDetailsTab({
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
  const [newTag, setNewTag] = useState("");
  const [newObjective, setNewObjective] = useState("");

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

  const titleOptions = dbTitles.length
    ? dbTitles
    : (SUGGESTED_COURSE_TITLES as readonly string[]);
  const categoryOptions = dbCategories.length
    ? dbCategories
    : (SUGGESTED_CATEGORIES as readonly string[]);
  const tagOptions = dbTags.length
    ? dbTags
    : (SUGGESTED_TAGS as readonly string[]);

  useEffect(() => {
    if (!form.title.trim()) return;
    const lowerTitle = form.title.toLowerCase();

    // Auto-fill category based on title keywords
    const categoryMap: Record<string, string> = {
      "javascript": "Programming",
      "typescript": "Programming",
      "react": "Web Development",
      "next.js": "Web Development",
      "nextjs": "Web Development",
      "node.js": "Web Development",
      "node": "Web Development",
      "python": "Data Science",
      "java": "Programming",
      "c++": "Programming",
      "c#": "Programming",
      "php": "Programming",
      "ruby": "Programming",
      "go": "Programming",
      "rust": "Programming",
      "swift": "Programming",
      "kotlin": "Programming",
      "django": "Web Development",
      "flask": "Web Development",
      "express": "Web Development",
      "html": "Web Development",
      "css": "Web Development",
      "tailwind css": "Web Development",
      "sql": "Database Design",
      "postgresql": "Database Design",
      "mongodb": "Database Design",
      "mysql": "Database Design",
      "redis": "Database Design",
      "machine learning": "Machine Learning & AI",
      "deep learning": "Machine Learning & AI",
      "artificial intelligence": "Machine Learning & AI",
      "data science": "Machine Learning & AI",
      "data analysis": "Machine Learning & AI",
      "big data": "Machine Learning & AI",
      "pandas": "Machine Learning & AI",
      "numpy": "Machine Learning & AI",
      "computer vision": "Machine Learning & AI",
      "nlp": "Machine Learning & AI",
      "docker": "DevOps & Cloud",
      "kubernetes": "DevOps & Cloud",
      "aws": "DevOps & Cloud",
      "azure": "DevOps & Cloud",
      "gcp": "DevOps & Cloud",
      "cloud computing": "DevOps & Cloud",
      "devops": "DevOps & Cloud",
      "git": "DevOps & Cloud",
      "github": "DevOps & Cloud",
      "ci/cd": "DevOps & Cloud",
      "cybersecurity": "Cybersecurity",
      "networking": "Networking",
      "blockchain": "Blockchain & Web3",
      "web3": "Blockchain & Web3",
      "api": "Programming",
      "rest": "Programming",
      "graphql": "Programming",
      "microservices": "Programming",
      "mobile development": "Mobile Development",
      "android": "Mobile Development",
      "ios": "Mobile Development",
      "flutter": "Mobile Development",
      "react native": "Mobile Development",
      "ui/ux": "Design & UI/UX",
      "figma": "Design & UI/UX",
      "graphic design": "Design & UI/UX",
      "game development": "Game Development",
      "unity": "Game Development",
      "digital marketing": "Marketing",
      "seo": "Marketing",
      "social media": "Marketing",
      "finance": "Business & Finance",
      "accounting": "Business & Finance",
      "excel": "Business & Finance",
      "project management": "Project Management",
      "leadership": "Project Management",
      "communication": "Project Management",
      "interview prep": "Project Management",
    };

    // Check for category match
    let matchedCategory = form.category;
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (lowerTitle.includes(keyword)) {
        matchedCategory = cat;
        break;
      }
    }
    if (matchedCategory && !form.category) {
      setForm((p) => ({ ...p, category: matchedCategory }));
    }

    // Auto-fill tags based on title keywords
    const matchedTags: string[] = [];
    for (const tag of SUGGESTED_TAGS) {
      if (lowerTitle.includes(tag.toLowerCase())) {
        matchedTags.push(tag);
      }
    }
    if (matchedTags.length > 0 && form.tags.length === 0) {
      setForm((p) => ({ ...p, tags: [...matchedTags] }));
    }
  }, [form.title]);

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setForm((p) => ({
        ...p,
        learningObjectives: [...p.learningObjectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    setForm((p) => ({
      ...p,
      learningObjectives: p.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

  const handleSave = () => {
    // Checked in display order so the toast matches the first empty field on the page.
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (form.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters.");
      return;
    }
    if (!stripHtml(form.description)) {
      toast.error("Description is required.");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required.");
      return;
    }
    onSave();
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Course Details
      </h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Title <span className="text-danger">*</span>
        </label>
        <Select
          value={form.title}
          onValueChange={(val) =>
            setForm((p: CourseFormData) => ({ ...p, title: val || "" }))
          }
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
          <div className="relative h-20 w-28 overflow-hidden rounded-lg border border-border bg-card flex items-center justify-center text-xl">
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
            {thumbnailUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
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
            <p className="text-xs text-muted">
              {thumbnailUploading
                ? "Uploading thumbnail..."
                : "JPG, PNG, or WebP. Max 5 MB."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description <span className="text-danger">*</span>
        </label>
        <RichEditor
          content={form.description}
          onChange={(html) =>
            setForm((p: CourseFormData) => ({
              ...p,
              description: html,
            }))
          }
          placeholder="Enter course description..."
          minHeight="150px"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Category <span className="text-danger">*</span>
          </label>
          <Select
            value={form.category}
            onValueChange={(val) =>
              setForm((p: CourseFormData) => ({ ...p, category: val || "" }))
            }
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
            onValueChange={(val) => setForm((p) => ({ ...p, tags: [...p.tags, val] }))}
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
              <SelectItem value="custom">
                <span>Add custom...</span>
              </SelectItem>
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
            className="field flex-1 ml-2"
          />
          <button
            type="button"
            onClick={addTag}
            className="btn-secondary text-xs px-3 ml-2"
          >
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Learning Objectives
        </label>
        <div className="space-y-2 mb-2">
          {form.learningObjectives.map((obj, index) => (
            <div key={obj} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-sm flex-1">{obj}</span>
              <button
                onClick={() => removeObjective(index)}
                className="text-muted hover:text-danger"
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addObjective())
            }
            placeholder="Add a learning objective"
            className="field flex-1"
          />
          <button
            type="button"
            onClick={addObjective}
            className="btn-secondary text-xs px-3"
          >
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs px-3 py-1.5"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}