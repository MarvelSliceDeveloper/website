"use client";

import { IconFileSpreadsheet } from "@tabler/icons-react";

interface Assignment {
  id: string;
  title: string;
  type: string;
  dueDate: string;
}

interface AssignmentContentProps {
  assignment: Assignment;
  moduleName: string | null;
  onBack: () => void;
}

export default function AssignmentContent({
  assignment,
  moduleName,
  onBack,
}: AssignmentContentProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <IconFileSpreadsheet size={18} className="text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Assignment
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground mt-1">
          {assignment.title}
        </h2>
        {moduleName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Module: {moduleName}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>
            📅 Due:{" "}
            {new Date(assignment.dueDate).toLocaleDateString("en-IN")}
          </span>
          <span>📋 Type: {assignment.type}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
        <IconFileSpreadsheet size={40} className="text-blue-500/60" />
        <p className="text-sm text-muted-foreground max-w-md">
          Submit your assignment from the{" "}
          <button
            onClick={() => {
              /* Navigate to assignments overdue view - handled by parent */
            }}
            className="text-primary font-medium hover:underline"
          >
            Assignments
          </button>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
