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
} from "@tabler/icons-react";
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
        dueDate: undefined,
        daysFromEnrollment: daysFromEnrollment !== "" ? Number(daysFromEnrollment) : null,
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
    setDueDateMode(assignment.daysFromEnrollment != null ? "days" : "absolute");
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
      <div className="ml-6 space-y-4 rounded-xl border border-[#e4e2f5] bg-[#f8f7fd] p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-[#1f2233]">
            Edit Assignment
          </h4>
          <button
            onClick={cancelEdit}
            className="p-1 text-[#8b8da3] hover:text-[#1f2233]"
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

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={cancelEdit}
            className="rounded-full border border-[#e4e2f5] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1f2233] hover:bg-[#f5f4fd]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="rounded-full bg-[#4f63f0] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#3f52e0] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  const dueLabel =
    assignment.daysFromEnrollment != null
      ? `Due ${assignment.daysFromEnrollment}d after enrollment`
      : assignment.dueDate
        ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}`
        : null;

  return (
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
  );
}