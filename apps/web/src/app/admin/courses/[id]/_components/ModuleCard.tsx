"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconTrash,
  IconFile,
  IconDownload,
  IconDeviceFloppy,
  IconClipboardText,
  IconFileText,
  IconBrain,
  IconVideo,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import type {
  Module,
  Resource,
  Lesson,
  Quiz,
  Assignment,
  Practical,
} from "./types";
import LessonCard from "./LessonCard";
import AddLessonForm from "./AddLessonForm";
import QuizCard from "./QuizCard";
import AddQuizForm from "./AddQuizForm";
import AssignmentCard from "./AssignmentCard";
import AddAssignmentForm from "./AddAssignmentForm";
import PracticalCard from "./PracticalCard";
import AddPracticalForm from "./AddPracticalForm";
import AddStudyMaterialForm from "./AddStudyMaterialForm";

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

type UnifiedItem =
  | { type: "LESSON"; data: Lesson }
  | { type: "QUIZ"; data: Quiz }
  | { type: "ASSIGNMENT"; data: Assignment }
  | { type: "PRACTICAL"; data: Practical };

function buildUnifiedList(mod: Module): UnifiedItem[] {
  const lessonMap = new Map(mod.lessons.map((l) => [l.id, l]));
  const quizMap = new Map(mod.quizzes.map((q) => [q.id, q]));
  const assignmentMap = new Map(mod.assignments.map((a) => [a.id, a]));
  const practicalMap = new Map((mod.practicals || []).map((p) => [p.id, p]));

  if (mod.contentOrder && mod.contentOrder.length > 0) {
    const items: UnifiedItem[] = [];
    for (const entry of mod.contentOrder) {
      if (entry.type === "LESSON" && lessonMap.has(entry.id)) {
        items.push({ type: "LESSON", data: lessonMap.get(entry.id)! });
      } else if (entry.type === "QUIZ" && quizMap.has(entry.id)) {
        items.push({ type: "QUIZ", data: quizMap.get(entry.id)! });
      } else if (entry.type === "ASSIGNMENT" && assignmentMap.has(entry.id)) {
        items.push({ type: "ASSIGNMENT", data: assignmentMap.get(entry.id)! });
      } else if (entry.type === "PRACTICAL" && practicalMap.has(entry.id)) {
        items.push({ type: "PRACTICAL", data: practicalMap.get(entry.id)! });
      }
    }
    for (const lesson of mod.lessons) {
      if (!items.some((i) => i.type === "LESSON" && i.data.id === lesson.id)) {
        items.push({ type: "LESSON", data: lesson });
      }
    }
    for (const quiz of mod.quizzes) {
      if (!items.some((i) => i.type === "QUIZ" && i.data.id === quiz.id)) {
        items.push({ type: "QUIZ", data: quiz });
      }
    }
    for (const assignment of mod.assignments) {
      if (
        !items.some((i) => i.type === "ASSIGNMENT" && i.data.id === assignment.id)
      ) {
        items.push({ type: "ASSIGNMENT", data: assignment });
      }
    }
    for (const practical of mod.practicals || []) {
      if (
        !items.some((i) => i.type === "PRACTICAL" && i.data.id === practical.id)
      ) {
        items.push({ type: "PRACTICAL", data: practical });
      }
    }
    return items;
  }

  const items: UnifiedItem[] = [];
  for (const lesson of mod.lessons)
    items.push({ type: "LESSON", data: lesson });
  for (const quiz of mod.quizzes) items.push({ type: "QUIZ", data: quiz });
  for (const assignment of mod.assignments)
    items.push({ type: "ASSIGNMENT", data: assignment });
  for (const practical of mod.practicals || [])
    items.push({ type: "PRACTICAL", data: practical });
  return items;
}

