"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Certificate,
  ClaimableCertificate,
  CourseProgress,
} from "@/lib/api-types";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconAward,
  IconCheck,
  IconX,
  IconClock,
  IconLock,
  IconTrendingUp,
} from "@tabler/icons-react";

type SpecialExamCourseStatus = {
  courseId: string;
  courseTitle: string;
  isExamRequired: boolean;
  certExamId: string | null;
  certExamTitle: string | null;
  passingScore: number;
  isPassed: boolean;
  scorePercentage: number;
  attempted: boolean;
};

type PackageExamProgress = {
  packageId: string;
  packageName: string;
  courses: SpecialExamCourseStatus[];
  totalRequired: number;
  passedCount: number;
  allPassed: boolean;
};

type StudentPackageEnrollment = {
  id: string;
  packageId?: string;
  package?: {
    id: string;
    name: string;
    description?: string;
  };
};

interface CertificatesViewProps {
  onCertificateClaimed?: () => void;
}

type CertificateList = {
  certificates: Certificate[];
  claimable: ClaimableCertificate[];
};

export default function CertificatesView({
  onCertificateClaimed,
}: CertificatesViewProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [inProgress, setInProgress] = useState<
    Array<Certificate & { courseId: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, CourseProgress>
  >({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [packageProgresses, setPackageProgresses] = useState<
    PackageExamProgress[]
  >([]);
  const [claimingPackageId, setClaimingPackageId] = useState<string | null>(
    null,
  );

  // Fetch certificates on demand (kept off the dashboard load path)
  const loadCertificates = useCallback(async () => {
    try {
      const res = await api.get<CertificateList>("/api/certificates");
      const issued = (res.certificates || []).map((c) => ({
        ...c,
        earned: true,
      }));
      const claimable = (res.claimable || []).map((c) => ({
        id: c.courseId,
        courseId: c.courseId,
        course: c.course,
        issuedAt: undefined,
        verifyUrl: undefined,
        totalRecordings: c.totalRecordings,
        completedRecordings: c.completedRecordings,
        progressPercent: c.progressPercent,
        earned: false,
      }));
      setCertificates(issued);
      setInProgress(claimable);
    } catch {
      setCertificates([]);
      setInProgress([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const earned = certificates;

  // Fetch package exam progress
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ packages: StudentPackageEnrollment[] }>(
          "/api/student/packages",
        );
        const pkgs = res.packages || [];
        const progresses = await Promise.all(
          pkgs.map(async (item) => {
            const targetPackageId = item.packageId || item.package?.id;
            if (!targetPackageId) return null;
            try {
              return await api.get<PackageExamProgress>(
                `/api/certificates/package/${targetPackageId}/status`,
              );
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) {
          setPackageProgresses(
            progresses.filter((p): p is PackageExamProgress => p !== null),
          );
        }
      } catch {
        // Ignore if no packages
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function claimPackageCert(packageId: string) {
    setClaimingPackageId(packageId);
    try {
      const result = await api.post<{
        issued: boolean;
        reason?: string;
      }>("/api/certificates/claim-package", { packageId });
      if (result.issued) {
        toast.success(
          "Congratulations! Package Certificate claimed successfully.",
        );
        await loadCertificates();
        if (onCertificateClaimed) onCertificateClaimed();
      } else {
        toast.info(result.reason || "Unable to claim certificate.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to claim package certificate",
      );
    } finally {
      setClaimingPackageId(null);
    }
  }

  return (
    <div className="sp-view-enter space-y-6">
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Loading certificates…
          </span>
        </div>
      ) : (
      <>
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Achievements</p>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete all required course certification exams in your enrolled package program to claim your official Package Certification.
        </p>
      </div>

      {/* Package Certification Tracker */}
      {packageProgresses.length > 0 && (
        <section className="space-y-4">
          <p className="sp-eyebrow">Program Certification Tracker</p>

          {packageProgresses.map((progress) => (
            <div
              key={progress.packageId}
              className="glass-card overflow-hidden border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {progress.packageName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Certification Exam Progress: {progress.passedCount} of{" "}
                    {progress.totalRequired} required course exams passed
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => claimPackageCert(progress.packageId)}
                    disabled={
                      !progress.allPassed ||
                      claimingPackageId === progress.packageId
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                      progress.allPassed
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                        : "bg-muted/20 text-muted-foreground cursor-not-allowed border border-border/40"
                    }`}
                  >
                    {claimingPackageId === progress.packageId ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    ) : progress.allPassed ? (
                      <>
                        <IconAward size={18} /> Claim Package Certificate
                      </>
                    ) : (
                      <>
                        <IconLock size={16} /> Complete Required Exams to Unlock
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">
                    Certification Readiness
                  </span>
                  <span className="text-amber-400 font-bold">
                    {progress.totalRequired > 0
                      ? Math.round(
                          (progress.passedCount / progress.totalRequired) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-background/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{
                      width: `${
                        progress.totalRequired > 0
                          ? Math.round(
                              (progress.passedCount / progress.totalRequired) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Courses & Certification Exams status list */}
              <div className="mt-5 space-y-2">
                {progress.courses.map((cs) => (
                  <div
                    key={cs.courseId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/50 p-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {cs.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cs.certExamTitle ? (
                          <>
                            Exam:{" "}
                            <span className="font-semibold">
                              {cs.certExamTitle}
                            </span>{" "}
                            (Passing: {cs.passingScore}%)
                          </>
                        ) : (
                          <span className="italic text-muted">
                            No certification exam configured
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!cs.isExamRequired ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-muted/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Exempt
                        </span>
                      ) : cs.isPassed ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                          <IconCheck size={13} /> Passed ({cs.scorePercentage}%)
                        </span>
                      ) : cs.attempted ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-[11px] font-semibold text-danger">
                          <IconX size={13} /> Failed ({cs.scorePercentage}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                          <IconClock size={13} /> Pending Exam
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

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
                    {cert.package && (
                      <p className="text-[11px] uppercase tracking-[0.14em] text-primary-hover font-medium">
                        {cert.autoIssued ? "Package Certificate · Auto-issued" : "Package Certificate"}
                      </p>
                    )}
                    <p className="font-semibold text-foreground">
                      {cert.package?.name ?? cert.course?.title ?? "Certificate"}
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
      </>
      )}
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
