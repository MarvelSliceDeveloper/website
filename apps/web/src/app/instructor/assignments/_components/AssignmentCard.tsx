"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  IconFileSpreadsheet,
  IconClock,
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconFile,
  IconExternalLink,
  IconEye,
  IconArrowRight,
} from "@tabler/icons-react";
import type { Assignment } from "../types";

interface AssignmentCardProps {
  assignment: Assignment;
  onReview: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

export function AssignmentCard({
  assignment,
  onReview,
  onViewDetails,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Submissions stats
  const totalSubmissions =
    assignment._count?.submissions ?? assignment.submissions?.length ?? 0;
  const pendingCount =
    assignment.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
  const gradedCount =
    assignment.submissions?.filter((s) => s.status === "GRADED").length ?? 0;

  // Enrolled count if available
  const totalEnrolled =
    assignment.batch?._count?.enrollments ??
    (totalSubmissions > 0 ? totalSubmissions : 0);

  const submissionPercentage =
    totalEnrolled > 0
      ? Math.min(100, Math.round((totalSubmissions / totalEnrolled) * 100))
      : totalSubmissions > 0
        ? 100
        : 0;

  // Dynamic due date calculation
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffMs < 0;

  let dueBadgeVariant: "danger" | "warning" | "info" | "neutral" = "neutral";
  let dueBadgeText = "";

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    dueBadgeVariant = "danger";
    dueBadgeText =
      overdueDays === 0 ? "OVERDUE TODAY" : `OVERDUE · ${overdueDays}d ago`;
  } else if (diffDays === 0) {
    dueBadgeVariant = "warning";
    dueBadgeText = "DUE TODAY";
  } else if (diffDays === 1) {
    dueBadgeVariant = "warning";
    dueBadgeText = "DUE TOMORROW";
  } else if (diffDays <= 7) {
    dueBadgeVariant = "info";
    dueBadgeText = `DUE IN ${diffDays} DAYS`;
  } else {
    dueBadgeVariant = "neutral";
    dueBadgeText = `DUE IN ${diffDays} DAYS`;
  }

  const formattedDueDate = dueDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="border border-border/80 shadow-2xs hover:border-primary/40 transition-all group overflow-visible">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Top Row: Icon + Title & Badges + Action Menu */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary border-primary/20 transition-transform group-hover:scale-105">
                <IconFileSpreadsheet size={22} stroke={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={() => onViewDetails(assignment)}
                    className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                  >
                    {assignment.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold"
                  >
                    Published
                  </Badge>
                  <Badge variant="info" className="text-[10px] font-semibold">
                    Assignment
                  </Badge>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {pendingCount} to review
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1 truncate">
                  <span className="font-semibold text-foreground/80">
                    {assignment.course.title}
                  </span>
                  {" · "}
                  <span>
                    {assignment.batch ? assignment.batch.name : "All Batches"}
                  </span>
                </p>
              </div>
            </div>

            {/* Context Menu ⋮ */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label="More options"
              >
                <IconDotsVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in-50 zoom-in-95">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onViewDetails(assignment);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <IconEye size={15} className="text-muted-foreground" />
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onReview(assignment);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <IconCheck size={15} className="text-primary" />
                    Review Submissions
                  </button>

                  {assignment.questionPdfUrl && (
                    <a
                      href={assignment.questionPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <IconFile size={15} className="text-blue-500" />
                      View Question PDF
                      <IconExternalLink
                        size={12}
                        className="ml-auto text-muted-foreground"
                      />
                    </a>
                  )}

                  <div className="my-1 border-t border-border" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(assignment);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <IconEdit size={15} className="text-muted-foreground" />
                    Edit Assignment
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(assignment);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <IconTrash size={15} />
                    Delete Assignment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Middle Row: Progress Bar & Detailed Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-center pt-3 border-t border-border/50">
            {/* 1. Submissions Progress Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  Submissions
                </span>
                <span className="font-bold text-foreground">
                  {totalEnrolled > 0 ? (
                    <>
                      {totalSubmissions} / {totalEnrolled}
                    </>
                  ) : (
                    <>{totalSubmissions} submitted</>
                  )}
                  {totalEnrolled > 0 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({submissionPercentage}%)
                    </span>
                  )}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all ${
                    submissionPercentage >= 80
                      ? "bg-emerald-500"
                      : submissionPercentage >= 40
                        ? "bg-primary"
                        : totalSubmissions > 0
                          ? "bg-blue-400"
                          : "bg-muted"
                  }`}
                  style={{ width: `${Math.max(4, submissionPercentage)}%` }}
                />
              </div>
            </div>

            {/* 2. Pending Grading Status */}
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  pendingCount > 0
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-muted/20 text-muted-foreground border-border/40"
                }`}
              >
                <IconClock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  Evaluation
                </p>
                <p className="text-xs font-bold text-foreground">
                  {pendingCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      {pendingCount} pending review
                    </span>
                  ) : gradedCount > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      All {gradedCount} graded
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0 pending</span>
                  )}
                </p>
              </div>
            </div>

            {/* 3. Due Date & Dynamic Relative State */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <div className="flex flex-col justify-center text-left sm:text-right sm:items-end">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                      dueBadgeVariant === "danger"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                        : dueBadgeVariant === "warning"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          : dueBadgeVariant === "info"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dueBadgeText}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due:{" "}
                  <span className="font-semibold text-foreground">
                    {formattedDueDate}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(assignment)}
              leftIcon={<IconEye size={15} />}
              className="text-xs"
            >
              View Assignment
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant={pendingCount > 0 ? "primary" : "secondary"}
                size="sm"
                onClick={() => onReview(assignment)}
                rightIcon={<IconArrowRight size={14} />}
                className="text-xs font-semibold"
              >
                {pendingCount > 0 ? (
                  <>Review ({pendingCount})</>
                ) : (
                  "Review Submissions"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
