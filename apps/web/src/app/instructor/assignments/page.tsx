"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
  IconClipboardList,
  IconUsers,
  IconClock,
  IconCheck,
  IconArrowLeft,
  IconFile,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconX,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCalendar,
  IconExternalLink,
  IconChevronRight,
  IconCircleCheck,
} from "@tabler/icons-react";

type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  type: "QUIZ" | "ASSIGNMENT";
  course: { title: string };
  batch: { name: string; passingScore: number } | null;
  _count: { submissions: number };
};

type Submission = {
  id: string;
  status: "PENDING" | "GRADED";
  grade: string | null;
  totalScore: number | null;
  feedback: string | null;
  comment: string | null;
  submittedAt: string;
  answerFileUrl: string | null;
  student: { id: string; name: string; email: string };
};

type SortKey = "dueDate" | "submissions" | "title";
type SortDir = "asc" | "desc";
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
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
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

export default function InstructorAssignmentsPage() {
  usePageTitle("Assignments");
  const queryClient = useQueryClient();

  // Shares the cache key with the instructor dashboard's ["instructor","assignments"].
  const assignmentsQuery = useApiQuery<{ items: Assignment[] }>(
    ["instructor", "assignments"],
    "/api/assignments",
  );
  const assignments = (assignmentsQuery.data?.items ?? []).filter(
    (a) => a.type === "ASSIGNMENT",
  );
  const loading = assignmentsQuery.isPending;

  // ---- Assignment list filters ----
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const courseOptions = useMemo(() => {
    const set = new Set(assignments.map((a) => a.course.title));
    return Array.from(set).sort();
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    let list = assignments.filter((a) => {
      const matchesSearch =
        search.trim() === "" ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.course.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.batch?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCourse =
        courseFilter === "ALL" || a.course.title === courseFilter;
      return matchesSearch && matchesCourse;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "dueDate") {
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortKey === "submissions") {
        cmp = a._count.submissions - b._count.submissions;
      } else if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [assignments, search, courseFilter, sortKey, sortDir]);

  const hasActiveFilters = search.trim() !== "" || courseFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setCourseFilter("ALL");
  };

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  // Dependent query: submissions for the currently selected assignment.
  const submissionsQuery = useQuery({
    queryKey: ["instructor", "submissions", selectedAssignment?.id ?? ""],
    queryFn: () =>
      api.get<{ items: Submission[] }>(
        `/api/assignments/${selectedAssignment!.id}/submissions`,
      ),
    enabled: Boolean(selectedAssignment),
  });
  const submissions = submissionsQuery.data?.items ?? [];
  const loadingSubmissions = submissionsQuery.isPending;

  // ---- Submission filters ----
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] =
    useState<SubmissionStatusFilter>("ALL");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        submissionSearch.trim() === "" ||
        s.student.name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.student.email.toLowerCase().includes(submissionSearch.toLowerCase());
      const matchesStatus =
        submissionStatusFilter === "ALL" || s.status === submissionStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, submissionSearch, submissionStatusFilter]);

  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

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
      if (selectedAssignment) {
        void queryClient.invalidateQueries({
          queryKey: ["instructor", "submissions", selectedAssignment.id],
        });
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionSearch("");
    setSubmissionStatusFilter("ALL");
  };

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

  // Overview stats for all assignments
  const totalAssignmentsCount = assignments.length;
  const totalSubmissionsSum = assignments.reduce(
    (acc, a) => acc + (a._count.submissions || 0),
    0,
  );

  // ─── SUBMISSION DETAIL VIEW ─────────────────────────────────────────────
  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 sm:p-6 rounded-lg border border-border shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)]">
          <div className="flex items-start gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedAssignment(null)}
              leftIcon={<IconArrowLeft size={16} />}
              className="mt-0.5 shrink-0"
            >
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">ASSIGNMENT</Badge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedAssignment.course.title}
                </span>
                {selectedAssignment.batch && (
                  <Badge variant="secondary">
                    {selectedAssignment.batch.name}
                  </Badge>
                )}
              </div>
              <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {selectedAssignment.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconCalendar size={14} className="text-muted" />
                  Due:{" "}
                  <strong className="text-foreground">
                    {new Date(selectedAssignment.dueDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </strong>
                </span>
                {selectedAssignment.batch?.passingScore != null && (
                  <>
                    <span className="text-border">•</span>
                    <span>
                      Passing Score:{" "}
                      <strong className="text-foreground">
                        {selectedAssignment.batch.passingScore}%
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
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

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <IconClock size={20} stroke={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-none text-amber-600">
                  {pendingCount}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Needs Grading
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <IconCheck size={20} stroke={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-none text-emerald-600">
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
        <Card>
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="w-full sm:max-w-md">
              <SearchInput
                value={submissionSearch}
                onChange={(val) => setSubmissionSearch(val)}
                placeholder="Search by student name or email..."
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-muted/15 p-1 rounded-lg border border-border">
              {(["ALL", "PENDING", "GRADED"] as SubmissionStatusFilter[]).map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() => setSubmissionStatusFilter(opt)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      submissionStatusFilter === opt
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
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
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
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
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
                  setSubmissionSearch("");
                  setSubmissionStatusFilter("ALL");
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
              <Card key={sub.id} hoverable>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold border border-primary/20">
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
                            View Attached File
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
                    Attached Work
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
                passingScore={selectedAssignment?.batch?.passingScore ?? 50}
              />
            </FormField>

            <FormField
              label="Constructive Feedback"
              description="Share notes or guidance with the student."
            >
              <Textarea
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Write feedback for the student..."
                rows={3}
              />
            </FormField>
          </FormModal>
        )}
      </div>
    );
  }

  // ─── MAIN ASSIGNMENTS LIST VIEW ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Assignments"
        breadcrumbs={[
          { label: "Assignments", href: "/instructor/assignments" },
        ]}
        role="Instructor"
        description="Review assignments across your courses and grade student submissions."
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <IconClipboardList size={20} stroke={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none text-foreground">
                {loading ? "—" : totalAssignmentsCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Assignments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <IconUsers size={20} stroke={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none text-emerald-600">
                {loading ? "—" : totalSubmissionsSum}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Submissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search by assignment title, course, or batch..."
              />
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by course"
              className="h-[42px] px-3.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all lg:w-56 shrink-0 shadow-2xs"
            >
              <option value="ALL">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconFilter size={14} />
              <span>
                Showing{" "}
                <strong className="text-foreground">
                  {filteredAssignments.length}
                </strong>{" "}
                of {assignments.length} assignments
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-primary hover:underline font-semibold ml-2 cursor-pointer"
                >
                  <IconX size={12} /> Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="instructor-sort-by"
                className="text-xs text-muted-foreground font-medium"
              >
                Sort by
              </label>
              <select
                id="instructor-sort-by"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
              >
                <option value="dueDate">Due Date</option>
                <option value="submissions">Submissions</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={toggleSortDir}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer"
                title={sortDir === "asc" ? "Ascending" : "Descending"}
                aria-label="Toggle sort direction"
              >
                {sortDir === "asc" ? (
                  <IconSortAscending size={16} />
                ) : (
                  <IconSortDescending size={16} />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
              <IconClipboardList size={28} />
            </div>
            <p className="text-base font-bold text-foreground">
              No assignments yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Assignments created for your courses will appear here.
            </p>
          </CardContent>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
              <IconFilter size={28} />
            </div>
            <p className="text-base font-bold text-foreground">
              No assignments match your filters
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or course filter.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="mt-4"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => {
            const isOverdue = new Date(a.dueDate) < new Date();

            return (
              <Card
                key={a.id}
                hoverable
                onClick={() => handleSelectAssignment(a)}
                className="cursor-pointer group transition-all hover:border-primary/40"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary border-primary/20 transition-transform group-hover:scale-105">
                      <IconFileSpreadsheet size={22} stroke={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground truncate">
                          {a.title}
                        </p>
                        <Badge variant="info">ASSIGNMENT</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {a.course.title}{" "}
                        {a.batch ? `· ${a.batch.name}` : "· All Batches"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 self-stretch sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border justify-between sm:justify-end">
                    <div className="text-left sm:text-right min-w-[80px]">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Submissions
                      </p>
                      <p className="text-lg font-extrabold text-foreground mt-0.5">
                        {a._count.submissions}
                      </p>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          isOverdue
                            ? "text-danger font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {new Date(a.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center text-muted-foreground/60 group-hover:text-primary transition-colors pl-2">
                      <IconChevronRight size={18} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
