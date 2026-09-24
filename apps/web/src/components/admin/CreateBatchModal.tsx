"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { FormModal } from "./FormModal";

interface CreateBatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateBatchModal({
  open,
  onClose,
  onSuccess,
}: CreateBatchModalProps) {
  const queryClient = useQueryClient();
  const [packageId, setPackageId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [description, setDescription] = useState("");

  const packagesQuery = useApiQuery<{
    items: Array<{ id: string; name: string; status: string }>;
  }>(["admin", "packages"], "/api/admin/packages", undefined, {
    enabled: open,
  });

  const packages = useMemo(
    () =>
      (packagesQuery.data?.items ?? [])
        .filter((p) => p.status === "ACTIVE")
        .map((p) => ({ id: p.id, name: p.name })),
    [packagesQuery.data],
  );

  const reset = () => {
    setPackageId("");
    setName("");
    setStartDate("");
    setEndDate("");
    setMaxStudents("");
    setDescription("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
        description: description || undefined,
        packageId,
      };
      return api.post<{ id: string; name: string }>(
        "/api/admin/batches",
        body,
      );
    },
    onSuccess: (result) => {
      toast.success(`Created batch "${result.name}"`);
      queryClient.invalidateQueries({ queryKey: ["admin", "batches"] });
      reset();
      onClose();
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageId) {
      toast.error("Please select a package");
      return;
    }
    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after the start date");
      return;
    }
    createMutation.mutate();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Add Batch"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-batch-form"
            disabled={createMutation.isPending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding..." : "Add Batch"}
          </button>
        </>
      }
    >
      <form id="create-batch-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="create-batch-package" className="mb-1.5 block text-sm font-medium text-foreground">
            Package <span className="text-danger">*</span>
          </label>
          <select
            id="create-batch-package"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="field w-full"
          >
            <option value="">Select a package</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {packages.length === 0 && (
            <p className="mt-1 text-xs text-warning">
              No active packages found. Create and activate a package first.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="create-batch-name" className="mb-1.5 block text-sm font-medium text-foreground">
            Batch Name <span className="text-danger">*</span>
          </label>
          <input
            id="create-batch-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Python Batch — June 2025"
            className="field w-full"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="create-batch-start" className="mb-1.5 block text-sm font-medium text-foreground">
              Start Date <span className="text-danger">*</span>
            </label>
            <input
              id="create-batch-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="create-batch-end" className="mb-1.5 block text-sm font-medium text-foreground">
              End Date <span className="text-danger">*</span>
            </label>
            <input
              id="create-batch-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="field"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="create-batch-max" className="mb-1.5 block text-sm font-medium text-foreground">
              Max Students
            </label>
            <input
              id="create-batch-max"
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="field"
              min={1}
            />
          </div>
          <div>
            <label htmlFor="create-batch-desc" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <input
              id="create-batch-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              className="field"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Instructors can be assigned from the batch detail page after
          creation.
        </p>
      </form>
    </FormModal>
  );
}
