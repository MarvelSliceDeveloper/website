"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconGripVertical,
  IconDeviceFloppy,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import type { Module } from "./types";
import LessonCard from "./LessonCard";
import AddLessonForm from "./AddLessonForm";
import QuizCard from "./QuizCard";
import AddQuizForm from "./AddQuizForm";
import AssignmentCard from "./AssignmentCard";
import AddAssignmentForm from "./AddAssignmentForm";

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
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

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
              {mod.quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} onUpdate={onChanged} />
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
