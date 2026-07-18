"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus, IconRefresh } from "@tabler/icons-react";

export default function AddLessonForm({
  moduleId,
  courseId,
  onAdded,
}: {
  moduleId: string;
  courseId: string;
  onAdded: () => void;
}) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  const handleFetchVideoInfo = useCallback(async (url: string) => {
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
  }, [title]);

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
      setTitle("");
      setDesc("");
      setVideoUrl("");
      setDurationSeconds(null);
      setIsFreePreview(false);
      setShow(false);
      toast.success("Lesson added");
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add lesson");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-t border-border/30 ml-6">
      {show ? (
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson title (required)"
            className="field text-xs"
            required
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="field text-xs"
          />
          <div className="relative">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() => handleFetchVideoInfo(videoUrl)}
              placeholder="Video URL — YouTube (optional)"
              className="field text-xs pr-7"
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
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={isFreePreview}
              onChange={(e) => setIsFreePreview(e.target.checked)}
              className="h-3 w-3 accent-primary"
            />
            Free preview
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              {adding ? (
                "Adding..."
              ) : (
                <>
                  <IconPlus size={14} /> Add Lesson
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <IconPlus size={14} /> Add Lesson
        </button>
      )}
    </div>
  );
}
