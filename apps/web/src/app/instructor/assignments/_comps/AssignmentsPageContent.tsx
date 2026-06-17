"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { IconPlus, IconUsers, IconCalendar, IconClipboardList } from "@tabler/icons-react";
import { toast } from "sonner";
import { AssignmentCreateForm } from "./AssignmentCreateForm";
import { SubmissionReviewPanel } from "./SubmissionReviewPanel";
import type { Batch, Assignment, StudentSubmission, FormQuestion } from "./types";

export function AssignmentsPageContent() {
  const searchParams = useSearchParams();
  const batchParam = searchParams.get("batch");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batchParam || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Submissions
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const batchesRes: any = await api.get("/api/instructor/batches");
      const assignmentsRes: any = await api.get("/api/instructor/assignments");
      setBatches(batchesRes.batches ?? batchesRes);
      setAssignments(assignmentsRes.assignments ?? assignmentsRes);
      if (!selectedBatchId && batchesRes.batches?.length > 0) {
        setSelectedBatchId(batchesRes.batches[0].id);
      }
    } catch {
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment) loadSubmissions(selectedAssignment.id);
  }, [selectedAssignment]);

  const loadSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res: any = await api.get(`/api/instructor/assignments/${assignmentId}/submissions`);
      setSubmissions(res.submissions ?? res);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateAssignment = async (data: {
    title: string;
    description: string;
    dueDate: string;
    type: "QUIZ" | "ASSIGNMENT";
    batchId: string;
    questionPdfUrl: string | null;
    maxPoints: number;
    formQuestions: FormQuestion[];
  }) => {
    try {
      await api.post("/api/instructor/assignments", data);
      toast.success("Assignment created successfully!");
      setActiveTab("list");
      loadInitialData();
    } catch {
      toast.error("Failed to create assignment.");
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: string, feedback: string) => {
    try {
      await api.put(`/api/instructor/submissions/${submissionId}`, { grade, feedback });
      toast.success("Evaluation saved!");
      if (selectedAssignment) loadSubmissions(selectedAssignment.id);
    } catch {
      toast.error("Failed to save evaluation.");
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted animate-pulse">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center border border-danger/20">
        <p className="text-danger font-semibold">{error}</p>
        <button onClick={loadInitialData} className="btn-primary text-xs mt-4">
          Retry
        </button>
      </div>
    );
  }

  const currentBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {currentBatch ? `${currentBatch.name} — ${currentBatch.course.title}` : "Manage quizzes and assignments"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batches.length > 0 && (
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedAssignment(null);
                setActiveTab("list");
              }}
              className="field py-1.5 text-xs max-w-[200px]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.course.title}
                </option>
              ))}
            </select>
          )}
          {!selectedAssignment && (
            <button
              onClick={() => {
                setActiveTab(activeTab === "create" ? "list" : "create");
                setSelectedAssignment(null);
              }}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <IconPlus size={14} />
              {activeTab === "create" ? "View All" : "Create Assignment"}
            </button>
          )}
        </div>
      </div>

      {/* Batch Info Row */}
      {currentBatch && (
        <div className="glass-card p-4 border border-border/80 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <IconUsers size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{currentBatch.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentBatch.course.title}</p>
          </div>
        </div>
      )}

      {/* Search (only in list view) */}
      {activeTab === "list" && !selectedAssignment && (
        <input
          type="text"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="field py-2 text-sm max-w-md"
        />
      )}

      {/* ==================== CREATE FORM ==================== */}
      {activeTab === "create" && (
        <AssignmentCreateForm
          selectedBatchId={selectedBatchId}
          batches={batches}
          onCancel={() => setActiveTab("list")}
          onSubmit={handleCreateAssignment}
        />
      )}

      {/* ==================== SUBMISSIONS REVIEW ==================== */}
      {activeTab !== "create" && selectedAssignment && (
        <SubmissionReviewPanel
          selectedAssignment={selectedAssignment}
          submissions={submissions}
          loadingSubmissions={loadingSubmissions}
          onBack={() => setSelectedAssignment(null)}
          onGrade={handleGradeSubmission}
        />
      )}

      {/* ==================== LIST VIEW ==================== */}
      {activeTab !== "create" && !selectedAssignment && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-border/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              All Assessments
            </h2>
            {filteredAssignments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground text-sm">
                <IconClipboardList size={36} className="mb-3 opacity-40" />
                <p>No assignments posted yet. Click &quot;+ Create Assignment&quot; to post one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="glass-card p-4 space-y-4 border border-border hover:border-violet-500/30 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                            {assignment.batch.name}
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            assignment.type === "QUIZ"
                              ? "text-accent bg-accent/10"
                              : "text-warning bg-warning/10"
                          }`}>
                            {assignment.type === "QUIZ" ? "Quiz" : "Assignment"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted flex items-center gap-1">
                          <IconCalendar size={11} />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground mt-2 truncate">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border/50">
                      <span>{assignment.type === "QUIZ" ? `${assignment._count?.questions || 0} Questions` : `${assignment.maxPoints} pts`}</span>
                      <span className="font-semibold text-foreground">
                        {assignment._count?.submissions || 0} Submissions
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="btn-secondary w-full justify-center text-xs py-1.5 border-violet-500/10 text-violet-400 hover:bg-violet-500/10"
                    >
                      View Submissions & Evaluate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
