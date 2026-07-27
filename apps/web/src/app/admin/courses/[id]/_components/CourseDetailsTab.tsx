"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPlus, IconX } from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
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
          required
          minLength={3}
          maxLength={200}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
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
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())
            }
            placeholder="Add a tag"
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

      <button onClick={onSave} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
