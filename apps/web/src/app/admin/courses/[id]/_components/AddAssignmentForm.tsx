"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import RichEditor from "@/components/editor/RichEditor";
import { IconX } from "@tabler/icons-react";

interface AddAssignmentFormProps {
  moduleId: string;
  courseId: string;
  batchId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddAssignmentForm({
  moduleId,
  courseId,
  batchId,
  onSuccess,
  onCancel,
}: AddAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">("absolute");
  const [dueDate, setDueDate] = useState("");
  const [daysFromEnrollment, setDaysFromEnrollment] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lateSubmissionPenaltyPercent, setLateSubmissionPenaltyPercent] = useState(25);
  const [lateSubmissionGracePeriodHrs, setLateSubmissionGracePeriodHrs] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [questionPdfUrl, setQuestionPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/courses/modules/${moduleId}/assignments`, {
        title,
        description,
        dueDate: dueDateMode === "absolute" && dueDate ? new Date(dueDate).toISOString() : undefined,
        daysFromEnrollment: dueDateMode === "days" && daysFromEnrollment ? Number(daysFromEnrollment) : undefined,
        allowLateSubmission,
        lateSubmissionPenaltyPercent: allowLateSubmission ? lateSubmissionPenaltyPercent : undefined,
        lateSubmissionGracePeriodHrs: allowLateSubmission && lateSubmissionGracePeriodHrs ? Number(lateSubmissionGracePeriodHrs) : undefined,
        maxPoints,
        questionPdfUrl: questionPdfUrl || undefined,
        courseId,
        batchId,
      });
      toast.success("Assignment added successfully");
      onSuccess();
    } catch {
      toast.error("Failed to add assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Add Assignment</h4>
        <button
          onClick={onCancel}
          className="p-1 text-muted hover:text-foreground"
        >
          <IconX size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter assignment title"
          className="field"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Description (optional)</label>
        <RichEditor
          content={description}
          onChange={setDescription}
          placeholder="Enter description"
          minHeight="150px"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Google Drive PDF Link (optional)
        </label>
        <input
          type="url"
          value={questionPdfUrl}
          onChange={(e) => setQuestionPdfUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../preview"
          className="field text-xs"
        />
      </div>

      {/* Due Date Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Due Date</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDueDateMode("absolute")}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${dueDateMode === "absolute" ? "bg-primary text-white border-primary" : "bg-paper text-ink border-hairline"}`}
          >
            Absolute Date
          </button>
          <button
            type="button"
            onClick={() => setDueDateMode("days")}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${dueDateMode === "days" ? "bg-primary text-white border-primary" : "bg-paper text-ink border-hairline"}`}
          >
            Days from Enrollment
          </button>
        </div>
      </div>

      {dueDateMode === "absolute" ? (
        <div className="space-y-2">
          <label className="text-xs font-medium">Due Date</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium">Days After Enrollment</label>
          <input
            type="number"
            value={daysFromEnrollment}
            onChange={(e) => setDaysFromEnrollment(e.target.value)}
            placeholder="e.g. 10"
            className="field"
            min={1}
          />
        </div>
      )}

      {/* Late Submission Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowLate"
          checked={allowLateSubmission}
          onChange={(e) => setAllowLateSubmission(e.target.checked)}
          className="h-4 w-4 rounded border-hairline"
        />
        <label htmlFor="allowLate" className="text-xs font-medium">
          Allow Late Submission (with penalty)
        </label>
      </div>

      {allowLateSubmission && (
        <div className="grid grid-cols-2 gap-4 pl-6">
          <div className="space-y-2">
            <label className="text-xs font-medium">Penalty %</label>
            <input
              type="number"
              value={lateSubmissionPenaltyPercent}
              onChange={(e) => setLateSubmissionPenaltyPercent(parseInt(e.target.value) || 25)}
              min={0}
              max={100}
              className="field"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Grace Period (hrs)</label>
            <input
              type="number"
              value={lateSubmissionGracePeriodHrs}
              onChange={(e) => setLateSubmissionGracePeriodHrs(e.target.value)}
              placeholder="Optional"
              min={1}
              className="field"
            />
          </div>
        </div>
      )}

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

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary text-xs"
        >
          {loading ? "Adding..." : "Add Assignment"}
        </button>
      </div>
    </div>
  );
}
