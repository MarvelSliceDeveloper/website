"use client";

import { useState, useEffect } from "react";
import type { Certificate, CourseProgress } from "@/lib/api-types";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconAward,
  IconCheck,
  IconX,
  IconClock,
  IconLock,
  IconTrendingUp,
} from "@tabler/icons-react";

interface CertificatesViewProps {
  certificates: Certificate[];
}

export default function CertificatesView({
  certificates,
}: CertificatesViewProps) {
  const earned = certificates.filter((c) => c.earned);
  const inProgress = certificates.filter((c) => !c.earned);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, CourseProgress>
  >({});
  const [progressLoading, setProgressLoading] = useState(false);

  // Fetch certificate content progress for in-progress courses
  useEffect(() => {
    if (inProgress.length === 0) return;

    let cancelled = false;
    setProgressLoading(true);

    (async () => {
      const results = await Promise.all(
        inProgress.map(async (cert) => {
          try {
            const progress = await api.get<CourseProgress>(
              `/api/courses/${cert.courseId}/progress`,
            );
            return { courseId: cert.courseId, progress };
          } catch {
            return null;
          }
        }),
      );

      if (!cancelled) {
        const map: Record<string, CourseProgress> = {};
        for (const r of results) {
          if (r) map[r.courseId] = r.progress;
        }
        setProgressByCourse(map);
        setProgressLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inProgress]);

  async function handleDownload(certId: string) {
    setDownloadingId(certId);
    try {
      const response = await fetch(`/api/certificates/${certId}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download certificate");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download certificate",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Achievements</p>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
      </div>

      {/* Earned */}
      <div>
        <p className="sp-eyebrow mb-3">Earned</p>
        {earned.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">🎓</span>
            <p className="text-sm text-muted-foreground">
              Complete a course to earn your first certificate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {earned.map((cert) => (
              <div
                key={cert.id}
                className="glass-card group overflow-hidden border-success/20 bg-gradient-to-br from-success/5 via-card to-card p-5 transition-all hover:-translate-y-0.5 hover:border-success/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-success to-emerald-400 text-xl shadow-md">
                    🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {cert.course?.title ?? "Untitled Course"}
                    </p>
                    {cert.issuedAt && (
                      <p className="mt-0.5 text-xs text-muted">
                        Issued: {cert.issuedAt}
                      </p>
                    )}
                    {cert.verifyUrl && (
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        Verify:{" "}
                        <a
                          href={cert.verifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {cert.verifyUrl}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleDownload(cert.id)}
                    disabled={downloadingId === cert.id}
                    className="btn-primary flex-1 text-xs disabled:opacity-60"
                  >
                    {downloadingId === cert.id ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        Downloading...
                      </span>
                    ) : (
                      "Download PDF"
                    )}
                  </button>
                  <button className="btn-secondary flex-1 text-xs">
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In Progress */}
      <div>
        <p className="sp-eyebrow mb-3">In Progress</p>
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courses in progress.
          </p>
        ) : (
          <div className="space-y-3">
            {inProgress.map((cert) => {
              const progress = progressByCourse[cert.courseId];
              const percent =
                progress?.totalItems > 0
                  ? Math.round(
                      (progress.completedItems / progress.totalItems) * 100,
                    )
                  : 0;
              const progressLabel = progress
                ? `${progress.completedItems}/${progress.totalItems} requirements`
                : `${cert.progressPercent}%`;
              const hasCertModule = progress?.hasCertificationModule ?? false;
              const certQuizPassed = progress?.certificationQuizPassed ?? false;

              return (
                <div key={cert.id} className="glass-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-xl">
                      📖
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {cert.course?.title ?? "Untitled Course"}
                      </p>
                      {cert.course?.category && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {cert.course.category}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                          <span>Completion</span>
                          <span>{progressLabel}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Detailed requirement breakdown (only when progress fetches) */}
                      {progress ? (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-medium text-muted">
                            Certificate Requirements
                          </p>
                          <RequirementRow
                            label="Quizzes"
                            completed={progress.details.completedQuizzes}
                            total={progress.details.totalQuizzes}
                            icon={
                              progress.details.completedQuizzes > 0 ? (
                                <IconCheck
                                  size={12}
                                  className="text-success"
                                />
                              ) : (
                                <IconClock size={12} className="text-muted" />
                              )
                            }
                          />
                          <RequirementRow
                            label="Assignments"
                            completed={progress.details.completedAssignments}
                            total={progress.details.totalAssignments}
                            icon={
                              progress.details.completedAssignments > 0 ? (
                                <IconCheck
                                  size={12}
                                  className="text-success"
                                />
                              ) : (
                                <IconClock
                                  size={12}
                                  className="text-muted"
                                />
                              )
                            }
                          />
                          {hasCertModule && (
                            <RequirementRow
                              label="Certification Exam"
                              completed={certQuizPassed ? 1 : 0}
                              total={1}
                              icon={
                                certQuizPassed ? (
                                  <IconCheck
                                    size={12}
                                    className="text-success"
                                  />
                                ) : (
                                  <IconLock
                                    size={12}
                                    className="text-muted-foreground"
                                  />
                                )
                              }
                            />
                          )}

                          {progress.isComplete && (
                            <p className="mt-2 text-xs font-semibold text-success flex items-center gap-1">
                              <IconAward size={14} />
                              Certificate ready to claim!
                            </p>
                          )}
                        </div>
                      ) : progressLoading ? (
                        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <IconTrendingUp size={12} className="animate-pulse" />
                          Loading requirements…
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-muted">
                          Certificate unlocks at 100%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RequirementRow({
  label,
  completed,
  total,
  icon,
}: {
  label: string;
  completed: number;
  total: number;
  icon: React.ReactNode;
}) {
  const isDone = completed >= total && total > 0;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={`text-xs font-medium ${
          isDone ? "text-success" : "text-muted-foreground"
        }`}
      >
        {completed}/{total} {isDone && <IconCheck size={10} className="inline ml-0.5 text-success" />}
      </span>
    </div>
  );
}
