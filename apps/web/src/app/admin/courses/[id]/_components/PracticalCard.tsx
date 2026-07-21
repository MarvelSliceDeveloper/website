"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconGripVertical,
  IconTrash,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconVideo,
  IconFile,
  IconDownload,
} from "@tabler/icons-react";
import type { Practical } from "./types";

export default function PracticalCard({
  practical,
  index,
  courseId,
  onUpdate,
  onDragStart,
  isDragging,
}: {
  practical: Practical;
  index: number;
  courseId: string;
  onUpdate: () => void;
  onDragStart: () => void;
  isDragging: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: practical.title,
    description: practical.description || "",
    videoUrl: practical.videoUrl || "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [uploading, setUploading] = useState(false);
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

  const handleSave = async () => {
    try {
      let pdfUrl = practical.pdfUrl || undefined;

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

      await api.put(`/api/admin/courses/modules/practicals/${practical.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        videoUrl: editForm.videoUrl || undefined,
        pdfUrl,
      });
      setEditing(false);
      setPdfFile(null);
      setPdfName("");
      toast.success("Practical updated");
      onUpdate();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update practical",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete practical "${practical.title}"?`)) return;
    try {
      await api.delete(
        `/api/admin/courses/modules/practicals/${practical.id}`,
      );
      toast.success("Practical deleted");
      onUpdate();
    } catch {
      toast.error("Failed to delete practical");
    }
  };

  const hasVideo = !!practical.videoUrl;
  const hasPdf = !!practical.pdfUrl;
  const resourceCount = practical.resources?.length ?? 0;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 group ${
        isDragging ? "opacity-40 scale-[0.98]" : "hover:bg-card/50"
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
    >
      <div
        className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors shrink-0"
        onDragStart={onDragStart}
      >
        <IconGripVertical size={14} />
      </div>

      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 shrink-0">
        <span className="text-[10px] font-bold text-violet-500">
          {index + 1}
        </span>
      </div>

      {editing ? (
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, title: e.target.value }))
            }
            className="field text-xs py-1"
            autoFocus
          />
          <input
            type="text"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Description (optional)"
            className="field text-xs py-1"
          />
          <input
            type="url"
            value={editForm.videoUrl}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, videoUrl: e.target.value }))
            }
            placeholder="Video URL (optional)"
            className="field text-xs py-1"
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
            ) : hasPdf ? (
              <div className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5">
                <IconFile size={14} className="text-blue-500 shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">
                  Current PDF
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-[10px] text-primary hover:underline"
                >
                  Replace
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={uploading}
              className="btn-primary text-xs px-3 py-1 flex items-center gap-1 disabled:opacity-50"
            >
              <IconDeviceFloppy size={12} />{" "}
              {uploading ? "Uploading..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setPdfFile(null);
                setPdfName("");
              }}
              className="btn-secondary text-xs px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {practical.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {hasVideo && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-500">
                <IconVideo size={10} /> Video
              </span>
            )}
            {hasPdf && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-500">
                <IconFile size={10} /> PDF
              </span>
            )}
            {resourceCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
                <IconDownload size={10} /> {resourceCount} file
                {resourceCount !== 1 ? "s" : ""}
              </span>
            )}
            {!hasVideo && !hasPdf && resourceCount === 0 && (
              <span className="text-[10px] text-muted">No content yet</span>
            )}
          </div>
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
            title="Edit"
          >
            <IconEdit size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-muted hover:text-danger transition-colors rounded hover:bg-danger/10"
            title="Delete"
          >
            <IconTrash size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
