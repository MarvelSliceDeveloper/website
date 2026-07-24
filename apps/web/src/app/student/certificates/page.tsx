"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
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

type CertificatesResponse = {
  certificates: CertificateItem[];
  claimable: Array<{
    courseId: string;
    totalRecordings: number;
    completedRecordings: number;
    progressPercent: number;
    course: NonNullable<CertificateItem["course"]>;
  }>;
};

type SpecialExamCourseStatus = {
  courseId: string;
  courseTitle: string;
  isExamRequired: boolean;
  specialExamId: string | null;
  specialExamTitle: string | null;
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
  const [data, setData] = useState<CertificatesResponse>({
    certificates: [],
    claimable: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [packageProgresses, setPackageProgresses] = useState<
    PackageExamProgress[]
  >([]);
  const [claimingPackageId, setClaimingPackageId] = useState<string | null>(
    null,
  );

  const fetchCertificates = useCallback(async () => {
    try {
      const response =
        await api.get<CertificatesResponse>("/api/certificates/");
      setData(response);
    } catch (loadError: unknown) {
      toast.error(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load certificates",
      );
    }
  }, []);

  const fetchPackageProgress = useCallback(async () => {
    try {
      const res = await api.get<{ packages: StudentPackage[] }>(
        "/api/student/packages",
      );
      const pkgs = res.packages || [];
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
      setPackageProgresses(
        progresses.filter((p): p is PackageExamProgress => p !== null),
      );
    } catch {
      // Ignore if student has no packages
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchCertificates(), fetchPackageProgress()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchCertificates, fetchPackageProgress]);

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

  const claimPackageCert = async (packageId: string) => {
    setClaimingPackageId(packageId);
    try {
      const result = await api.post<{
        issued: boolean;
        certificate?: any;
        reason?: string;
      }>("/api/certificates/claim-package", { packageId });
      if (result.issued) {
        toast.success(
          "Congratulations! Package Certificate claimed successfully.",
        );
        await fetchCertificates();
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Certificates & Special Exams
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete all required Special Exams in your enrolled program to
            unlock and claim your official Package Certification.
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
          color="from-primary to-violet-500"
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
                    Special Exam Progress: {progress.passedCount} of{" "}
                    {progress.totalRequired} required exams passed
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

              {/* Courses & Special Exams status list */}
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
                        {cs.specialExamTitle ? (
                          <>
                            Exam:{" "}
                            <span className="font-semibold">
                              {cs.specialExamTitle}
                            </span>{" "}
                            (Passing: {cs.passingScore}%)
                          </>
                        ) : (
                          <span className="italic text-muted">
                            No Special Exam configured
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
                : "No certificates issued yet. Pass all required Special Exams in your enrolled program to claim your certificate."}
            </div>
          )}
        </div>
      </section>

      {data.claimable.length > 0 && (
        <section className="glass-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Courses In Progress
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {data.claimable.map((item) => (
                <div
                  key={item.courseId}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-primary">
                        In Progress
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {item.course.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.course.category || "General"}
                      </p>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-[11px] font-medium text-primary">
                      {item.progressPercent}%
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Complete all lessons and Special Exams to receive your
                    certificate.
                  </p>
                </div>
              ))}
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
