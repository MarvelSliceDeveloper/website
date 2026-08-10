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
  IconBrain,
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
      await api.delete(`/api/admin/courses/modules/practicals/${practical.id}`);
      toast.success("Practical deleted");
      onUpdate();
    } catch {
      toast.error("Failed to delete practical");
    }
  };

  const hasVideo = !!practical.videoUrl;
  const hasPdf = !!practical.pdfUrl;
  const resourceCount = practical.resources?.length ?? 0;

  if (editing) {
    return (
      <div className="ml-6 space-y-2 rounded-xl border border-[#e4e2f5] bg-[#f8f7fd] p-3">
        <input
          type="text"
          value={editForm.title}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, title: e.target.value }))
          }
          className="field py-1 text-xs"
          autoFocus
        />
        <input
          type="text"
          value={editForm.description}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Description (optional)"
          className="field py-1 text-xs"
        />
        <input
          type="url"
          value={editForm.videoUrl}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, videoUrl: e.target.value }))
          }
          placeholder="Video URL (optional)"
          className="field py-1 text-xs"
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
            <div className="flex items-center gap-2 rounded-lg border border-[#8b5cf6]/30 bg-[#f0eaff] px-2.5 py-1.5">
              <IconFile size={14} className="shrink-0 text-[#8b5cf6]" />
              <span className="flex-1 truncate text-xs text-[#1f2233]">
                {pdfName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPdfFile(null);
                  setPdfName("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-[#8b8da3] hover:text-danger"
              >
                <IconX size={12} />
              </button>
            </div>
          ) : hasPdf ? (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5">
              <IconFile size={14} className="shrink-0 text-blue-500" />
              <span className="flex-1 truncate text-xs text-[#1f2233]">
                Current PDF
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[10px] text-[#4f63f0] hover:underline"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#e4e2f5] px-3 py-2 text-xs text-[#8b8da3] transition-colors hover:border-[#8b5cf6]/30 hover:bg-[#f0eaff] hover:text-[#8b5cf6]"
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
            className="flex items-center gap-1 rounded-full bg-[#4f63f0] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#3f52e0] disabled:opacity-50"
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
            className="rounded-full border border-[#e4e2f5] bg-white px-3 py-1.5 text-xs font-medium text-[#1f2233] hover:bg-[#f5f4fd]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-xl border border-[#e4e2f5] bg-white px-2.5 py-2 transition-all duration-200 ${
        isDragging ? "scale-[0.98] opacity-40" : "hover:border-[#cfcbe8] hover:bg-[#f8f7fd]"
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
    >
      <span
        className="shrink-0 cursor-grab text-[#c7c6dd] transition-colors hover:text-[#a3a1c9] active:cursor-grabbing"
        onDragStart={onDragStart}
      >
        <IconGripVertical size={13} />
      </span>

      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#8b5cf6]">
        <IconBrain size={13} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#1f2233]">
          {practical.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {hasVideo && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8b5cf6]">
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
            <span className="text-[10px] text-[#8b8da3]">No content yet</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-[#8b8da3] transition-colors hover:bg-[#4f63f0]/10 hover:text-[#4f63f0]"
          title="Edit"
        >
          <IconEdit size={12} />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-md p-1 text-[#8b8da3] transition-colors hover:bg-danger/10 hover:text-danger"
          title="Delete"
        >
          <IconTrash size={12} />
        </button>
      </div>
    </div>
  );
}