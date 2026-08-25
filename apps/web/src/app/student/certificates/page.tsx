"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconAward,
  IconCheck,
  IconX,
  IconClock,
  IconLock,
} from "@tabler/icons-react";

type CertificateItem = {
  id: string;
  courseId?: string | null;
  packageId?: string | null;
  issuedAt: string;
  autoIssued?: boolean;
  totalRecordings?: number;
  completedRecordings?: number;
  progressPercent?: number;
  course?: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    updatedAt: string;
  } | null;
  package?: {
    id: string;
    name: string;
    description: string;
  } | null;
};

type ProgressDetails = {
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
  isExamRequired: boolean;
  isExamPassed: boolean;
};

type CertificatesResponse = {
  certificates: CertificateItem[];
  claimable: Array<{
    courseId: string;
    totalRecordings: number;
    completedRecordings: number;
    progressPercent: number;
    course: NonNullable<CertificateItem["course"]>;
    details?: ProgressDetails;
  }>;
  inProgress?: Array<{
    courseId: string;
    totalRecordings: number;
    completedRecordings: number;
    progressPercent: number;
    course: NonNullable<CertificateItem["course"]>;
    details?: ProgressDetails;
  }>;
};

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

type StudentPackage = {
  id: string;
  name: string;
  description: string;
};

