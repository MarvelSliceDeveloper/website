"use client";

import type { Certificate } from "@/lib/student-mock-data";

interface CertificatesViewProps {
  certificates: Certificate[];
}

export default function CertificatesView({
  certificates,
}: CertificatesViewProps) {
  const earned = certificates.filter((c) => c.earned);
  const inProgress = certificates.filter((c) => !c.earned);

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
                      {cert.courseTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cert.batchLabel}
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
                  <button className="btn-primary flex-1 text-xs">
                    Download PDF
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
            {inProgress.map((cert) => (
              <div key={cert.id} className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-xl">
                    📖
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {cert.courseTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cert.batchLabel}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                        <span>Completion</span>
                        <span>{cert.completionPercent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                          style={{ width: `${cert.completionPercent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted">
                        Certificate unlocks at 100%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
