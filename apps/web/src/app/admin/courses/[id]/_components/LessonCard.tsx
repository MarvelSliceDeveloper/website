"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast, withLoadingToast } from "@/lib/toast";
import {
  IconBrandYoutube,
  IconPlayerPlay,
  IconTrash,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import type { Lesson } from "./types";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function LessonCard({
  lesson,
  index,
  onChanged,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  lesson: Lesson;
  index: number;
  onChanged: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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
  const confirmDelete = useConfirmDialog();

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
      const data = await withLoadingToast(
        api.get<{
          videoId: string;
          title: string;
          durationSeconds: number;
        }>(`/api/youtube/video-info?url=${encodeURIComponent(url)}`),
        {
          loading: "Fetching video info...",
          success: (d) => `Duration: ${Math.floor(d.durationSeconds / 60)} min`,
        },
      );
      setEditForm((p) => ({
        ...p,
        title: data.title || p.title,
      }));
      setDurationSeconds(data.durationSeconds);
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
      !(await confirmDelete({
        title: "Delete Lesson",
        message: `Delete lesson "${lesson.title}"? Any uploaded resources will also be removed. This action cannot be undone.`,
      }))
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

  const editFooter = (
    <>
      <button
        onClick={() => setEditing(false)}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={fetchingInfo}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
      >
        {fetchingInfo ? "Fetching..." : "Save Changes"}
      </button>
    </>
  );

  const editContent = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, title: e.target.value }))
          }
          className="field w-full"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Description</label>
        <RichEditor
          content={editForm.description}
          onChange={(html) =>
            setEditForm((p) => ({ ...p, description: html }))
          }
          placeholder="Description"
          minHeight="150px"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Video URL</label>
        <div className="relative">
          <input
            type="url"
            value={editForm.videoUrl}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, videoUrl: e.target.value }))
            }
            onBlur={() => handleFetchVideoInfo(editForm.videoUrl)}
            placeholder="Video URL (YouTube...)"
            className="field w-full pr-6"
          />
          {fetchingInfo && (
            <IconRefresh
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-[#8b8da3]"
            />
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#8b8da3]">
        <input
          type="checkbox"
          checked={editForm.isFreePreview}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, isFreePreview: e.target.checked }))
          }
          className="h-4 w-4 accent-[#4f63f0]"
        />
        Free preview
      </label>
    </div>
  );

  return (
    <>
    <div
      className="group flex items-center gap-2.5 rounded-xl border border-[#e4e2f5] bg-white px-2.5 py-2 transition-all duration-200 hover:border-[#cfcbe8] hover:bg-[#f8f7fd]"
    >
      <div className="flex shrink-0 flex-col">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#4f63f0] hover:bg-[#e8ecff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
          title="Move up"
        >
          <IconChevronUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#4f63f0] hover:bg-[#e8ecff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
          title="Move down"
        >
          <IconChevronDown size={13} />
        </button>
      </div>

      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[#e8ecff] text-[#4f63f0]">
        {contentType === "youtube" ? (
          <IconBrandYoutube size={14} />
        ) : (
          <IconPlayerPlay size={13} fill="currentColor" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-black dark:text-white">
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

      {editing && (
        <FormModal
          open={editing}
          onClose={() => setEditing(false)}
          title="Edit Lesson"
          size="md"
          footer={editFooter}
        >
          {editContent}
        </FormModal>
      )}
    </>
  );
}