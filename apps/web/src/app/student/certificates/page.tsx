"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";

type CertificateItem = {
  id: string;
  courseId: string;
  issuedAt: string;
  autoIssued?: boolean;
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
  course: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    updatedAt: string;
  };
};

type CertificatesResponse = {
  certificates: CertificateItem[];
  claimable: Array<{
    courseId: string;
    totalRecordings: number;
    completedRecordings: number;
    progressPercent: number;
    course: CertificateItem["course"];
  }>;
};

export default function CertificatesPage() {
  usePageTitle("My Certificates");
  const [data, setData] = useState<CertificatesResponse>({
    certificates: [],
    claimable: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CertificatesResponse>("/api/certificates/")
      .then((response) => {
        setData(response);
      })
      .catch((loadError: unknown) => {
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load certificates",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
          <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Certificates are automatically issued when you complete all quizzes and assignments in a course.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Issued"
          value={String(data.certificates.length)}
          icon="🏆"
          color="from-warning to-amber-400"
        />
        <StatCard
          label="In Progress"
          value={String(data.claimable.length)}
          icon="📚"
          color="from-primary to-violet-500"
        />
      </div>

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
                        {certificate.autoIssued ? "Auto-issued" : "Issued certificate"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {certificate.course.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {certificate.course.category || "General"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {certificate.autoIssued && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                          Auto
                        </span>
                      )}
                      <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                        {certificate.progressPercent}%
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
                        className="mt-1 text-primary hover:underline disabled:opacity-60 text-left"
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
                : "No certificates issued yet. Complete all quizzes and assignments in a course to receive one automatically."}
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
                    Complete all quizzes and assignments to receive your certificate automatically.
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
