"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus, IconX } from "@tabler/icons-react";

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
  const [type, setType] = useState<"ASSIGNMENT" | "QUIZ">("ASSIGNMENT");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
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
        type,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        maxPoints,
        courseId,
        batchId,
      });
      toast.success("Assignment added successfully");
      onSuccess();
    } catch (error) {
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
        <label className="text-xs font-medium">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "ASSIGNMENT" | "QUIZ")}
          className="field"
        >
          <option value="ASSIGNMENT">Assignment</option>
          <option value="QUIZ">Quiz</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          className="field min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Due Date (optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field"
          />
        </div>
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
