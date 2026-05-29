"use client";

import { IconAlertCircle, IconCheck, IconClock } from "@tabler/icons-react";
import type { OverdueAssignment } from "@/lib/student-mock-data";

interface AssignmentOverdueViewProps {
  assignments: OverdueAssignment[];
  onGoBack: () => void;
}

export default function AssignmentOverdueView({
  assignments,
  onGoBack,
}: AssignmentOverdueViewProps) {
  const overdueItems = assignments.filter((a) => a.status === "PENDING");
  const completedItems = assignments.filter((a) => a.status === "SUBMITTED");

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Tasks</p>
        <h1 className="text-2xl font-bold text-foreground">Assignment Overdue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your pending assignments to stay on track.
        </p>
      </div>

      {/* Overdue Section */}
      {overdueItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconAlertCircle size={20} className="text-danger" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending ({overdueItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdueItems.map((assignment) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(assignment.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={assignment.id}
                  className="glass-card flex flex-col gap-4 border-danger/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/10">
                      <span className="text-lg">📝</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {assignment.assignmentName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {assignment.courseName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <IconClock size={14} className="text-danger" />
                        <span className="text-xs font-medium text-danger">
                          {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary flex-shrink-0 text-sm sm:w-auto">
                    Submit Now →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completedItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconCheck size={20} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Completed ({completedItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completedItems.map((assignment) => (
              <div
                key={assignment.id}
                className="glass-card flex items-center justify-between border-success/20 p-4"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
                    <IconCheck size={18} className="text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {assignment.assignmentName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {assignment.courseName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {overdueItems.length === 0 && completedItems.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-3 font-semibold text-foreground">No overdue assignments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re all caught up! Keep up the great work.
          </p>
        </div>
      )}
    </div>
  );
}
