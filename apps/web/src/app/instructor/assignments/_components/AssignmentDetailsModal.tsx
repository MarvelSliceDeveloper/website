"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  IconFile,
  IconExternalLink,
  IconCheck,
  IconEdit,
} from "@tabler/icons-react";
import type { Assignment } from "../types";

interface AssignmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onReview: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
}

export function AssignmentDetailsModal({
  open,
  onClose,
  assignment,
  onReview,
  onEdit,
}: AssignmentDetailsModalProps) {
  if (!assignment) return null;

  const totalSubmissions =
    assignment._count?.submissions ?? assignment.submissions?.length ?? 0;
  const pendingCount =
    assignment.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
  const gradedCount =
    assignment.submissions?.filter((s) => s.status === "GRADED").length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">ASSIGNMENT</Badge>
            <Badge variant="secondary">Published</Badge>
            <span className="text-xs text-muted-foreground font-semibold truncate">
              {assignment.course.title}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold mt-1">
            {assignment.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-start bg-muted/15 p-3.5 rounded-xl border border-border">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Batch
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {assignment.batch ? assignment.batch.name : "All Batches"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Due Date
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {new Date(assignment.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Max Points
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {assignment.maxPoints} pts
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Passing Score
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {assignment.batch?.passingScore ?? 50}%
              </p>
            </div>
          </div>

          {/* Submissions summary */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div>
                <span className="text-muted-foreground">Submissions:</span>{" "}
                <strong className="text-foreground">{totalSubmissions}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Pending Review:</span>{" "}
                <strong
                  className={
                    pendingCount > 0 ? "text-amber-600" : "text-foreground"
                  }
                >
                  {pendingCount}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Graded:</span>{" "}
                <strong className="text-emerald-600">{gradedCount}</strong>
              </div>
            </div>
          </div>

          {/* Attached Question PDF */}
          {assignment.questionPdfUrl && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconFile size={18} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    Question Paper PDF Attached
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Click to view or download document
                  </p>
                </div>
              </div>
              <a
                href={assignment.questionPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline bg-card px-3 py-1.5 rounded-md border border-border shadow-2xs shrink-0"
              >
                Open PDF <IconExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Instructions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Instructions / Description
            </h4>
            <div className="rounded-xl border border-border bg-muted/10 p-4 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {assignment.description || "No instructions provided."}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(assignment);
            }}
            leftIcon={<IconEdit size={15} />}
          >
            Edit Assignment
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onReview(assignment);
              }}
              rightIcon={<IconCheck size={15} />}
            >
              Review Submissions ({totalSubmissions})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
