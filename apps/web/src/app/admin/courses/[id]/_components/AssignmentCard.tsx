"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconX, IconExternalLink, IconGripVertical, IconCopy, IconCheck } from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";

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
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  isDragging?: boolean;
}

export default function AssignmentCard({
  assignment,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
}: AssignmentCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description || "");
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">(
    assignment.daysFromEnrollment ? "days" : "absolute"
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
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

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

    setLoading(true);
    try {
      await api.put(`/api/admin/courses/modules/assignments/${assignment.id}`, {
        title,
        description,
        dueDate: dueDateMode === "absolute" && dueDate ? new Date(dueDate).toISOString() : undefined,
        daysFromEnrollment: dueDateMode === "days" && daysFromEnrollment ? Number(daysFromEnrollment) : null,
        maxPoints,
        questionPdfUrl: questionPdfUrl || undefined,
      });
      toast.success("Assignment updated successfully");
      setEditing(false);
      onUpdate();
    } catch {
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
    }
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
    setDueDateMode(assignment.daysFromEnrollment ? "days" : "absolute");
    setDueDate(
      assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : "",
    );
    setDaysFromEnrollment(assignment.daysFromEnrollment?.toString() ?? "");
    setMaxPoints(assignment.maxPoints);
    setQuestionPdfUrl(assignment.questionPdfUrl || "");
  };

  if (editing) {
    return (
      <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Edit Assignment</h4>
          <button
            onClick={cancelEdit}
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
          <label className="text-xs font-medium">Description</label>
          <RichEditor
            content={description}
            onChange={setDescription}
            placeholder="Enter description"
            minHeight="150px"
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
          <label className="text-xs font-medium">Google Drive PDF Link</label>
          <input
            type="url"
            value={questionPdfUrl}
            onChange={(e) => setQuestionPdfUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../preview"
            className="field text-xs"
          />
          <p className="text-[10px] text-muted">
            Paste a Google Drive embed URL to render the PDF inline for students
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={cancelEdit} className="btn-secondary text-xs">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="btn-primary text-xs"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      className={`flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 transition-all duration-200 ${isDragging ? "opacity-40 scale-[0.98]" : ""}`}
    >
      <div className="flex items-center gap-2">
        {onDragStart && (
          <span className="cursor-grab active:cursor-grabbing text-blue-400 hover:text-blue-600 transition-colors">
            <IconGripVertical size={12} />
          </span>
        )}
        <span className="text-sm font-medium text-blue-700">
          {assignment.title}
        </span>
        <button
          onClick={copyId}
          className="group relative inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors"
          title="Copy assignment ID"
        >
          {copied ? (
            <IconCheck size={10} className="text-emerald-500" />
          ) : (
            <IconCopy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            {assignment.id.slice(0, 8)}...
          </span>
        </button>
        <span className="text-xs text-blue-600">
          {assignment.maxPoints} pts
        </span>
        {assignment.daysFromEnrollment ? (
          <span className="text-xs text-blue-500">
            Due: {assignment.daysFromEnrollment}d after enrollment
          </span>
        ) : assignment.dueDate ? (
          <span className="text-xs text-blue-500">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
        ) : null}
        {assignment.questionPdfUrl && (
          <a
            href={assignment.questionPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-500 hover:text-blue-700 underline"
          >
            <IconExternalLink size={12} /> PDF
          </a>
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-primary hover:text-primary-hover px-2 py-1"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-danger hover:text-danger px-2 py-1"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
