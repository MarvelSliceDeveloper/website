"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import { IconRefresh, IconSparkles } from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";
import { useAIGenerate } from "@/lib/use-ai-generate";
import type { AIModuleContext } from "./types";

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export default function AddLessonForm({
  moduleId,
  moduleTitle,
  moduleDescription,
  courseTitle,
  courseDescription,
  courseModules,
  onAdded,
  open,
  onClose,
}: {
  moduleId: string;
  moduleTitle?: string;
  moduleDescription?: string;
  courseTitle?: string;
  courseDescription?: string;
  courseModules?: AIModuleContext[];
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
  const inputRef = useRef<HTMLInputElement>(null);

  // AI description generation
  const aiGenerate = useAIGenerate<{ description: string }>();

  const handleAiDescription = () => {
    if (!title.trim()) {
      toast.error("Enter the lesson title first so the AI knows what to write about");
      return;
    }
    aiGenerate.mutate(
      {
        type: "LESSON_DESCRIPTION",
        prompt: title.trim(),
        context: {
          lessonTitle: title.trim(),
          moduleTitle: moduleTitle?.trim(),
          moduleDescription: moduleDescription?.trim(),
          courseTitle,
          courseDescription,
          modules: courseModules,
        },
      },
      {
        onSuccess: (res) => {
          if (!res.data.description) {
            toast.error("AI returned an empty description");
            return;
          }
          setDesc(plainTextToHtml(res.data.description));
          toast.success("Description written — review before saving");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const addLessonMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/admin/courses/modules/${moduleId}/lessons`, {
        title,
        description: desc || undefined,
        videoUrl: videoUrl || undefined,
        durationSeconds: durationSeconds ?? undefined,
        isFreePreview,
      }),
    onSuccess: () => {
      onClose();
      toast.success("Lesson added");
      onAdded();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

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
      const data = await withLoadingToast(
        api.get<{
          videoId: string;
          title: string;
          durationSeconds: number;
          thumbnail: string;
        }>(`/api/youtube/video-info?url=${encodeURIComponent(url)}`),
        {
          loading: "Fetching video info...",
          success: (d) => `Duration: ${Math.floor(d.durationSeconds / 60)} min`,
        },
      );
      setDurationSeconds(data.durationSeconds);
      if (data.title && !title) setTitle(data.title);
    } catch {
      setDurationSeconds(null);
      toast.error("Failed to fetch video info. Check the URL or API key.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLessonMutation.mutate();
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
            disabled={addLessonMutation.isPending}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            form="add-lesson-form"
          >
            {addLessonMutation.isPending ? "Adding..." : "Add Lesson"}
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <button
              type="button"
              onClick={handleAiDescription}
              disabled={aiGenerate.isPending}
              className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
            >
              <IconSparkles size={11} />
              {aiGenerate.isPending ? "Writing…" : "Write with AI"}
            </button>
          </div>
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
