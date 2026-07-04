"use client";

import { useMemo, useState } from "react";
import PaginationBar from "./PaginationBar";
import StudentTable, { type StudentTableColumn } from "./StudentTable";

export type AssignmentStatus = "PENDING" | "SUBMITTED";

export interface OverdueAssignmentItem {
  id: string;
  courseName: string;
  unitName: string;
  assignmentName: string;
  dueDate: string;
  status: AssignmentStatus;
}

interface OverdueAssignmentsPanelProps {
  title?: string;
  items: OverdueAssignmentItem[];
  onView?: (assignmentId: string) => void;
}

const PAGE_SIZE = 5;

// Panel showing overdue assignments with filter and pagination
export default function OverdueAssignmentsPanel({
  title = "Assignment Overdue",
  items,
  onView,
}: OverdueAssignmentsPanelProps) {
  const [filter, setFilter] = useState<AssignmentStatus>("PENDING");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => items.filter((item) => item.status === filter),
    [items, filter],
  );

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const columns: StudentTableColumn<OverdueAssignmentItem>[] = [
    {
      key: "course",
      header: "Course Name",
      render: (row) => (
        <span className="font-medium text-foreground">{row.courseName}</span>
      ),
    },
    {
      key: "unit",
      header: "Unit Name",
      render: (row) => row.unitName,
    },
    {
      key: "assignment",
      header: "Assignment Name",
      render: (row) => row.assignmentName,
    },
    {
      key: "due",
      header: "Expired Date",
      render: (row) => new Date(row.dueDate).toLocaleDateString("en-IN"),
    },
    {
      key: "action",
      header: "Submit",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => onView?.(row.id)}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">
          {filtered.length} {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilter("PENDING");
              setPage(1);
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              filter === "PENDING"
                ? "border-primary/30 bg-primary/20 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            View Pending Assignments
          </button>
          <button
            onClick={() => {
              setFilter("SUBMITTED");
              setPage(1);
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              filter === "SUBMITTED"
                ? "border-primary/30 bg-primary/20 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            View Submitted Assignments
          </button>
        </div>
      </div>

      <StudentTable
        columns={columns}
        rows={paged}
        rowKey={(row) => row.id}
        emptyText={`No ${filter.toLowerCase()} overdue assignments.`}
      />

      <PaginationBar
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={(next) => setPage(Math.max(1, next))}
      />
    </section>
  );
}
