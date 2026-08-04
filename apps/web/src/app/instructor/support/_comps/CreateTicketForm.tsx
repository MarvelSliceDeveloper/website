"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

interface CreateTicketFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateTicketForm({
  onSuccess,
  onCancel,
}: CreateTicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/api/tickets", {
        type: "SUPPORT",
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Support ticket created");
      onSuccess();
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border/60 bg-card p-6 space-y-4"
    >
      <p className="font-semibold text-foreground">Create Support Ticket</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your issue"
          className="field w-full"
          required
          minLength={3}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail..."
          rows={4}
          className="field w-full resize-none"
          required
          minLength={10}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-sm"
        >
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>
    </form>
  );
}
