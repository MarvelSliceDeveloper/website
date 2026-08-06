"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconRefresh } from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";

export default function AddLessonForm({
  moduleId,
  onAdded,
  open,
  onClose,
}: {
  moduleId: string;
  onAdded: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleFetchVideoInfo = async (url: string) => {
    if (!url.trim()) {
      setDurationSeconds(null);
      return;
    }
    setFetchingInfo(true);
    try {
      const data = await api.get<{
        videoId: string;
        title: string;
        durationSeconds: number;
        thumbnail: string;
      }>(`/api/youtube/video-info?url=${encodeURIComponent(url)}`);
      setDurationSeconds(data.durationSeconds);
      if (data.title && !title) setTitle(data.title);
    } catch {
      setDurationSeconds(null);
      toast.error("Failed to fetch video info. Check the URL or API key.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/modules/${moduleId}/lessons`, {
        title,
        description: desc || undefined,
        videoUrl: videoUrl || undefined,
        durationSeconds: durationSeconds ?? undefined,
        isFreePreview,
      });
      onClose();
      toast.success("Lesson added");
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add lesson");
    } finally {
      setAdding(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Add Lesson"
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adding}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            form="add-lesson-form"
          >
            {adding ? "Adding..." : "Add Lesson"}
          </button>
        </>
      }
    >
      <form id="add-lesson-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Title
          </label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter lesson title"
            className="field w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Description (optional)
          </label>
          <RichEditor
            content={desc}
            onChange={setDesc}
            placeholder="Lesson description or notes..."
            minHeight="120px"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Video URL (optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() => handleFetchVideoInfo(videoUrl)}
              placeholder="YouTube, Vimeo, etc. (auto-fetches metadata)"
              className="field w-full pr-7"
            />
            {fetchingInfo && (
              <IconRefresh
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
              />
            )}
          </div>
          {durationSeconds !== null && (
            <p className="text-[10px] text-primary">
              Duration: {Math.floor(durationSeconds / 60)} min
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isFreePreview}
            onChange={(e) => setIsFreePreview(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          <span>Free preview (accessible without enrollment)</span>
        </label>
      </form>
    </FormModal>
  );
}
