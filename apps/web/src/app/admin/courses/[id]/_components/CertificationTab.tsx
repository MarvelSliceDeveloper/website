"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/toast";
import {
  IconAward,
  IconClock,
  IconCheck,
  IconLoader2,
  IconSettings,
} from "@tabler/icons-react";

interface CertificationData {
  module: { id: string; title: string } | null;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMin: number | null;
    hasMcq: boolean;
    hasAssignment: boolean;
    assignmentInstructions: string | null;
    questionCount: number;
  } | null;
}

interface CertificationTabProps {
  courseId: string;
}

export default function CertificationTab({ courseId }: CertificationTabProps) {
  const [data, setData] = useState<CertificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("Certification Exam");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimitMin, setTimeLimitMin] = useState("");
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentInstructions, setAssignmentInstructions] = useState("");

  const fetchData = async () => {
    try {
      const result = await api.get<CertificationData>(
        `/api/admin/courses/${courseId}/certification`,
      );
      setData(result);
      if (result.quiz) {
        setTitle(result.module?.title ?? "Certification Exam");
        setPassingScore(result.quiz.passingScore);
        setTimeLimitMin(result.quiz.timeLimitMin?.toString() ?? "");
        setHasAssignment(result.quiz.hasAssignment);
        setAssignmentInstructions(result.quiz.assignmentInstructions ?? "");
      }
    } catch {
      toast.error("Failed to load certification data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/courses/${courseId}/certification`, {
        title,
        passingScore,
        timeLimitMin: timeLimitMin ? parseInt(timeLimitMin) : null,
        hasAssignment,
        assignmentInstructions: assignmentInstructions || null,
      });
      toast.success("Certification settings saved");
      fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!data?.module) {
    return (
      <div className="glass-card p-8 text-center">
        <IconAward className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Certification Exam
        </h3>
        <p className="text-sm text-muted mb-6 max-w-md mx-auto">
          Enable a certification exam for this course. Students must pass this
          exam (with 60% or higher) to receive their certificate.
        </p>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await api.put(`/api/admin/courses/${courseId}/certification`, {
                title: "Certification Exam",
                passingScore: 60,
              });
              toast.success("Certification exam enabled");
              fetchData();
            } catch (err: unknown) {
              toast.error(getErrorMessage(err));
            } finally {
              setSaving(false);
            }
          }}
          className="btn-primary inline-flex items-center gap-2"
          disabled={saving}
        >
          <IconAward className="h-4 w-4" />
          Enable Certification Exam
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <IconAward className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Certification Exam Settings
            </h3>
            <p className="text-xs text-muted">
              Configure the final certification exam for this course
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field">
            <label className="label">Exam Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-500" />
                Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 60)}
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Students must score at least {passingScore}% to pass
              </p>
            </div>

            <div className="field">
              <label className="label flex items-center gap-2">
                <IconClock className="h-4 w-4 text-blue-500" />
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={timeLimitMin}
                onChange={(e) => setTimeLimitMin(e.target.value)}
                className="input"
                placeholder="No limit"
              />
              <p className="text-xs text-muted mt-1">
                Leave empty for no time limit
              </p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAssignment}
                onChange={(e) => setHasAssignment(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Include Assignment Section
                </span>
                <p className="text-xs text-muted">
                  Allow students to submit a file assignment as part of the exam
                </p>
              </div>
            </label>
          </div>

          {hasAssignment && (
            <div className="field">
              <label className="label">Assignment Instructions</label>
              <textarea
                value={assignmentInstructions}
                onChange={(e) => setAssignmentInstructions(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Describe the assignment task..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="btn-primary inline-flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSettings className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {data.quiz && (
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Current Configuration
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Passing Score</p>
              <p className="text-lg font-bold text-foreground">
                {data.quiz.passingScore}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Time Limit</p>
              <p className="text-lg font-bold text-foreground">
                {data.quiz.timeLimitMin
                  ? `${data.quiz.timeLimitMin} min`
                  : "None"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Sections</p>
              <p className="text-lg font-bold text-foreground">
                {[
                  data.quiz.hasMcq && "MCQ",
                  data.quiz.hasAssignment && "Assignment",
                ]
                  .filter(Boolean)
                  .join(" + ") || "MCQ"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
