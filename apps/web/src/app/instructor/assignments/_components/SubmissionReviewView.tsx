"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { FormModal } from "@/components/admin/FormModal";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconUsers,
  IconClock,
  IconCheck,
  IconArrowLeft,
  IconFile,
  IconFilter,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCalendar,
  IconExternalLink,
  IconCircleCheck,
  IconEye,
} from "@tabler/icons-react";
import type { Assignment, Submission } from "../types";

type SubmissionStatusFilter = "ALL" | "PENDING" | "GRADED";

function PassFailPreview({
  gradeInput,
  passingScore,
}: {
  gradeInput: string;
  passingScore: number;
}) {
  if (!gradeInput || isNaN(parseInt(gradeInput, 10))) return null;
  const finalScore = parseInt(gradeInput, 10);
  const isPassing = finalScore >= passingScore;

  return (
    <div
      className={`mt-2 flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold border ${
        isPassing
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      }`}
    >
      {isPassing ? (
        <>
          <IconCircleCheck size={16} className="shrink-0" />
          <span>
            Passing grade ({finalScore}/{passingScore} minimum required)
          </span>
        </>
      ) : (
        <>
          <IconAlertCircle size={16} className="shrink-0" />
          <span>
            Below passing score ({finalScore}/{passingScore}) — student will
            need to resubmit
          </span>
        </>
      )}
    </div>
  );
}

interface SubmissionReviewViewProps {
  assignment: Assignment;
  onBack: () => void;
  onViewDetails: (assignment: Assignment) => void;
}