export default function CertificatesPage() {
  usePageTitle("My Certificates");
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const certificatesQuery = useApiQuery<CertificatesResponse>(
    ["student", "certificates"],
    "/api/certificates/",
  );

  // Package certification tracker: load the student's packages, then one
  // status request per package (dependent query keyed by package ids).
  const packagesQuery = useApiQuery<{ packages: StudentPackage[] }>(
    ["student", "packages"],
    "/api/student/packages",
  );

  const packageProgressQuery = useQuery({
    queryKey: [
      "student",
      "certificates",
      "package-progress",
      (packagesQuery.data?.packages ?? []).map((p) => p.id),
    ],
    queryFn: async () => {
      const pkgs = packagesQuery.data?.packages ?? [];
      const progresses = await Promise.all(
        pkgs.map(async (pkg) => {
          try {
            return await api.get<PackageExamProgress>(
              `/api/certificates/package/${pkg.id}/status`,
            );
          } catch {
            return null;
          }
        }),
      );
      return progresses.filter((p): p is PackageExamProgress => p !== null);
    },
    enabled: Boolean(packagesQuery.data),
    staleTime: 30_000,
  });

  const data = certificatesQuery.data ?? {
    certificates: [],
    claimable: [],
  };
  const packageProgresses = packageProgressQuery.data ?? [];
  const isLoading =
    certificatesQuery.isPending || packageProgressQuery.isPending;

  // Claim a package certificate once all required exams are passed.
  const claimMutation = useMutation({
    mutationFn: (packageId: string) =>
      api.post<{ issued: boolean; reason?: string }>(
        "/api/certificates/claim-package",
        { packageId },
      ),
    onSuccess: (result) => {
      if (result.issued) {
        toast.success(
          "Congratulations! Package Certificate claimed successfully.",
        );
        void queryClient.invalidateQueries({
          queryKey: ["student", "certificates"],
        });
      } else {
        toast.info(result.reason || "Unable to claim certificate.");
      }
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to claim package certificate",
      );
    },
  });

  const downloadCertificate = async (certId: string) => {
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
    } catch (downloadError: unknown) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download certificate",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Certificates & Certification Exams
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            To claim your certificate, you must complete all quizzes,
            assignments, and certification exams in your course. For
            package-level certification, all enrolled courses in the package
            must be completed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Issued Certificates"
          value={String(data.certificates.length)}
          icon="🏆"
          color="from-warning to-amber-400"
        />
        <StatCard
          label="Programs In Progress"
          value={String(packageProgresses.length)}
          icon="📚"
          color="from-primary to-primary-hover"
        />
      </div>

      {/* Package Certification Tracker */}
      {packageProgresses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <IconAward className="text-amber-500" size={22} />
            Package Certification Tracker
          </h2>

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
                    {progress.totalRequired} required exams passed
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => claimMutation.mutate(progress.packageId)}
                    disabled={!progress.allPassed || claimMutation.isPending}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                      progress.allPassed
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                        : "bg-muted/20 text-muted-foreground cursor-not-allowed border border-border/40"
                    }`}
                  >
                    {claimMutation.isPending ? (
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

      {/* Issued Certificates */}
      <section className="glass-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Issued Certificates
          </h2>
        </div>
        <div className="p-6">
          {data.certificates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {data.certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="rounded-2xl border border-border bg-card/60 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-primary-hover">
                        {certificate.package
                          ? "Package Certificate"
                          : certificate.autoIssued
                            ? "Auto-issued"
                            : "Issued certificate"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {certificate.package?.name ||
                          certificate.course?.title ||
                          "Certificate"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {certificate.package
                          ? "Complete Program Certification"
                          : certificate.course?.category || "General"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                        ISSUED
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-muted">
                        Issued at
                      </p>
                      <p className="mt-1 text-foreground">
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-muted">
                        Download
                      </p>
                      <button
                        className="mt-1 text-primary hover:underline disabled:opacity-60 text-left font-medium"
                        disabled={downloadingId === certificate.id}
                        onClick={() => downloadCertificate(certificate.id)}
                      >
                        {downloadingId === certificate.id
                          ? "Downloading..."
                          : "Download PDF"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : certificatesQuery.isError
                  ? "Failed to load certificates. Please try again."
                  : "No certificates issued yet. Pass all required certification exams in your enrolled program to claim your certificate."}
            </div>
          )}
        </div>
      </section>

      {((data.inProgress && data.inProgress.length > 0) ||
        data.claimable.length > 0) && (
        <section className="glass-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <IconClock className="text-primary" size={20} />
              Courses In Progress & Requirements Checklist
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {[...(data.claimable || []), ...(data.inProgress || [])].map(
                (item) => {
                  const d = item.details;
                  const examDone = d?.isExamRequired ? d.isExamPassed : true;

                  const isClaimable = item.progressPercent === 100 && examDone;

                  return (
                    <div
                      key={item.courseId}
                      className="rounded-2xl border border-border bg-card/60 p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                              isClaimable
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {isClaimable ? "Ready to Claim" : "In Progress"}
                          </span>
                          <h3 className="mt-1.5 text-lg font-bold text-foreground">
                            {item.course.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {item.course.category || "General"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-foreground">
                            {item.progressPercent}%
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            Complete
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500 rounded-full"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Requirements Checklist / Missing Items */}
                      <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-2 text-xs">
                        <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                          Remaining Requirements
                        </p>
                        {d ? (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              {d.completedLessons >= d.totalLessons ? (
                                <IconCheck
                                  size={14}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <IconX
                                  size={14}
                                  className="text-rose-500 shrink-0"
                                />
                              )}
                              <span
                                className={
                                  d.completedLessons >= d.totalLessons
                                    ? "text-muted-foreground"
                                    : "text-foreground font-medium"
                                }
                              >
                                Lessons ({d.completedLessons}/{d.totalLessons})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {d.completedQuizzes >= d.totalQuizzes ? (
                                <IconCheck
                                  size={14}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <IconX
                                  size={14}
                                  className="text-rose-500 shrink-0"
                                />
                              )}
                              <span
                                className={
                                  d.completedQuizzes >= d.totalQuizzes
                                    ? "text-muted-foreground"
                                    : "text-foreground font-medium"
                                }
                              >
                                Quizzes ({d.completedQuizzes}/{d.totalQuizzes})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {d.completedAssignments >= d.totalAssignments ? (
                                <IconCheck
                                  size={14}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <IconX
                                  size={14}
                                  className="text-rose-500 shrink-0"
                                />
                              )}
                              <span
                                className={
                                  d.completedAssignments >= d.totalAssignments
                                    ? "text-muted-foreground"
                                    : "text-foreground font-medium"
                                }
                              >
                                Assignments ({d.completedAssignments}/
                                {d.totalAssignments})
                              </span>
                            </div>

                            {d.isExamRequired && (
                              <div className="flex items-center gap-1.5">
                                {d.isExamPassed ? (
                                  <IconCheck
                                    size={14}
                                    className="text-emerald-500 shrink-0"
                                  />
                                ) : (
                                  <IconX
                                    size={14}
                                    className="text-rose-500 shrink-0"
                                  />
                                )}
                                <span
                                  className={
                                    d.isExamPassed
                                      ? "text-muted-foreground"
                                      : "text-foreground font-medium"
                                  }
                                >
                                  Exam{" "}
                                  {d.isExamPassed ? "(Passed)" : "(Pending)"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-xs">
                            {item.completedRecordings} of {item.totalRecordings}{" "}
                            sessions completed.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-lg opacity-80`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
