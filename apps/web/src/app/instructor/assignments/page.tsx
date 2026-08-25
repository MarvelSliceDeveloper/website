"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconClipboardList,
  IconUsers,
  IconClock,
  IconCheck,
  IconArrowLeft,
  IconFile,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconX,
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

type TypeFilter = "ALL" | "QUIZ" | "ASSIGNMENT";
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
  if (finalScore >= passingScore) return null;
  return (
    <p className="text-xs text-warning font-medium mt-1 flex items-center gap-1">
      Score {finalScore}/{passingScore} — student will need to resubmit
    </p>
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
  const assignments = assignmentsQuery.data?.items ?? [];
  const loading = assignmentsQuery.isPending;

  // ---- Assignment list filters ----
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
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
      const matchesType = typeFilter === "ALL" || a.type === typeFilter;
      const matchesCourse =
        courseFilter === "ALL" || a.course.title === courseFilter;
      return matchesSearch && matchesType && matchesCourse;
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
  }, [assignments, search, typeFilter, courseFilter, sortKey, sortDir]);

  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "ALL" || courseFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
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

  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAssignment(null)}
            className="p-2 rounded-lg hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Grading
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {selectedAssignment.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedAssignment.course.title} ·{" "}
              {selectedAssignment.batch?.name ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-warning mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Graded
            </p>
            <p className="text-2xl font-bold text-success mt-1">
              {gradedCount}
            </p>
          </div>
        </div>

        {/* Submission filters */}
        <div className="border border-border bg-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="field pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(["ALL", "PENDING", "GRADED"] as SubmissionStatusFilter[]).map(
              (opt) => (
                <button
                  key={opt}
                  onClick={() => setSubmissionStatusFilter(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    submissionStatusFilter === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-hover text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt === "ALL"
                    ? "All"
                    : opt === "PENDING"
                      ? "Pending"
                      : "Graded"}
                </button>
              ),
            )}
          </div>
        </div>

        {loadingSubmissions ? (
          <div className="border border-border bg-card p-12 text-center">
            <p className="text-muted animate-pulse">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <IconUsers size={40} className="mx-auto text-muted/40 mb-3" />
            <p className="font-semibold text-foreground">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students haven&apos;t submitted their work yet.
            </p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <IconFilter size={40} className="mx-auto text-muted/40 mb-3" />
            <p className="font-semibold text-foreground">
              No submissions match your filters
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or status filter.
            </p>
            <button
              onClick={() => {
                setSubmissionSearch("");
                setSubmissionStatusFilter("ALL");
              }}
              className="btn-secondary text-xs mt-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => (
              <div key={sub.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary text-sm font-bold">
                        {sub.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {sub.student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconClock size={12} />
                        Submitted:{" "}
                        {new Date(sub.submittedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {sub.answerFileUrl && (
                        <a
                          href={sub.answerFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <IconFile size={12} />
                          View File
                        </a>
                      )}
                    </div>
                    {sub.comment && (
                      <div className="mt-3 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                          Student Note
                        </p>
                        <div
                          className="prose prose-xs max-w-none text-foreground/80 [&_p]:my-0.5"
                          dangerouslySetInnerHTML={{ __html: sub.comment }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {sub.status === "GRADED" ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                          <IconCheck size={12} /> Graded
                        </span>
                        <p className="text-sm font-bold text-foreground mt-1">
                          {sub.totalScore ?? sub.grade}
                          <span className="text-xs font-normal text-muted-foreground">
                            /100
                          </span>
                        </p>
                        {sub.feedback && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                            {sub.feedback}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setGradeModal(sub);
                          setGradeInput("");
                          setFeedbackInput("");
                        }}
                        className="btn-primary text-xs"
                      >
                        Grade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {gradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border bg-card p-4">
                <div>
                  <h3 className="font-bold text-foreground">
                    Grade Submission
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gradeModal.student.name} · {gradeModal.student.email}
                  </p>
                </div>
                <button
                  onClick={() => setGradeModal(null)}
                  className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-4">
                {gradeModal.answerFileUrl && (
                  <div className="p-3 bg-card-hover rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Submitted File
                    </p>
                    <a
                      href={gradeModal.answerFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <IconFile size={16} />
                      View Submission
                    </a>
                  </div>
                )}

                {gradeModal.comment && (
                  <div className="rounded-lg bg-muted/20 border border-border/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Student Note
                    </p>
                    <div
                      className="text-sm text-foreground/80 prose prose-xs max-w-none [&_p]:my-0.5"
                      dangerouslySetInnerHTML={{ __html: gradeModal.comment }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    className="field"
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    className="field min-h-[80px] resize-y"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Add feedback for the student..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGradeModal(null)}
                    className="btn-secondary text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrade}
                    disabled={gradeMutation.isPending || !gradeInput.trim()}
                    className="btn-primary text-xs px-4"
                  >
                    {gradeMutation.isPending ? "Submitting..." : "Submit Grade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Assignments"
        breadcrumbs={[
          { label: "Assignments", href: "/instructor/assignments" },
        ]}
        role="Instructor"
        description="View quizzes and assignments for your courses. Click to grade submissions."
      />

      {/* Filter bar */}
      <div className="border border-border bg-card p-3 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, course, or batch..."
              className="field pl-10 w-full"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="field sm:w-48 shrink-0"
          >
            <option value="ALL">All Courses</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 shrink-0">
            {(["ALL", "ASSIGNMENT", "QUIZ"] as TypeFilter[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setTypeFilter(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === opt
                    ? "bg-primary text-primary-foreground"
                    : "bg-card-hover text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt === "ALL"
                  ? "All"
                  : opt === "ASSIGNMENT"
                    ? "Assignments"
                    : "Quizzes"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconFilter size={14} />
            <span>
              Showing {filteredAssignments.length} of {assignments.length}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-primary hover:underline ml-1"
              >
                <IconX size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Sort by</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="field py-1.5 text-xs"
            >
              <option value="dueDate">Due Date</option>
              <option value="submissions">Submissions</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={toggleSortDir}
              className="p-1.5 rounded-lg bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? (
                <IconSortAscending size={16} />
              ) : (
                <IconSortDescending size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border border-border bg-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <IconClipboardList size={40} className="mx-auto text-muted/40 mb-3" />
          <p className="font-semibold text-foreground">No assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Assignments created for your courses will appear here.
          </p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <IconFilter size={40} className="mx-auto text-muted/40 mb-3" />
          <p className="font-semibold text-foreground">
            No assignments match your filters
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search, course, or type filter.
          </p>
          <button onClick={clearFilters} className="btn-secondary text-xs mt-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectAssignment(a)}
              className="w-full border border-border bg-card p-4 flex items-center justify-between hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <IconClipboardList size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.course.title} · {a.batch?.name ?? "—"} · {a.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Submissions</p>
                  <p className="text-lg font-bold text-foreground">
                    {a._count.submissions}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-xs font-medium text-foreground">
                    {new Date(a.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