export function SubmissionReviewView({
  assignment,
  onBack,
  onViewDetails,
}: SubmissionReviewViewProps) {
  const queryClient = useQueryClient();

  const submissionsQuery = useQuery({
    queryKey: ["instructor", "submissions", assignment.id],
    queryFn: () =>
      api.get<{ items: Submission[] }>(
        `/api/assignments/${assignment.id}/submissions`,
      ),
  });

  const submissions = submissionsQuery.data?.items ?? [];
  const loadingSubmissions = submissionsQuery.isPending;

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SubmissionStatusFilter>("ALL");

  // Grade Modal state
  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        search.trim() === "" ||
        s.student.name.toLowerCase().includes(search.toLowerCase()) ||
        s.student.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: { grade: number; feedback?: string };
    }) =>
      api.post(`/api/assignments/submissions/${submissionId}/grade`, payload),
    onSuccess: () => {
      toast.success("Submission graded successfully");
      setGradeModal(null);
      setGradeInput("");
      setFeedbackInput("");
      void queryClient.invalidateQueries({
        queryKey: ["instructor", "submissions", assignment.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["instructor", "assignments"],
      });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleGrade = () => {
    if (!gradeModal) return;
    const score = parseInt(gradeInput, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }
    gradeMutation.mutate({
      submissionId: gradeModal.id,
      payload: { grade: score, feedback: feedbackInput || undefined },
    });
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 sm:p-6 rounded-xl border border-border/80 shadow-2xs">
        <div className="flex items-start gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            leftIcon={<IconArrowLeft size={16} />}
            className="mt-0.5 shrink-0"
          >
            Back to Assignments
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">ASSIGNMENT</Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {assignment.course.title}
              </span>
              {assignment.batch && (
                <Badge variant="secondary">{assignment.batch.name}</Badge>
              )}
            </div>
            <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {assignment.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IconCalendar size={14} className="text-muted" />
                Due:{" "}
                <strong className="text-foreground">
                  {new Date(assignment.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
              {assignment.batch?.passingScore != null && (
                <>
                  <span className="text-border">•</span>
                  <span>
                    Passing Score:{" "}
                    <strong className="text-foreground">
                      {assignment.batch.passingScore}%
                    </strong>
                  </span>
                </>
              )}
              {assignment.questionPdfUrl && (
                <>
                  <span className="text-border">•</span>
                  <a
                    href={assignment.questionPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <IconFile size={13} /> View Question PDF{" "}
                    <IconExternalLink size={11} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(assignment)}
            leftIcon={<IconEye size={15} />}
          >
            Assignment Details
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <IconUsers size={20} stroke={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none text-foreground">
                {submissions.length}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Submissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border shadow-2xs ${
            pendingCount > 0
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-border/80"
          }`}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                pendingCount > 0
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-muted/20 text-muted-foreground border-border/40"
              }`}
            >
              <IconClock size={20} stroke={1.8} />
            </div>
            <div className="min-w-0">
              <p
                className={`text-2xl font-extrabold leading-none ${
                  pendingCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {pendingCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Needs Grading
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <IconCheck size={20} stroke={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">
                {gradedCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Graded Submissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Filter Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Search by student name or email..."
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-muted/15 p-1 rounded-lg border border-border">
            {(["ALL", "PENDING", "GRADED"] as SubmissionStatusFilter[]).map(
              (opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === opt
                      ? "bg-primary text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  {opt === "ALL"
                    ? `All (${submissions.length})`
                    : opt === "PENDING"
                      ? `Pending (${pendingCount})`
                      : `Graded (${gradedCount})`}
                </button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {loadingSubmissions ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card className="border border-border/80">
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/20 text-muted-foreground">
              <IconUsers size={28} />
            </div>
            <p className="text-base font-bold text-foreground">
              No submissions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Students enrolled in this course have not submitted their work
              yet.
            </p>
          </CardContent>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="border border-border/80">
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/20 text-muted-foreground">
              <IconFilter size={28} />
            </div>
            <p className="text-base font-bold text-foreground">
              No submissions match your filters
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try clearing your search or status filter.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="border border-border/80 shadow-2xs hover:border-primary/30 transition-all"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                        {sub.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {sub.student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.student.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <IconClock size={14} className="text-muted" />
                        Submitted:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(sub.submittedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      {sub.answerFileUrl && (
                        <a
                          href={sub.answerFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-md border border-primary/15"
                        >
                          <IconFile size={14} />
                          View Attached Student File
                          <IconExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {sub.comment && (
                      <div className="mt-3 text-xs text-muted-foreground bg-muted/10 rounded-lg p-3.5 border border-border">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mb-1">
                          Student Note
                        </p>
                        <div
                          className="prose prose-xs max-w-none text-foreground/90 [&_p]:my-0.5"
                          dangerouslySetInnerHTML={{ __html: sub.comment }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    {sub.status === "GRADED" ? (
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Badge variant="success" dot>
                            Graded
                          </Badge>
                        </div>
                        <p className="text-lg font-extrabold text-foreground mt-1.5">
                          {sub.totalScore ?? sub.grade}
                          <span className="text-xs font-normal text-muted-foreground">
                            /100
                          </span>
                        </p>
                        {sub.feedback && (
                          <p
                            className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate"
                            title={sub.feedback}
                          >
                            Feedback: {sub.feedback}
                          </p>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setGradeModal(sub);
                            setGradeInput(
                              String(sub.totalScore ?? sub.grade ?? ""),
                            );
                            setFeedbackInput(sub.feedback || "");
                          }}
                          className="mt-2 text-xs w-full sm:w-auto"
                        >
                          Edit Grade
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setGradeModal(sub);
                          setGradeInput("");
                          setFeedbackInput("");
                        }}
                        className="w-full sm:w-auto"
                      >
                        Grade Submission
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradeModal && (
        <FormModal
          open
          onClose={() => setGradeModal(null)}
          title="Grade Submission"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setGradeModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGrade}
                loading={gradeMutation.isPending}
                disabled={!gradeInput.trim()}
              >
                Submit Grade
              </Button>
            </>
          }
        >
          <div>
            <div className="rounded-lg bg-muted/15 border border-border px-3.5 py-2.5 text-xs text-muted-foreground">
              Grading work by{" "}
              <span className="font-semibold text-foreground">
                {gradeModal.student.name}
              </span>{" "}
              ({gradeModal.student.email})
            </div>
          </div>
          {gradeModal.answerFileUrl && (
            <div className="p-3 bg-muted/15 border border-border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <IconFile size={16} className="text-primary" />
                <span className="font-semibold text-foreground">
                  Attached Student Work
                </span>
              </div>
              <a
                href={gradeModal.answerFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Open File <IconExternalLink size={12} />
              </a>
            </div>
          )}

          {gradeModal.comment && (
            <div className="rounded-lg bg-muted/15 border border-border p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Student Note
              </p>
              <div
                className="text-xs text-foreground/80 prose prose-xs max-w-none [&_p]:my-0.5"
                dangerouslySetInnerHTML={{ __html: gradeModal.comment }}
              />
            </div>
          )}

          <FormField label="Score (0 - 100)" required>
            <Input
              type="number"
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              placeholder="e.g. 85"
              min={0}
              max={100}
              required
            />
            <PassFailPreview
              gradeInput={gradeInput}
              passingScore={assignment.batch?.passingScore ?? 50}
            />
          </FormField>

          <FormField
            label="Constructive Feedback"
            description="Share notes or guidance with the student."
          >
            <Textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Write constructive feedback for the student..."
              rows={3}
            />
          </FormField>
        </FormModal>
      )}
    </div>
  );
}
