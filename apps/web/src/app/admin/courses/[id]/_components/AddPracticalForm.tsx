"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast, withLoadingToast } from "@/lib/toast";
import { IconPlus, IconX, IconFile } from "@tabler/icons-react";
import { FormModal } from "@/components/admin/FormModal";

export default function AddPracticalForm({
  moduleId,
  courseId,
  onSuccess,
  onCancel,
  open,
}: {
  moduleId: string;
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setPdfFile(null);
    setPdfName("");
  };

  const close = () => {
    resetForm();
    onCancel();
  };

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
        const uploadRes = await withLoadingToast(
          api.post<{ url: string }>(
            `/api/admin/courses/${courseId}/practicals/pdf`,
            formData,
          ),
          {
            loading: "Uploading PDF...",
            success: () => "PDF uploaded",
          },
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
      resetForm();
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

  const footer = (
    <>
      <button onClick={close} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting || uploading}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
        form="add-practical-form"
      >
        <IconPlus size={12} />
        {uploading
          ? "Uploading PDF..."
          : submitting
            ? "Adding..."
            : "Add Practical"}
      </button>
    </>
  );

  const formContent = (
    <form id="add-practical-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter practical title"
          className="field w-full"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          className="field w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Video URL (optional)
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="YouTube, Vimeo, etc."
          className="field w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          PDF Upload (optional)
        </label>
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
    </form>
  );

  return (
    <FormModal open={open} onClose={close} title="Add Practical" size="lg" footer={footer}>
      {formContent}
    </FormModal>
  );
}