export default function ModuleCard({
  module: mod,
  index,
  courseId,
  onChanged,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  certModule,
  onAddQuestion,
  onAddAssignment,
  passingScore,
  timeLimitMin,
}: {
  module: Module;
  index: number;
  courseId: string;
  onChanged: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  certModule?: boolean;
  onAddQuestion?: () => void;
  onAddAssignment?: () => void;
  passingScore?: number;
  timeLimitMin?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: mod.title,
    description: mod.description || "",
  });
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddPractical, setShowAddPractical] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [addLessonKey, setAddLessonKey] = useState(0);
  const [showStudyMaterialUpload, setShowStudyMaterialUpload] = useState(false);
  const [resourceLessonId, setResourceLessonId] = useState<string>(
    mod.lessons[0]?.id || "",
  );
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [addContentPopoverOpen, setAddContentPopoverOpen] = useState(false);

  const unifiedItems = useMemo(() => buildUnifiedList(mod), [mod]);

  const allResources: Array<
    Resource & { lessonTitle: string; lessonId: string }
  > = mod.lessons.flatMap((lesson) =>
    (lesson.resources || []).map((resource) => ({
      ...resource,
      lessonTitle: lesson.title,
      lessonId: lesson.id,
    })),
  );

  // Close popover when clicking outside
  const toggleAddContent = () => {
    setAddContentPopoverOpen((prev) => !prev);
  };

  // Click-away handler for popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".add-content-popover-container")) {
        setAddContentPopoverOpen(false);
      }
    };
    if (addContentPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addContentPopoverOpen]);

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

  const handleMoveContent = async (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= unifiedItems.length) return;
    const reordered = [...unifiedItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const promise = api.patch(
      `/api/admin/courses/modules/${mod.id}/content/reorder`,
      {
        contentOrder: reordered.map((item) => ({
          type: item.type,
          id: item.data.id,
        })),
      },
    );
    toast.promise(promise, {
      loading: "Saving order...",
      success: "Content order saved",
      error: "Failed to reorder content",
    });
    try {
      await promise;
      onChanged();
    } catch {
      onChanged();
    }
  };

  const handleMoveResource = async (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= allResources.length) return;
    const reordered = [...allResources];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const groupedByLesson: Record<string, string[]> = {};
    for (const r of reordered) {
      if (!groupedByLesson[r.lessonId]) groupedByLesson[r.lessonId] = [];
      groupedByLesson[r.lessonId].push(r.id);
    }

    const promise = Promise.all(
      Object.entries(groupedByLesson).map(([lessonId, resourceIds]) =>
        api.patch(
          `/api/admin/courses/lessons/${lessonId}/resources/reorder`,
          {
            resourceIds,
          },
        ),
      ),
    );
    toast.promise(promise, {
      loading: "Saving order...",
      success: "Study material order saved",
      error: "Failed to reorder resources",
    });
    try {
      await promise;
      onChanged();
    } catch {
      onChanged();
    }
  };

  const handleResourceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResourceError("");

    if (!ALLOWED_RESOURCE_TYPES.has(file.type)) {
      setResourceError(
        "File type not allowed. Upload PDF, DOCX, PPTX, XLSX, or images.",
      );
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
        uploadData,
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
        `/api/admin/courses/lessons/${lessonId}/resources/${resourceId}`,
      );
      toast.success("Resource deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const itemCount =
    mod.lessons.length +
    mod.quizzes.length +
    mod.assignments.length +
    (mod.practicals?.length ?? 0);

  const hasContent = itemCount > 0 || certModule === true;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-border-hover">
      {/* Module Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Module number badge */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
        </div>

        {/* Module title / edit form */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
                className="field text-sm w-full"
                autoFocus
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description"
                className="field text-xs w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <IconDeviceFloppy size={14} />
                  Save
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
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted">
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              {mod.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {mod.description}
                </p>
              )}
              {certModule && (
                <div className="flex items-center gap-3 mt-1 text-[10px]">
                  <span className="text-amber-600 font-medium">
                    Passing: {passingScore ?? 60}%
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-blue-600">
                    {timeLimitMin ?? 30} min
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons: direct inline options & expand/edit/delete */}
        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {certModule ? (
              <>
                <button
                  onClick={onAddQuestion}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-amber-400/70 hover:bg-amber-100 hover:shadow"
                >
                  <IconClipboardText size={14} />
                  Add Question
                </button>
                <button
                  data-cert-add-assignment={mod.id}
                  onClick={() => setShowAddAssignment(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-300/60 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-blue-400/70 hover:bg-blue-100 hover:shadow"
                >
                  <IconFileText size={14} />
                  Add Assignment
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowAddLesson(true);
                    setAddLessonKey((k) => k + 1);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-300/60 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-indigo-400/70 hover:bg-indigo-100 hover:shadow"
                >
                  <IconVideo size={14} />
                  Lesson
                </button>
                <button
                  onClick={() => setShowAddQuiz(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-amber-400/70 hover:bg-amber-100 hover:shadow"
                >
                  <IconClipboardText size={14} />
                  Quiz
                </button>
                <button
                  onClick={() => setShowAddAssignment(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-300/60 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-blue-400/70 hover:bg-blue-100 hover:shadow"
                >
                  <IconFileText size={14} />
                  Assignment
                </button>
                <button
                  onClick={() => setShowAddPractical(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-300/60 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-violet-400/70 hover:bg-violet-100 hover:shadow"
                >
                  <IconBrain size={14} />
                  Practical
                </button>
                <button
                  onClick={() => setShowStudyMaterialUpload(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-emerald-400/70 hover:bg-emerald-100 hover:shadow"
                >
                  <IconFile size={14} />
                  Study Material
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg border border-border/80 bg-muted/20 text-foreground hover:bg-muted/50 hover:border-border transition-all duration-200"
              title={expanded ? "Collapse" : "Expand"}
            >
              <IconChevronDown
                size={18}
                className={`transition-transform duration-200 ${expanded ? "rotate-180 text-primary" : "text-muted-foreground"}`}
              />
            </button>
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1 rounded-lg text-[#a3a1c9] transition-colors hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
              title="Move module up"
            >
              <IconChevronUp size={17} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1 rounded-lg text-[#a3a1c9] transition-colors hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
              title="Move module down"
            >
              <IconChevronDown size={17} />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors px-2.5 py-1 rounded-md hover:bg-primary/12"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-danger/10"
              title="Delete module"
            >
              <IconTrash size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Module Content (expanded) */}
      {expanded && (
        <div className="border-t border-border/40 bg-card">
          {!hasContent ? (
            <div className="p-4 text-center" onClick={() => setExpanded(true)}>
              <p className="text-xs text-muted-foreground mb-3">
                No content yet. Add lessons, quizzes, or assignments below.
              </p>
              {/* Inline Add Content buttons for empty module */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  onClick={() => {
                    setShowAddLesson(true);
                    setAddLessonKey((k) => k + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300/60 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-indigo-400/70 hover:bg-indigo-100 hover:shadow"
                >
                  <IconVideo size={14} />
                  Add Lesson
                </button>
                <button
                  onClick={() => setShowAddQuiz(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-amber-400/70 hover:bg-amber-100 hover:shadow"
                >
                  <IconClipboardText size={14} />
                  Quiz
                </button>
                <button
                  onClick={() => setShowAddAssignment(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300/60 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-blue-400/70 hover:bg-blue-100 hover:shadow"
                >
                  <IconFileText size={14} />
                  Assignment
                </button>
                <button
                  onClick={() => setShowAddPractical(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/60 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-violet-400/70 hover:bg-violet-100 hover:shadow"
                >
                  <IconBrain size={14} />
                  Practical
                </button>
                <button
                  onClick={() => setShowStudyMaterialUpload(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-150 cursor-pointer hover:border-emerald-400/70 hover:bg-emerald-100 hover:shadow"
                >
                  <IconFile size={14} />
                  Study Material
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1">
              {unifiedItems.map((item, idx) => (
                <div key={`${item.type}-${item.data.id}`}>
                  {item.type === "LESSON" && (
                    <LessonCard
                      lesson={item.data}
                      index={idx}
                      onChanged={onChanged}
                      onMoveUp={() => handleMoveContent(idx, -1)}
                      onMoveDown={() => handleMoveContent(idx, 1)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < unifiedItems.length - 1}
                    />
                  )}
                  {item.type === "QUIZ" && (
                    <QuizCard
                      quiz={item.data}
                      onUpdate={onChanged}
                      onMoveUp={() => handleMoveContent(idx, -1)}
                      onMoveDown={() => handleMoveContent(idx, 1)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < unifiedItems.length - 1}
                    />
                  )}
                  {item.type === "ASSIGNMENT" && (
                    <AssignmentCard
                      assignment={item.data}
                      onUpdate={onChanged}
                      onMoveUp={() => handleMoveContent(idx, -1)}
                      onMoveDown={() => handleMoveContent(idx, 1)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < unifiedItems.length - 1}
                    />
                  )}
                  {item.type === "PRACTICAL" && (
                    <PracticalCard
                      practical={item.data}
                      index={idx}
                      courseId={courseId}
                      onUpdate={onChanged}
                      onMoveUp={() => handleMoveContent(idx, -1)}
                      onMoveDown={() => handleMoveContent(idx, 1)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < unifiedItems.length - 1}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Study Materials Section */}
          {mod.lessons.length > 0 && (
            <div className="px-3 py-2 border-t border-border/40">
              <div className="px-1 py-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600 mb-2 flex items-center justify-between">
                <span>Study Materials ({allResources.length})</span>
                <button
                  onClick={() => setShowStudyMaterialUpload(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
                >
                  + Upload
                </button>
              </div>

              {allResources.length > 0 ? (
                <div className="space-y-1">
                  {allResources.map((resource, rIdx) => (
                    <div
                      key={`${resource.lessonId}-${resource.id}`}
                      className="flex items-center gap-1.5 rounded-md border border-[#e4e2f5] bg-white px-2 py-1.5 text-xs transition-all duration-200 hover:border-[#cfcbe8] hover:bg-card/50"
                    >
                      <div className="flex shrink-0 flex-col">
                        <button
                          onClick={() => handleMoveResource(rIdx, -1)}
                          disabled={rIdx === 0}
                          className="rounded p-px text-[#a3a1c9] transition-colors hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
                          title="Move up"
                        >
                          <IconChevronUp size={11} />
                        </button>
                        <button
                          onClick={() => handleMoveResource(rIdx, 1)}
                          disabled={rIdx === allResources.length - 1}
                          className="rounded p-px text-[#a3a1c9] transition-colors hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
                          title="Move down"
                        >
                          <IconChevronDown size={11} />
                        </button>
                      </div>
                      <IconFile size={12} className="text-success shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-foreground">
                          {resource.originalName}
                        </p>
                        <p className="text-[10px] text-muted truncate">
                          {resource.lessonTitle}
                        </p>
                      </div>
                      <a
                        href={resource.url}
                        download
                        className="text-muted hover:text-foreground transition-colors p-1"
                      >
                        <IconDownload size={12} />
                      </a>
                      <button
                        onClick={() =>
                          handleDeleteResource(resource.lessonId, resource.id)
                        }
                        className="text-muted hover:text-danger transition-colors p-1"
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted text-center">
                  No study materials yet. Click &ldquo;Upload&rdquo; to add.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Forms - controlled by parent state */}
      <AddQuizForm
        moduleId={mod.id}
        open={showAddQuiz}
        onSuccess={() => {
          setShowAddQuiz(false);
          onChanged();
        }}
        onCancel={() => setShowAddQuiz(false)}
      />
      <AddAssignmentForm
        moduleId={mod.id}
        courseId={courseId}
        batchId=""
        open={showAddAssignment}
        onSuccess={() => {
          setShowAddAssignment(false);
          onChanged();
        }}
        onCancel={() => setShowAddAssignment(false)}
      />
      <AddPracticalForm
        moduleId={mod.id}
        courseId={courseId}
        open={showAddPractical}
        onSuccess={() => {
          setShowAddPractical(false);
          onChanged();
        }}
        onCancel={() => setShowAddPractical(false)}
      />
      <AddStudyMaterialForm
        courseId={courseId}
        lessons={mod.lessons}
        open={showStudyMaterialUpload}
        onSuccess={() => {
          setShowStudyMaterialUpload(false);
          onChanged();
        }}
        onCancel={() => setShowStudyMaterialUpload(false)}
      />

      {/* Add Lesson Modal */}
      <AddLessonForm
        key={addLessonKey}
        moduleId={mod.id}
        open={showAddLesson}
        onAdded={onChanged}
        onClose={() => setShowAddLesson(false)}
      />
    </div>
  );
}
