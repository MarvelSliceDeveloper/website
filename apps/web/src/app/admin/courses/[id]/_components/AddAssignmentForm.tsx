"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconFile,
  IconLink,
  IconUpload,
  IconX,
  IconSparkles,
} from "@tabler/icons-react";

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

interface AddAssignmentFormProps {
  moduleId: string;
  courseId: string;
  batchId: string;
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}

type PdfSource = "drive" | "upload";

export default function AddAssignmentForm({
  moduleId,
  courseId,
  batchId,
  onSuccess,
  onCancel,
  open,
}: AddAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">(
    "absolute",
  );
  const [dueDate, setDueDate] = useState("");
  const [daysFromEnrollment, setDaysFromEnrollment] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [pdfSource, setPdfSource] = useState<PdfSource>("drive");
  const [driveUrl, setDriveUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // AI description generation from the uploaded question paper PDF
  const [aiNote, setAiNote] = useState("");
  const aiPdfMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", pdfFile as File);
      if (aiNote.trim()) fd.append("note", aiNote.trim());
      return api.post<{
        type: string;
        data: { title: string; description: string; maxPoints: number };
        model: string;
      }>("/api/admin/ai/generate-from-pdf", fd);
    },
    onSuccess: (res) => {
      const d = res.data;
      if (d.description) setDescription(plainTextToHtml(d.description));
      if (!title.trim() && d.title) setTitle(d.title);
      if (d.maxPoints && Number.isFinite(d.maxPoints))
        setMaxPoints(d.maxPoints);
      toast.success("Description written from the PDF — review before saving");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleAiFromPdf = () => {
    if (!pdfFile) {
      toast.error("Upload the question paper PDF first");
      return;
    }
    aiPdfMutation.mutate();
  };

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      let questionPdfUrl: string | undefined;

      if (pdfSource === "upload" && pdfFile) {
        const formData = new FormData();
        formData.append("questionPdf", pdfFile);
        const uploadRes = await withLoadingToast(
          api.post<{ fileUrl: string }>(
            "/api/assignments/upload-pdf",
            formData,
          ),
          {
            loading: "Uploading PDF...",
            success: () => "PDF uploaded",
          },
        );
        questionPdfUrl = uploadRes.fileUrl;
      } else if (pdfSource === "drive") {
        questionPdfUrl = driveUrl.trim();
      }

      await api.post(`/api/admin/courses/modules/${moduleId}/assignments`, {
        title,
        description,
        dueDate: undefined,
        daysFromEnrollment:
          daysFromEnrollment !== "" ? Number(daysFromEnrollment) : undefined,
        maxPoints,
        questionPdfUrl: questionPdfUrl || undefined,
        courseId,
        batchId,
      });
    },
    onSuccess: () => {
      toast.success("Assignment added successfully");
      resetForm();
      onSuccess();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDateMode("absolute");
    setDueDate("");
    setDaysFromEnrollment("");
    setMaxPoints(100);
    setPdfSource("drive");
    setDriveUrl("");
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
    setPdfFile(file);
    setPdfName(file.name);
  };

  const clearPdf = () => {
    setPdfFile(null);
    setPdfName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (pdfSource === "drive" && !driveUrl.trim()) {
      toast.error("Please enter a Google Drive link or switch to PDF upload");
      return;
    }
    if (pdfSource === "upload" && !pdfFile) {
      toast.error("Please upload a PDF or switch to Google Drive link");
      return;
    }

    createAssignmentMutation.mutate();
  };

  const footer = (
    <>
      <button onClick={close} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
      <button
        type="submit"
        disabled={createAssignmentMutation.isPending}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
        form="add-assignment-form"
      >
        {createAssignmentMutation.isPending ? "Adding..." : "Add Assignment"}
      </button>
    </>
  );

  const formContent = (
    <form
      id="add-assignment-form"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* AI description from uploaded PDF */}
      {pdfSource === "upload" && pdfFile && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-violet-300/50 bg-violet-500/5 p-2.5">
          <IconSparkles size={15} className="shrink-0 text-violet-500" />
          <input
            type="text"
            value={aiNote}
            onChange={(e) => setAiNote(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAiFromPdf())
            }
            placeholder="Optional — tell the AI what this PDF is about…"
            className="field flex-1 min-w-[180px] text-xs"
          />
          <button
            type="button"
            onClick={handleAiFromPdf}
            disabled={aiPdfMutation.isPending}
            className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
          >
            {aiPdfMutation.isPending ? "Reading PDF…" : "Write Description"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter assignment title"
          className="field w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Description (optional)
        </label>
        <RichEditor
          content={description}
          onChange={setDescription}
          placeholder="Enter description"
          minHeight="120px"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Question Paper Source
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPdfSource("drive")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              pdfSource === "drive"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-card-hover"
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
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            <IconUpload size={14} />
            Upload PDF
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Provide either a Google Drive link or upload a PDF, not both.
        </p>
      </div>

      {pdfSource === "drive" ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Google Drive PDF Link
          </label>
          <input
            key="drive-link"
            type="url"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../preview"
            className="field text-xs w-full"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            PDF Upload
          </label>
          <input
            key="pdf-file"
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
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
                onClick={clearPdf}
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
              Upload PDF (max 10 MB)
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Due Date (Days After Enrollment)
        </label>
        <input
          type="number"
          value={daysFromEnrollment}
          onChange={(e) => setDaysFromEnrollment(e.target.value)}
          placeholder="e.g. 10"
          className="field w-full"
          min={1}
        />
        <p className="text-[10px] text-muted-foreground">
          Number of days after student enrollment when this assignment becomes
          due.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Max Points
          </label>
          <input
            type="number"
            value={maxPoints}
            onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
            min={1}
            className="field w-full"
          />
        </div>
      </div>
    </form>
  );

  return (
    <FormModal
      open={open}
      onClose={close}
      title="Add Assignment"
      size="lg"
      footer={footer}
    >
      {formContent}
    </FormModal>
  );
}
