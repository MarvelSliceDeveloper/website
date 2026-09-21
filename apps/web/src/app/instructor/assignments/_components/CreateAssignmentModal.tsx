"use client";

import { useState, useMemo } from "react";
import { FormModal } from "@/components/admin/FormModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconUpload, IconFile, IconX, IconCheck } from "@tabler/icons-react";
import type { InstructorBatch, InstructorCourse } from "../types";

interface CreateAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  courses: InstructorCourse[];
  batches: InstructorBatch[];
}

export function CreateAssignmentModal({
  open,
  onClose,
  courses,
  batches,
}: CreateAssignmentModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Filter batches for the selected course
  const availableBatches = useMemo(() => {
    if (!courseId) return batches;
    return batches.filter((b) => {
      if (b.courseId === courseId) return true;
      if (b.courseMentors?.some((cm) => cm.course.id === courseId)) return true;
      return false;
    });
  }, [courseId, batches]);

  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    // If current batch doesn't match new course, reset or pick first available
    const matching = batches.filter(
      (b) =>
        b.courseId === newCourseId ||
        b.courseMentors?.some((cm) => cm.course.id === newCourseId),
    );
    if (matching.length > 0) {
      setBatchId(matching[0].id);
    } else {
      setBatchId("");
    }
  };

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

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      courseId: string;
      batchId: string;
      description: string;
      dueDate: string;
      maxPoints: number;
      questionPdfUrl?: string;
    }) => api.post("/api/assignments", payload),
    onSuccess: () => {
      toast.success("Assignment created successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["instructor", "assignments"],
      });
      handleClose();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleClose = () => {
    setTitle("");
    setCourseId("");
    setBatchId("");
    setDescription("");
    setDueDate("");
    setMaxPoints(100);
    setPdfFile(null);
    setPdfUrl("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (!courseId) {
      toast.error("Please select a course");
      return;
    }
    if (!batchId) {
      toast.error("Please select a batch");
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

    createMutation.mutate({
      title: title.trim(),
      courseId,
      batchId,
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      maxPoints: Number(maxPoints) || 100,
      questionPdfUrl: pdfUrl || undefined,
    });
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Create New Assignment"
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={handleClose}
            disabled={createMutation.isPending || uploadingPdf}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={uploadingPdf}
          >
            Create Assignment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Assignment Title" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build an End-to-End Machine Learning Pipeline"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Course" required>
            <select
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              required
            >
              <option value="">Select a Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Target Batch" required>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              required
              disabled={!courseId}
            >
              <option value="">
                {courseId ? "Select a Batch" : "First select a course"}
              </option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

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
            <span>Attach Question Paper PDF (Optional)</span>
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
                    <IconCheck size={12} /> Uploaded & Ready
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
                    : "Click to upload question paper PDF"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Drag and drop or browse from your computer
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
