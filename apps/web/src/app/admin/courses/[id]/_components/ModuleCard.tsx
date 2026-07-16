"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconGripVertical,
  IconDeviceFloppy,
  IconTrash,
  IconPlus,
  IconFile,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import type { Module, Resource } from "./types";
import LessonCard from "./LessonCard";
import AddLessonForm from "./AddLessonForm";
import QuizCard from "./QuizCard";
import AddQuizForm from "./AddQuizForm";
import AssignmentCard from "./AssignmentCard";
import AddAssignmentForm from "./AddAssignmentForm";

const ALLOWED_RESOURCE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_RESOURCE_SIZE = 50 * 1024 * 1024;

export default function ModuleCard({
  module: mod,
  index,
  courseId,
  onChanged,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
}: {
  module: Module;
  index: number;
  courseId: string;
  onChanged: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isDragging: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: mod.title,
    description: mod.description || "",
  });
  const [lessonDragIdx, setLessonDragIdx] = useState<number | null>(null);
  const [lessonOverIdx, setLessonOverIdx] = useState<number | null>(null);
  const [quizDragIdx, setQuizDragIdx] = useState<number | null>(null);
  const [quizOverIdx, setQuizOverIdx] = useState<number | null>(null);
  const [resourceDragIdx, setResourceDragIdx] = useState<number | null>(null);
  const [resourceOverIdx, setResourceOverIdx] = useState<number | null>(null);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showStudyMaterialUpload, setShowStudyMaterialUpload] = useState(false);
  const [resourceLessonId, setResourceLessonId] = useState<string>(
    mod.lessons[0]?.id || ""
  );
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceError, setResourceError] = useState("");

  const allResources: Array<Resource & { lessonTitle: string; lessonId: string }> = 
    mod.lessons.flatMap((lesson) =>
      (lesson.resources || []).map((resource) => ({
        ...resource,
        lessonTitle: lesson.title,
        lessonId: lesson.id,
      }))
    );

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/${mod.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
      });
      setEditing(false);
      toast.success("Module updated");
      onChanged();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update module",
      );
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete module "${mod.title}"?\n\nThis will also delete all ${mod.lessons.length} lesson(s), ${mod.quizzes.length} quiz(zes), and ${mod.assignments.length} assignment(s) in this module. This action cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/api/admin/courses/modules/${mod.id}`);
      toast.success("Module deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete module");
    }
  };

  const handleLessonDrop = async (dropIdx: number) => {
    if (lessonDragIdx === null || lessonDragIdx === dropIdx) {
      setLessonDragIdx(null);
      setLessonOverIdx(null);
      return;
    }
    const reordered = [...mod.lessons];
    const [moved] = reordered.splice(lessonDragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setLessonDragIdx(null);
    setLessonOverIdx(null);
    try {
      await api.patch(`/api/admin/courses/modules/${mod.id}/lessons/reorder`, {
        lessonIds: reordered.map((l) => l.id),
      });
      onChanged();
    } catch {
      toast.error("Failed to reorder lessons");
      onChanged();
    }
  };

  const handleQuizDrop = async (dropIdx: number) => {
    if (quizDragIdx === null || quizDragIdx === dropIdx) {
      setQuizDragIdx(null);
      setQuizOverIdx(null);
      return;
    }
    const reordered = [...mod.quizzes];
    const [moved] = reordered.splice(quizDragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setQuizDragIdx(null);
    setQuizOverIdx(null);
    try {
      await api.patch(`/api/admin/courses/modules/${mod.id}/quizzes/reorder`, {
        quizIds: reordered.map((q) => q.id),
      });
      onChanged();
    } catch {
      toast.error("Failed to reorder quizzes");
      onChanged();
    }
  };

  const handleResourceDrop = async (dropIdx: number) => {
    if (resourceDragIdx === null || resourceDragIdx === dropIdx) {
      setResourceDragIdx(null);
      setResourceOverIdx(null);
      return;
    }
    const reordered = [...allResources];
    const [moved] = reordered.splice(resourceDragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setResourceDragIdx(null);
    setResourceOverIdx(null);

    const groupedByLesson: Record<string, string[]> = {};
    for (const r of reordered) {
      if (!groupedByLesson[r.lessonId]) groupedByLesson[r.lessonId] = [];
      groupedByLesson[r.lessonId].push(r.id);
    }

    try {
      await Promise.all(
        Object.entries(groupedByLesson).map(([lessonId, resourceIds]) =>
          api.patch(`/api/admin/courses/lessons/${lessonId}/resources/reorder`, {
            resourceIds,
          })
        )
      );
      onChanged();
    } catch {
      toast.error("Failed to reorder resources");
      onChanged();
    }
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResourceError("");

    if (!ALLOWED_RESOURCE_TYPES.has(file.type)) {
      setResourceError("File type not allowed. Upload PDF, DOCX, PPTX, XLSX, or images.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_RESOURCE_SIZE) {
      setResourceError("File too large. Maximum size is 50 MB.");
      e.target.value = "";
      return;
    }

    const lessonId = resourceLessonId || mod.lessons[0]?.id;
    if (!lessonId) {
      setResourceError("No lesson available to attach resources to.");
      e.target.value = "";
      return;
    }

    setUploadingResource(true);
    try {
      const uploadData = new FormData();
      uploadData.append("resource", file);
      await api.post(
        `/api/admin/courses/${courseId}/lessons/${lessonId}/resources`,
        uploadData
      );
      toast.success("Resource uploaded");
      onChanged();
      e.target.value = "";
    } catch (err: unknown) {
      setResourceError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (lessonId: string, resourceId: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await api.delete(
        `/api/admin/courses/lessons/${lessonId}/resources/${resourceId}`
      );
      toast.success("Resource deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const itemCount = mod.lessons.length + mod.quizzes.length + mod.assignments.length;

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-200 ${isDragging ? "opacity-40 scale-[0.97]" : "hover:border-primary/30"}`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div
          className="flex flex-col items-center gap-1 pt-1.5 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors"
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            onDrop();
          }}
          onDragEnd={() => {}}
        >
          <IconGripVertical size={16} />
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
                className="field text-sm"
                autoFocus
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description"
                className="field text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <IconDeviceFloppy size={14} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {mod.title}
              </p>
              {mod.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {mod.description}
                </p>
              )}
            </>
          )}
          {!editing && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted">
              <span>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted hover:text-foreground transition-colors p-1"
            >
              <span
                className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              >
                &#x25B6;
              </span>
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-md hover:bg-primary/12"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-danger/12"
              title="Delete module"
            >
              <IconTrash size={15} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/40">
          {mod.lessons.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                No lessons yet. Add one below.
              </p>
            </div>
          ) : (
            <div className="py-2 px-2 space-y-1">
              {mod.lessons.map((lesson, lidx) => (
                <div key={lesson.id}>
                  {lessonOverIdx === lidx &&
                    lessonDragIdx !== lidx &&
                    lessonOverIdx !== null && (
                      <div className="h-0.5 rounded-full bg-primary/30 mx-6" />
                    )}
                  <LessonCard
                    lesson={lesson}
                    index={lidx}
                    onChanged={onChanged}
                    onDragStart={() => setLessonDragIdx(lidx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setLessonOverIdx(lidx);
                    }}
                    onDragLeave={() => setLessonOverIdx(null)}
                    onDrop={() => handleLessonDrop(lidx)}
                    isDragging={lessonDragIdx === lidx}
                  />
                </div>
              ))}
            </div>
          )}

          {mod.quizzes && mod.quizzes.length > 0 && (
            <div className="py-2 px-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-600">
                Quizzes
              </div>
              {mod.quizzes.map((quiz, qIdx) => (
                <div key={quiz.id}>
                  {quizOverIdx === qIdx &&
                    quizDragIdx !== qIdx &&
                    quizOverIdx !== null && (
                      <div className="h-0.5 rounded-full bg-primary/30 mx-6" />
                    )}
                  <QuizCard
                    quiz={quiz}
                    onUpdate={onChanged}
                    onDragStart={() => setQuizDragIdx(qIdx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setQuizOverIdx(qIdx);
                    }}
                    onDragLeave={() => setQuizOverIdx(null)}
                    onDrop={() => handleQuizDrop(qIdx)}
                    isDragging={quizDragIdx === qIdx}
                  />
                </div>
              ))}
            </div>
          )}

          {mod.assignments && mod.assignments.length > 0 && (
            <div className="py-2 px-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-600">
                Assignments
              </div>
              {mod.assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onUpdate={onChanged}
                />
              ))}
            </div>
          )}

          {mod.lessons.length > 0 && (
            <div className="py-2 px-2 border-t border-border/40">
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 mb-2">
                Study Materials ({allResources.length})
              </div>

              {allResources.length > 0 ? (
                <div className="space-y-1">
                  {allResources.map((resource, rIdx) => (
                    <div
                      key={resource.id}
                      draggable
                      onDragStart={() => setResourceDragIdx(rIdx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setResourceOverIdx(rIdx);
                      }}
                      onDragLeave={() => setResourceOverIdx(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleResourceDrop(rIdx);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-card/50 text-xs transition-all duration-200 cursor-grab active:cursor-grabbing ${
                        resourceDragIdx === rIdx ? "opacity-40 scale-[0.98]" : ""
                      }`}
                    >
                      <IconGripVertical size={12} className="text-muted shrink-0" />
                      <IconFile size={12} className="text-success shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-foreground">{resource.originalName}</p>
                        <p className="text-[10px] text-muted truncate">{resource.lessonTitle}</p>
                      </div>
                      <a
                        href={resource.url}
                        download
                        className="text-muted hover:text-foreground transition-colors p-1"
                      >
                        <IconDownload size={12} />
                      </a>
                      <button
                        onClick={() => handleDeleteResource(resource.lessonId, resource.id)}
                        className="text-muted hover:text-danger transition-colors p-1"
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted text-center">
                  No study materials yet. Click "Study Material" below to upload.
                </p>
              )}
            </div>
          )}

          <div className="px-2 py-2 space-y-2">
            {showAddQuiz ? (
              <AddQuizForm
                moduleId={mod.id}
                onSuccess={() => {
                  setShowAddQuiz(false);
                  onChanged();
                }}
                onCancel={() => setShowAddQuiz(false)}
              />
            ) : showAddAssignment ? (
              <AddAssignmentForm
                moduleId={mod.id}
                courseId={courseId}
                batchId=""
                onSuccess={() => {
                  setShowAddAssignment(false);
                  onChanged();
                }}
                onCancel={() => setShowAddAssignment(false)}
              />
            ) : showStudyMaterialUpload ? (
              <div className="rounded-lg border border-success/20 bg-success/5 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-success">Add Study Material</h4>
                  <button
                    onClick={() => setShowStudyMaterialUpload(false)}
                    className="p-1 text-muted hover:text-foreground"
                  >
                    <IconX size={14} />
                  </button>
                </div>

                {mod.lessons.length === 0 ? (
                  <p className="text-xs text-muted">Add a lesson first to attach study materials.</p>
                ) : (
                  <>
                    {mod.lessons.length > 1 && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Attach to Lesson</label>
                        <select
                          value={resourceLessonId}
                          onChange={(e) => setResourceLessonId(e.target.value)}
                          className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background"
                        >
                          {mod.lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-success/10 transition-colors text-xs text-success">
                      <IconPlus size={14} />
                      {uploadingResource ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        onChange={(e) => {
                          handleResourceUpload(e);
                          if (!e.target.files?.[0]) return;
                          setTimeout(() => setShowStudyMaterialUpload(false), 500);
                        }}
                        disabled={uploadingResource}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                      />
                    </label>

                    {resourceError && (
                      <p className="text-[10px] text-danger">{resourceError}</p>
                    )}

                    <p className="text-[10px] text-muted">
                      Accepted: PDF, DOCX, PPTX, XLSX, Images (max 50 MB)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2 px-2">
                <button
                  onClick={() => setShowAddQuiz(true)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors px-2 py-1 rounded-md hover:bg-amber-50 flex items-center gap-1"
                >
                  <IconPlus size={12} />
                  Add Quiz
                </button>
                <button
                  onClick={() => setShowAddAssignment(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 flex items-center gap-1"
                >
                  <IconPlus size={12} />
                  Add Assignment
                </button>
                <button
                  onClick={() => setShowStudyMaterialUpload(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded-md hover:bg-emerald-50 flex items-center gap-1"
                >
                  <IconPlus size={12} />
                  Study Material
                </button>
              </div>
            )}
          </div>

          <AddLessonForm
            moduleId={mod.id}
            courseId={courseId}
            onAdded={onChanged}
          />
        </div>
      )}
    </div>
  );
}
