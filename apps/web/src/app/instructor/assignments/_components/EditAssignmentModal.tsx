"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/admin/FormModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconUpload, IconFile, IconX, IconCheck } from "@tabler/icons-react";
import type { Assignment } from "../types";

interface EditAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment | null;
}

export function EditAssignmentModal({
  open,
  onClose,
  assignment,
}: EditAssignmentModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description || "");
      try {
        const d = new Date(assignment.dueDate);
        const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(isoLocal);
      } catch {
        setDueDate("");
      }
      setMaxPoints(assignment.maxPoints || 100);
      setPdfUrl(assignment.questionPdfUrl || "");
      setPdfFile(null);
    }
  }, [assignment]);

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF file size must be less than 10MB");
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("questionPdf", file);

      const res = await api.post<{ fileUrl: string }>(
        "/api/assignments/upload-pdf",
        formData,
      );

      setPdfUrl(res.fileUrl);
      setPdfFile(file);
      toast.success("Question PDF uploaded successfully");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPdf(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      dueDate: string;
      maxPoints: number;
      questionPdfUrl?: string;
    }) => api.put(`/api/assignments/${assignment!.id}`, payload),
    onSuccess: () => {
      toast.success("Assignment updated successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["instructor", "assignments"],
      });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (!dueDate) {
      toast.error("Please set a valid due date");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter assignment instructions/description");
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      maxPoints: Number(maxPoints) || 100,
      questionPdfUrl: pdfUrl || undefined,
    });
  };

  if (!assignment) return null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Edit Assignment"
      size="lg"
      footer={
        <>
          <Button
            variant="danger"
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending || uploadingPdf}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            loading={updateMutation.isPending}
            disabled={uploadingPdf}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-muted/15 border border-border rounded-lg text-xs text-muted-foreground">
          Course:{" "}
          <strong className="text-foreground">{assignment.course.title}</strong>
          {assignment.batch && (
            <>
              {" · "}
              Batch:{" "}
              <strong className="text-foreground">
                {assignment.batch.name}
              </strong>
            </>
          )}
        </div>

        <FormField label="Assignment Title" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build an End-to-End Machine Learning Pipeline"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Due Date & Time" required>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Max Points">
            <Input
              type="number"
              min={1}
              max={1000}
              value={maxPoints}
              onChange={(e) =>
                setMaxPoints(parseInt(e.target.value, 10) || 100)
              }
            />
          </FormField>
        </div>

        <FormField label="Instructions / Description" required>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students need to accomplish, submission formats, and guidelines..."
            rows={4}
            required
          />
        </FormField>

        {/* PDF Question Paper Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Question Paper PDF</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Max 10MB · PDF only
            </span>
          </label>

          {pdfUrl ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <IconFile size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {pdfFile ? pdfFile.name : "question_paper.pdf"}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <IconCheck size={12} /> Attached
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPdfUrl("");
                  setPdfFile(null);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                title="Remove attached PDF"
              >
                <IconX size={15} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-all">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/30 text-muted-foreground mb-2">
                  <IconUpload size={20} />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {uploadingPdf
                    ? "Uploading..."
                    : "Click to upload updated question paper PDF"}
                </p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploadingPdf}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handlePdfUpload(file);
                }}
              />
            </label>
          )}
        </div>
      </form>
    </FormModal>
  );
}
