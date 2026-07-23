"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconX, IconPlus, IconFile } from "@tabler/icons-react";

export default function AddPracticalForm({
  moduleId,
  courseId,
  onSuccess,
  onCancel,
}: {
  moduleId: string;
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF must be under 50 MB");
      e.target.value = "";
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoUrl && !pdfFile) {
      toast.error("Provide at least a video URL or upload a PDF");
      return;
    }

    setSubmitting(true);
    try {
      let pdfUrl: string | undefined;

      if (pdfFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        const uploadRes = await api.post<{ url: string }>(
          `/api/admin/courses/${courseId}/practicals/pdf`,
          formData,
        );
        pdfUrl = uploadRes.url;
        setUploading(false);
      }

      await api.post(`/api/admin/courses/modules/${moduleId}/practicals`, {
        title: title.trim(),
        description: description || undefined,
        videoUrl: videoUrl || undefined,
        pdfUrl,
      });
      toast.success("Practical added");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add practical",
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-violet-600">
          Add Hands-On / Practical
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-muted hover:text-foreground"
        >
          <IconX size={14} />
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title *"
        className="field text-xs"
        autoFocus
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="field text-xs"
      />

      <input
        type="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Video URL (YouTube, Vimeo, etc.)"
        className="field text-xs"
      />

      <div className="space-y-1.5">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={handlePdfSelect}
          className="hidden"
        />
        {pdfName ? (
          <div className="flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5">
            <IconFile size={14} className="text-violet-600 shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">
              {pdfName}
            </span>
            <button
              type="button"
              onClick={() => {
                setPdfFile(null);
                setPdfName("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-muted hover:text-danger"
            >
              <IconX size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 hover:border-violet-500/30 transition-colors"
          >
            <IconFile size={13} />
            Upload PDF (optional)
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted">
        Provide at least a video URL or upload a PDF. Resources can be added
        after creation.
      </p>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
        >
          <IconPlus size={12} />
          {uploading
            ? "Uploading PDF..."
            : submitting
              ? "Adding..."
              : "Add Practical"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
