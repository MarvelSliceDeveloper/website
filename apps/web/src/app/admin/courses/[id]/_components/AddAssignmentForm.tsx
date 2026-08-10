"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";

interface AddAssignmentFormProps {
  moduleId: string;
  courseId: string;
  batchId: string;
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}

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
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">("absolute");
  const [dueDate, setDueDate] = useState("");
  const [daysFromEnrollment, setDaysFromEnrollment] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [questionPdfUrl, setQuestionPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDateMode("absolute");
    setDueDate("");
    setDaysFromEnrollment("");
    setMaxPoints(100);
    setQuestionPdfUrl("");
  };

  const close = () => {
    resetForm();
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/courses/modules/${moduleId}/assignments`, {
        title,
        description,
        dueDate: undefined,
        daysFromEnrollment: daysFromEnrollment !== "" ? Number(daysFromEnrollment) : undefined,
        maxPoints,
        questionPdfUrl: questionPdfUrl || undefined,
        courseId,
        batchId,
      });
      toast.success("Assignment added successfully");
      resetForm();
      onSuccess();
    } catch {
      toast.error("Failed to add assignment");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button onClick={close} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
        form="add-assignment-form"
      >
        {loading ? "Adding..." : "Add Assignment"}
      </button>
    </>
  );

  const formContent = (
    <form id="add-assignment-form" onSubmit={handleSubmit} className="space-y-4">
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
          Google Drive PDF Link (optional)
        </label>
        <input
          type="url"
          value={questionPdfUrl}
          onChange={(e) => setQuestionPdfUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../preview"
          className="field text-xs w-full"
        />
      </div>

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
          Number of days after student enrollment when this assignment becomes due.
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
    <FormModal open={open} onClose={close} title="Add Assignment" size="lg" footer={footer}>
      {formContent}
    </FormModal>
  );
}
