"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconX,
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconFileText,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconFile,
  IconLink,
  IconUpload,
} from "@tabler/icons-react";
import { useRef } from "react";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";

type PdfSource = "drive" | "upload";

interface Assignment {
  id: string;
  title: string;
  type: string;
  description: string | null;
  dueDate: string;
  daysFromEnrollment?: number | null;
  maxPoints: number;
  questionPdfUrl: string | null;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onUpdate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function AssignmentCard({
  assignment,
  onUpdate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: AssignmentCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description || "");
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">(
    assignment.daysFromEnrollment != null ? "days" : "absolute"
  );
  const [dueDate, setDueDate] = useState(
    assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : "",
  );
  const [daysFromEnrollment, setDaysFromEnrollment] = useState(
    assignment.daysFromEnrollment?.toString() ?? ""
  );
  const [maxPoints, setMaxPoints] = useState(assignment.maxPoints);
  const [questionPdfUrl, setQuestionPdfUrl] = useState(
    assignment.questionPdfUrl || "",
  );
  const [pdfSource, setPdfSource] = useState<PdfSource>(
    assignment.questionPdfUrl?.includes("/uploads/") ? "upload" : "drive",
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const copyId = async () => {
    await navigator.clipboard.writeText(assignment.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (pdfSource === "drive" && !questionPdfUrl.trim()) {
      toast.error("Please enter a Google Drive link or switch to PDF upload");
      return;
    }
    if (pdfSource === "upload" && !pdfFile && !assignment.questionPdfUrl) {
      toast.error("Please upload a PDF or switch to Google Drive link");
      return;
    }

    setLoading(true);
    try {
      let savedPdfUrl: string | undefined;

      if (pdfSource === "upload") {
        if (pdfFile) {
          setUploading(true);
          const formData = new FormData();
          formData.append("questionPdf", pdfFile);
          const uploadRes = await api.post<{ fileUrl: string }>(
            "/api/assignments/upload-pdf",
            formData,
          );
          savedPdfUrl = uploadRes.fileUrl;
          setUploading(false);
        } else {
          savedPdfUrl = assignment.questionPdfUrl || undefined;
        }
      } else {
        savedPdfUrl = questionPdfUrl.trim() || undefined;
      }

      await api.put(`/api/admin/courses/modules/assignments/${assignment.id}`, {
        title,
        description,
        dueDate: undefined,
        daysFromEnrollment: daysFromEnrollment !== "" ? Number(daysFromEnrollment) : null,
        maxPoints,
        questionPdfUrl: savedPdfUrl,
      });
      toast.success("Assignment updated successfully");
      setEditing(false);
      onUpdate();
    } catch {
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      e.target.value = "";
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
  };

  const clearPdf = () => {
    setPdfFile(null);
    setPdfName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/courses/modules/assignments/${assignment.id}`);
      toast.success("Assignment deleted successfully");
      onUpdate();
    } catch {
      toast.error("Failed to delete assignment");
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setTitle(assignment.title);
    setDescription(assignment.description || "");
    setDueDateMode(assignment.daysFromEnrollment != null ? "days" : "absolute");
    setDueDate(
      assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : "",
    );
    setDaysFromEnrollment(assignment.daysFromEnrollment?.toString() ?? "");
    setMaxPoints(assignment.maxPoints);
    setQuestionPdfUrl(assignment.questionPdfUrl || "");
    setPdfSource(
      assignment.questionPdfUrl?.includes("/uploads/") ? "upload" : "drive",
    );
    setPdfFile(null);
    setPdfName("");
  };

  const editFooter = (
    <>
      <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
      <button
        onClick={handleUpdate}
        disabled={loading || uploading}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
      >
        {uploading ? "Uploading PDF..." : loading ? "Saving..." : "Save Changes"}
      </button>
    </>
  );

  const editContent = (
    <>
      <div className="space-y-2">
        <label className="text-xs font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter assignment title"
          className="field w-full"
        />
      </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Description</label>
          <RichEditor
            content={description}
            onChange={setDescription}
            placeholder="Enter description"
            minHeight="150px"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Due Date (Days After Enrollment)</label>
          <input
            type="number"
            value={daysFromEnrollment}
            onChange={(e) => setDaysFromEnrollment(e.target.value)}
            placeholder="e.g. 10"
            className="field"
            min={1}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Max Points</label>
            <input
              type="number"
              value={maxPoints}
              onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
              min={1}
              className="field"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Question Paper Source</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPdfSource("drive")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                pdfSource === "drive"
                  ? "border-[#4f63f0]/50 bg-[#4f63f0]/10 text-[#4f63f0]"
                  : "border-[#e4e2f5] text-[#8b8da3] hover:bg-[#f5f4fd]"
              }`}
            >
              <IconLink size={14} />
              Google Drive Link
            </button>
            <button
              type="button"
              onClick={() => setPdfSource("upload")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                pdfSource === "upload"
                  ? "border-[#4f63f0]/50 bg-[#4f63f0]/10 text-[#4f63f0]"
                  : "border-[#e4e2f5] text-[#8b8da3] hover:bg-[#f5f4fd]"
              }`}
            >
              <IconUpload size={14} />
              Upload PDF
            </button>
          </div>
          <p className="text-[10px] text-[#8b8da3]">
            Provide either a Google Drive link or upload a PDF, not both.
          </p>
        </div>

        {pdfSource === "drive" ? (
          <div className="space-y-2">
            <label className="text-xs font-medium">Google Drive PDF Link</label>
            <input
              type="url"
              value={questionPdfUrl}
              onChange={(e) => setQuestionPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../preview"
              className="field text-xs"
            />
            <p className="text-[10px] text-[#8b8da3]">
              Paste a Google Drive embed URL to render the PDF inline for students
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium">PDF Upload</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfSelect}
              className="hidden"
            />
            {pdfName ? (
              <div className="flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5">
                <IconFile size={14} className="text-violet-600 shrink-0" />
                <span className="text-xs text-[#1f2233] truncate flex-1">
                  {pdfName}
                </span>
                <button
                  type="button"
                  onClick={clearPdf}
                  className="text-[#8b8da3] hover:text-danger"
                >
                  <IconX size={12} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-[#e4e2f5] px-3 py-2 text-xs text-[#8b8da3] hover:bg-violet-500/10 hover:text-violet-600 hover:border-violet-500/30 transition-colors"
                >
                  <IconFile size={13} />
                  Upload PDF (max 10 MB)
                </button>
                {assignment.questionPdfUrl && !pdfName && (
                  <p className="text-[10px] text-[#8b8da3]">
                    Current:{" "}
                    <a
                      href={assignment.questionPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563eb] underline"
                    >
                      view PDF
                    </a>{" "}
                    — upload a new file to replace it.
                  </p>
                )}
              </>
            )}
          </div>
        )}
    </>
  );

  const dueLabel =
    assignment.daysFromEnrollment != null
      ? `Due ${assignment.daysFromEnrollment}d after enrollment`
      : assignment.dueDate
        ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}`
        : null;

  return (
    <>
    <div className="group flex items-center gap-2.5 rounded-xl border border-[#e4e2f5] bg-white px-2.5 py-2 transition-all duration-200 hover:border-[#cfcbe8] hover:bg-[#f8f7fd]">
      <div className="flex shrink-0 flex-col">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
          title="Move up"
        >
          <IconChevronUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
          title="Move down"
        >
          <IconChevronDown size={13} />
        </button>
      </div>

      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
        <IconFileText size={13} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-[#1f2233]">
            {assignment.title}
          </p>
          <button
            onClick={copyId}
            className="group/copy relative inline-flex items-center gap-1 text-[10px] font-mono text-[#8b8da3]/70 transition-colors hover:text-[#1f2233]"
            title="Copy assignment ID"
          >
            {copied ? (
              <IconCheck size={10} className="text-emerald-500" />
            ) : (
              <IconCopy
                size={10}
                className="opacity-0 transition-opacity group-hover/copy:opacity-100"
              />
            )}
          </button>
          {assignment.questionPdfUrl && (
            <a
              href={assignment.questionPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[9.5px] font-medium text-[#2563eb] underline hover:text-blue-700"
            >
              <IconExternalLink size={11} /> PDF
            </a>
          )}
        </div>
        {dueLabel && (
          <p className="mt-0.5 text-[10.5px] text-[#8b8da3]">{dueLabel}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap text-[11.5px] text-[#8b8da3]">
          {assignment.maxPoints} Pts
        </span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md px-1.5 py-1 text-[10px] font-medium text-[#4f63f0] transition-colors hover:bg-[#4f63f0]/10"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
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
          onClose={cancelEdit}
          title="Edit Assignment"
          size="lg"
          footer={editFooter}
        >
          {editContent}
        </FormModal>
      )}
    </>
  );
}