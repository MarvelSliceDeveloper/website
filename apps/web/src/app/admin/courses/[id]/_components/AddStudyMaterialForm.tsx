"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import { FormModal } from "@/components/admin/FormModal";
import { IconPlus } from "@tabler/icons-react";
import type { Lesson } from "./types";

const ALLOWED_RESOURCE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_RESOURCE_SIZE = 50 * 1024 * 1024;

interface AddStudyMaterialFormProps {
  courseId: string;
  lessons: Lesson[];
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddStudyMaterialForm({
  courseId,
  lessons,
  open,
  onSuccess,
  onCancel,
}: AddStudyMaterialFormProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [error, setError] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      lessonId,
    }: {
      file: File;
      lessonId: string;
    }) => {
      const uploadData = new FormData();
      uploadData.append("resource", file);
      await withLoadingToast(
        api.post(
          `/api/admin/courses/${courseId}/lessons/${lessonId}/resources`,
          uploadData,
        ),
        {
          loading: "Uploading study material...",
          success: () => "Study material uploaded successfully",
        },
      );
    },
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => setError(getErrorMessage(err)),
  });

  useEffect(() => {
    if (lessons.length > 0) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_RESOURCE_TYPES.has(file.type)) {
      setError(
        "File type not allowed. Upload PDF, DOCX, PPTX, XLSX, or images.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_RESOURCE_SIZE) {
      setError("File too large. Maximum size is 50 MB.");
      e.target.value = "";
      return;
    }

    const targetLessonId = selectedLessonId || lessons[0]?.id;
    if (!targetLessonId) {
      setError("No lesson available to attach study materials to.");
      e.target.value = "";
      return;
    }

    uploadMutation.mutate(
      { file, lessonId: targetLessonId },
      {
        onSettled: () => {
          e.target.value = "";
        },
      },
    );
  };

  const footer = (
    <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">
      Cancel
    </button>
  );

  return (
    <FormModal
      open={open}
      onClose={onCancel}
      title="Upload Study Material"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Please add at least one lesson to this module before uploading study
            materials.
          </p>
        ) : (
          <>
            {lessons.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Attach to Lesson
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full text-xs border border-border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Select File
              </label>
              <label className="flex flex-col items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-border hover:border-emerald-500/50 rounded-xl cursor-pointer hover:bg-emerald-500/5 transition-all text-xs text-emerald-600">
                <IconPlus size={20} />
                <span className="font-medium">
                  {uploadMutation.isPending
                    ? "Uploading..."
                    : "Click to select and upload file"}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadMutation.isPending}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                />
              </label>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Allowed formats:</p>
              <p>PDF, DOCX, PPTX, XLSX, JPEG, PNG, WebP (Max size: 50 MB)</p>
            </div>
          </>
        )}
      </div>
    </FormModal>
  );
}
