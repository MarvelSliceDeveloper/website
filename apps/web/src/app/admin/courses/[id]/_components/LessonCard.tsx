"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconGripVertical,
  IconBrandYoutube,
  IconPlayerPlay,
  IconDeviceFloppy,
  IconTrash,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";
import type { Lesson } from "./types";
import RichEditor from "@/components/editor/RichEditor";

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
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    title: lesson.title,
    description: lesson.description || "",
    videoUrl: lesson.videoUrl || "",
    isFreePreview: lesson.isFreePreview,
  });
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    lesson.durationSeconds ?? null,
  );

  const startEditing = () => {
    setEditForm({
      title: lesson.title,
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      isFreePreview: lesson.isFreePreview,
    });
    setDurationSeconds(lesson.durationSeconds ?? null);
    setEditing(true);
  };

  const handleFetchVideoInfo = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setFetchingInfo(true);
    try {
      const data = await api.get<{
        videoId: string;
        title: string;
        durationSeconds: number;
      }>(`/api/youtube/video-info?url=${encodeURIComponent(url)}`);
      setEditForm((p) => ({
        ...p,
        title: data.title || p.title,
      }));
      setDurationSeconds(data.durationSeconds);
      toast.success(`Duration: ${Math.floor(data.durationSeconds / 60)} min`);
    } catch {
      toast.error("Failed to fetch video info. Check the URL or API key.");
    } finally {
      setFetchingInfo(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/lessons/${lesson.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        videoUrl: editForm.videoUrl || undefined,
        durationSeconds: durationSeconds ?? undefined,
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

  const durationLabel =
    lesson.durationSeconds != null
      ? `${Math.floor(lesson.durationSeconds / 60)} mins`
      : null;

  if (editing) {
    return (
      <div className="ml-6 space-y-1.5 rounded-xl border border-[#e4e2f5] bg-[#f8f7fd] px-3.5 py-3">
        <input
          type="text"
          value={editForm.title}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, title: e.target.value }))
          }
          className="field text-xs"
          autoFocus
        />
        <RichEditor
          content={editForm.description}
          onChange={(html) =>
            setEditForm((p) => ({ ...p, description: html }))
          }
          placeholder="Description"
          minHeight="150px"
        />
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="url"
              value={editForm.videoUrl}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, videoUrl: e.target.value }))
              }
              onBlur={() => handleFetchVideoInfo(editForm.videoUrl)}
              placeholder="Video URL (YouTube...)"
              className="field w-full pr-6 text-[11px]"
            />
            {fetchingInfo && (
              <IconRefresh
                size={11}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin text-[#8b8da3]"
              />
            )}
          </div>
          <label className="flex items-center gap-1.5 whitespace-nowrap text-[10px] text-[#8b8da3]">
            <input
              type="checkbox"
              checked={editForm.isFreePreview}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  isFreePreview: e.target.checked,
                }))
              }
              className="h-3 w-3 accent-[#4f63f0]"
            />
            Free preview
          </label>
          <button
            onClick={handleSave}
            disabled={fetchingInfo}
            className="rounded-full bg-[#4f63f0] px-2.5 py-1.5 text-white transition-colors hover:bg-[#3f52e0]"
          >
            <IconDeviceFloppy size={12} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-full border border-[#e4e2f5] bg-white px-2.5 py-1.5 text-[#8b8da3] transition-colors hover:bg-[#f5f4fd]"
          >
            <IconX size={12} />
          </button>
        </div>
      </div>
    );
  }

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
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-200 ${
        isDragging ? "scale-[0.98] opacity-40" : "hover:bg-[#f8f7fd]"
      }`}
    >
      <span className="shrink-0 cursor-grab text-[#c7c6dd] transition-colors hover:text-[#a3a1c9] active:cursor-grabbing">
        <IconGripVertical size={13} />
      </span>

      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[#e8ecff] text-[#4f63f0]">
        {contentType === "youtube" ? (
          <IconBrandYoutube size={14} />
        ) : (
          <IconPlayerPlay size={13} fill="currentColor" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#1f2233]">
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="mt-0.5 truncate text-[10.5px] text-[#8b8da3]">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {lesson.isFreePreview && (
          <span className="whitespace-nowrap rounded-full bg-[#e8ecff] px-2 py-0.5 text-[9.5px] font-semibold text-[#4f63f0]">
            Free
          </span>
        )}
        {durationLabel && (
          <span className="whitespace-nowrap text-[11.5px] text-[#8b8da3]">
            {durationLabel}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={startEditing}
            className="rounded-md px-1.5 py-1 text-[10px] font-medium text-[#4f63f0] transition-colors hover:bg-[#4f63f0]/10"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-1 text-[#8b8da3] transition-colors hover:bg-danger/12 hover:text-danger"
          >
            <IconTrash size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}