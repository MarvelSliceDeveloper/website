"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Batch {
  id: string;
  name: string;
  courseId: string;
  courseName?: string;
}

interface CreateAssignmentModalProps {
  batches: Batch[];
  onAssignmentCreated: () => void;
  onClose: () => void;
}

export default function CreateAssignmentModal({
  batches,
  onAssignmentCreated,
  onClose,
}: CreateAssignmentModalProps) {
  const [form, setForm] = useState({
    batchId: "",
    courseId: "",
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleBatchChange = (batchId: string) => {
    const selectedBatch = batches.find((b) => b.id === batchId);
    setForm((p) => ({
      ...p,
      batchId,
      courseId: selectedBatch?.courseId || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      await api.post("/api/assignments", {
        type: "QUIZ",
        batchId: form.batchId,
        courseId: form.courseId,
        title: form.title,
        description: form.instructions
          ? `${form.description}\n\n${form.instructions}`
          : form.description,
        dueDate: new Date(form.dueDate).toISOString(),
        maxPoints: 10,
        questions: [
          {
            questionText: form.title,
            marks: 10,
            options: [
              { optionText: "Option A", isCorrect: true },
              { optionText: "Option B", isCorrect: false },
            ],
          },
        ],
      });

      setForm({
        batchId: "",
        courseId: "",
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
      });

      onAssignmentCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Create Assignment</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Batch *
            </label>
            <select
              value={form.batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              required
              className="field"
            >
              <option value="">-- Select a batch --</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Project 1: REST API"
              required
              minLength={3}
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what the assignment is about..."
              required
              minLength={10}
              className="field min-h-[100px] resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Instructions
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              placeholder="Additional instructions (optional)"
              className="field min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              required
              className="field"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex-1"
            >
              {creating ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
