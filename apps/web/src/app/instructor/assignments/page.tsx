"use client";

import { useState } from "react";
// Remove IconGraduationCap from import
import {
  IconClipboardList,
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconFileText,
  IconSchool,
  IconSend,
} from "@tabler/icons-react";

type Submission = {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  assignmentTitle: string;
  submittedAt: string;
  status: "PENDING" | "GRADED";
  submissionText: string;
  grade?: string;
  feedback?: string;
};

export default function InstructorAssignmentsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([
    // Start with an empty list; real submissions should come from the API
  ]);

  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          status: "GRADED",
          grade,
          feedback
        };
      }
      return s;
    }));

    setSelectedSub(null);
    setGrade("");
    setFeedback("");
    alert("Assignment graded and feedback sent to student successfully!");
  };

  const pending = submissions.filter(s => s.status === "PENDING");
  const graded = submissions.filter(s => s.status === "GRADED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Assignments & Grading</h1>
        <p className="mt-1 text-sm text-muted-foreground">Grade submissions and provide critical feedback to your students.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Submissions List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pending Submissions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-400 flex items-center gap-2">
              <IconAlertCircle size={15} /> Awaiting Review ({pending.length})
            </h2>

            {pending.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                All submissions reviewed! You are completely up to date.
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSub(s); setGrade(""); setFeedback(""); }}
                    className={`glass-card p-4 flex items-center justify-between border cursor-pointer transition-all duration-200 ${selectedSub?.id === s.id ? "border-violet-500 bg-violet-500/5" : "border-border/80 hover:border-violet-500/20"
                      }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.assignmentTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.courseTitle}</p>
                      <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                        <IconUser size={12} /> {s.studentName} ({s.studentEmail})
                      </p>
                    </div>
                    <button className="btn-secondary text-xs px-3 py-1.5">Review</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graded Submissions */}
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-400 flex items-center gap-2">
              <IconCheck size={15} /> Graded & Completed ({graded.length})
            </h2>

            <div className="space-y-2">
              {graded.map(s => (
                <div key={s.id} className="glass-card p-4 flex items-center justify-between border border-border/80 opacity-80 hover:opacity-100 transition-opacity">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.assignmentTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.courseTitle} · Student: {s.studentName}</p>
                    {s.feedback && <p className="text-xs italic text-muted mt-2">&quot;{s.feedback}&quot;</p>}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm font-bold text-emerald-400">
                    {s.grade}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grading Panel (Sidebar) */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2 mb-3">
            <IconSchool size={15} /> Grading Assistant
          </h2>

          {selectedSub ? (
            <form onSubmit={handleGrade} className="glass-card p-4 space-y-4 border border-violet-500/25 bg-gradient-to-b from-violet-500/5 to-card animate-in fade-in duration-200">
              <div>
                <h3 className="font-bold text-foreground truncate">{selectedSub.assignmentTitle}</h3>
                <p className="text-xs text-muted-foreground truncate">{selectedSub.studentName} · {selectedSub.studentEmail}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Student submission</label>
                <div className="bg-card/50 border border-border rounded-xl p-3 text-xs font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                  {selectedSub.submissionText}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Grade (A+, A, B, C, F)</label>
                <input
                  type="text"
                  className="field"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="e.g. A+"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Feedback</label>
                <textarea
                  className="field min-h-[80px]"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Write constructive advice here..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full justify-center text-xs py-2 bg-violet-600 hover:bg-violet-700">
                <IconSend size={14} /> Submit Grade & Feedback
              </button>
            </form>
          ) : (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground border border-border/80">
              <IconFileText className="mx-auto text-muted mb-2 animate-bounce" size={28} />
              Select a submission from the list to begin grading and providing feedback.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
