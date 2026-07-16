"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconGripVertical,
  IconBrandYoutube,
  IconPlayerPlay,
  IconDeviceFloppy,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { Lesson } from "./types";

export default function LessonCard({
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
    isFreePreview: lesson.isFreePreview,
  });

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/lessons/${lesson.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        videoUrl: editForm.videoUrl || undefined,
        isFreePreview: editForm.isFreePreview,
      });
      setEditing(false);
      toast.success("Lesson updated");
      onChanged();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update lesson",
      );
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete lesson "${lesson.title}"?\n\nAny uploaded resources will also be removed. This action cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/api/admin/courses/modules/lessons/${lesson.id}`);
      toast.success("Lesson deleted");
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
      <div className="pt-1 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors">
        <IconGripVertical size={12} />
      </div>

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
              <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={editForm.isFreePreview}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      isFreePreview: e.target.checked,
                    }))
                  }
                  className="h-3 w-3 accent-primary"
                />
                Free preview
              </label>
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
            {lesson.isFreePreview && (
              <span className="bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">
                Free
              </span>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-medium text-primary hover:text-primary-hover transition-colors px-1.5 py-1 rounded hover:bg-primary/12"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-muted hover:text-danger transition-colors rounded hover:bg-danger/12"
          >
            <IconTrash size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
