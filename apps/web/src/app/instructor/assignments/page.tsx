"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import {
  IconPlus,
  IconClipboardList,
  IconFilter,
  IconTrash,
} from "@tabler/icons-react";

import type {
  Assignment,
  InstructorBatch,
  InstructorCourse,
  AssignmentStatusFilter,
  SortKey,
  SortDir,
} from "./types";

import { AssignmentRow } from "./_components/AssignmentRow";
import { StatsStrip } from "./_components/StatsStrip";
import { AttentionStrip } from "./_components/AttentionStrip";
import { FilterToolbar } from "./_components/FilterToolbar";
import { CreateAssignmentModal } from "./_components/CreateAssignmentModal";
import { EditAssignmentModal } from "./_components/EditAssignmentModal";
import { AssignmentDetailsModal } from "./_components/AssignmentDetailsModal";
import { SubmissionReviewView } from "./_components/SubmissionReviewView";

// ── Shared empty-state block ────────────────────────────────────────────
// Both "no assignments yet" and "no results match filters" reuse this so
// the icon box, title, and copy line up identically in every state instead
// of drifting from hand-duplicated spacing values.
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
        {icon}
      </div>
      <p className="text-base font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default function InstructorAssignmentsPage() {
  usePageTitle("Assignments");
  const queryClient = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────
  const assignmentsQuery = useApiQuery<{ items: Assignment[] }>(
    ["instructor", "assignments"],
    "/api/assignments",
  );
  const assignments = useMemo(
    () =>
      (assignmentsQuery.data?.items ?? []).filter(
        (a) => a.type === "ASSIGNMENT",
      ),
    [assignmentsQuery.data?.items],
  );
  const loading = assignmentsQuery.isPending;

  const coursesQuery = useApiQuery<InstructorCourse[]>(
    ["instructor", "courses"],
    "/api/instructor/courses",
  );
  const instructorCourses = coursesQuery.data ?? [];

  const batchesQuery = useApiQuery<InstructorBatch[]>(
    ["instructor", "batches"],
    "/api/instructor/batches",
  );
  const instructorBatches = batchesQuery.data ?? [];

  // ── Modals & Views State ─────────────────────────────────────────────────
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [detailsAssignment, setDetailsAssignment] = useState<Assignment | null>(
    null,
  );
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Assignment List Filters & Sorting ────────────────────────────────────
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] =
    useState<AssignmentStatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Options for filter dropdowns
  const courseOptions = useMemo(() => {
    const set = new Set(assignments.map((a) => a.course.title));
    return Array.from(set).sort();
  }, [assignments]);

  const batchOptions = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.batch?.name) set.add(a.batch.name);
    });
    return Array.from(set).sort();
  }, [assignments]);

  // ── Aggregate Metrics ───────────────────────────────────────────────────
  const {
    totalAssignmentsCount,
    totalPendingReviewCount,
    totalReviewedCount,
    dueSoonCount,
    assignmentsWithPending,
  } = useMemo(() => {
    let pendingSum = 0;
    let reviewedSum = 0;
    let dueSoon = 0;
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const withPending: Array<{
      assignment: Assignment;
      pendingCount: number;
    }> = [];

    assignments.forEach((a) => {
      const pCount =
        a.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
      const gCount =
        a.submissions?.filter((s) => s.status === "GRADED").length ?? 0;

      pendingSum += pCount;
      reviewedSum += gCount;

      if (pCount > 0) {
        withPending.push({ assignment: a, pendingCount: pCount });
      }

      const due = new Date(a.dueDate);
      if (due >= now && due <= sevenDaysFromNow) {
        dueSoon += 1;
      }
    });

    withPending.sort((a, b) => b.pendingCount - a.pendingCount);

    return {
      totalAssignmentsCount: assignments.length,
      totalPendingReviewCount: pendingSum,
      totalReviewedCount: reviewedSum,
      dueSoonCount: dueSoon,
      assignmentsWithPending: withPending,
    };
  }, [assignments]);

  // ── Filtered & Sorted Assignments ────────────────────────────────────────
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(now.getDate() + 7);

    let list = assignments.filter((a) => {
      const matchesSearch =
        search.trim() === "" ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.course.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.batch?.name ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesCourse =
        courseFilter === "ALL" || a.course.title === courseFilter;

      const matchesBatch =
        batchFilter === "ALL" || (a.batch?.name ?? "") === batchFilter;

      let matchesStatus = true;
      const pCount =
        a.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
      const subTotal = a._count?.submissions ?? a.submissions?.length ?? 0;
      const dueDate = new Date(a.dueDate);

      if (statusFilter === "NEEDS_REVIEW") {
        matchesStatus = pCount > 0;
      } else if (statusFilter === "DUE_SOON") {
        matchesStatus = dueDate >= now && dueDate <= sevenDays;
      } else if (statusFilter === "OVERDUE") {
        matchesStatus = dueDate < now;
      } else if (statusFilter === "GRADED") {
        matchesStatus = subTotal > 0 && pCount === 0;
      }

      return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "dueDate") {
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortKey === "pending") {
        const pA =
          a.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
        const pB =
          b.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
        cmp = pA - pB;
      } else if (sortKey === "submissions") {
        const sA = a._count?.submissions ?? a.submissions?.length ?? 0;
        const sB = b._count?.submissions ?? b.submissions?.length ?? 0;
        cmp = sA - sB;
      } else if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    assignments,
    search,
    courseFilter,
    batchFilter,
    statusFilter,
    sortKey,
    sortDir,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    courseFilter !== "ALL" ||
    batchFilter !== "ALL" ||
    statusFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setCourseFilter("ALL");
    setBatchFilter("ALL");
    setStatusFilter("ALL");
  };

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  // ── Delete Mutation ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/assignments/${id}`),
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["instructor", "assignments"],
      });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleReviewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  // If instructor has selected an assignment to review its submissions
  if (selectedAssignment) {
    return (
      <SubmissionReviewView
        assignment={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
        onViewDetails={(a) => setDetailsAssignment(a)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Obvious "Create Assignment" CTA */}
      <AdminPageHeader
        title="Assignments"
        description="Manage assignments, track submissions, and grade student work."
        breadcrumbs={[
          { label: "Assignments", href: "/instructor/assignments" },
        ]}
        role="Instructor"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 cursor-pointer"
          >
            <IconPlus size={15} />
            Create Assignment
          </button>
        }
      />

      {/* 2. Top Actionable KPIs */}
      <StatsStrip
        totalAssignments={totalAssignmentsCount}
        pendingReviewCount={totalPendingReviewCount}
        reviewedCount={totalReviewedCount}
        dueSoonCount={dueSoonCount}
        loading={loading}
      />

      {/* 3. "NEEDS YOUR ATTENTION" Alert Section (prominent when pending > 0) */}
      <AttentionStrip
        assignmentsWithPending={assignmentsWithPending}
        totalPendingCount={totalPendingReviewCount}
        onReview={handleReviewAssignment}
      />

      {/* 4. Compressed Search & Multi-Filter Toolbar */}
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courseOptions={courseOptions}
        batchFilter={batchFilter}
        onBatchFilterChange={setBatchFilter}
        batchOptions={batchOptions}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        sortDir={sortDir}
        onToggleSortDir={toggleSortDir}
        totalCount={assignments.length}
        filteredCount={filteredAssignments.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* 5. Assignment Rows List */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading assignments">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 w-full animate-pulse rounded-2xl bg-muted/30"
            />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<IconClipboardList size={28} />}
          title="No assignments created yet"
          description="Create assignments for your batches to collect student submissions and grade their work."
          action={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 cursor-pointer"
            >
              <IconPlus size={15} />
              Create Your First Assignment
            </button>
          }
        />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<IconFilter size={28} />}
          title="No assignments match your filters"
          description="Try clearing or adjusting your search query, course, batch, or status filter."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted/30 cursor-pointer"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              onReview={handleReviewAssignment}
              onViewDetails={(assignment) => setDetailsAssignment(assignment)}
              onEdit={(assignment) => setEditAssignment(assignment)}
              onDelete={(assignment) => setDeleteTarget(assignment)}
            />
          ))}
        </div>
      )}

      {/* ── Create Assignment Modal ─────────────────────────────────────── */}
      <CreateAssignmentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courses={instructorCourses}
        batches={instructorBatches}
      />

      {/* ── Edit Assignment Modal ───────────────────────────────────────── */}
      <EditAssignmentModal
        open={Boolean(editAssignment)}
        onClose={() => setEditAssignment(null)}
        assignment={editAssignment}
      />

      {/* ── Assignment Details Modal ────────────────────────────────────── */}
      <AssignmentDetailsModal
        open={Boolean(detailsAssignment)}
        onClose={() => setDetailsAssignment(null)}
        assignment={detailsAssignment}
        onReview={handleReviewAssignment}
        onEdit={(assignment) => {
          setDetailsAssignment(null);
          setEditAssignment(assignment);
        }}
      />

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteTarget && (
        <ConfirmModal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Delete Assignment"
          description={`Are you sure you want to delete "${deleteTarget.title}"? Student submissions associated with this assignment will be archived.`}
          confirmLabel="Delete Assignment"
          variant="danger"
          icon={IconTrash}
          confirmLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
