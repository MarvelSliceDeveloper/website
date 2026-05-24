"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type CertificateItem = {
    id: string;
    courseId: string;
    issuedAt: string;
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
        price: number;
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
    const [data, setData] = useState<CertificatesResponse>({ certificates: [], claimable: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [claimingCourseId, setClaimingCourseId] = useState<string | null>(null);

    const loadCertificates = async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await api.get<CertificatesResponse>("/api/certificates/my");
            setData(response);
        } catch (loadError: any) {
            setError(loadError.message || "Failed to load certificates");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCertificates();
    }, []);

    const claimCertificate = async (courseId: string) => {
        try {
            setClaimingCourseId(courseId);
            await api.post("/api/certificates/claim", { courseId });
            await loadCertificates();
        } catch (claimError: any) {
            setError(claimError.message || "Failed to claim certificate");
        } finally {
            setClaimingCourseId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Your issued certificates and any courses ready to claim.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Issued" value={String(data.certificates.length)} icon="🏆" color="from-warning to-amber-400" />
                <StatCard label="Claimable" value={String(data.claimable.length)} icon="✨" color="from-success to-emerald-400" />
                <StatCard label="Loading" value={isLoading ? "Yes" : "No"} icon="📡" color="from-primary to-violet-500" />
            </div>

            <section className="glass-card overflow-hidden">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-base font-semibold text-foreground">Issued Certificates</h2>
                </div>
                <div className="p-6">
                    {data.certificates.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {data.certificates.map((certificate) => (
                                <div key={certificate.id} className="rounded-2xl border border-border bg-card/60 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-primary-hover">Issued certificate</p>
                                            <h3 className="mt-1 text-lg font-semibold text-foreground">{certificate.course.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{certificate.course.category || "General"}</p>
                                        </div>
                                        <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                                            {certificate.progressPercent}% complete
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                                        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                                            <p className="text-xs uppercase tracking-[0.12em] text-muted">Issued at</p>
                                            <p className="mt-1 text-foreground">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                                            <p className="text-xs uppercase tracking-[0.12em] text-muted">Certificate ID</p>
                                            <p className="mt-1 truncate text-foreground">{certificate.id}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            {certificate.completedRecordings}/{certificate.totalRecordings} recordings completed
                                        </p>
                                        <button className="btn-secondary text-xs" onClick={() => window.print()}>
                                            Print
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
                            No certificates have been issued yet.
                        </div>
                    )}
                </div>
            </section>

            <section className="glass-card overflow-hidden">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-base font-semibold text-foreground">Claimable Certificates</h2>
                </div>
                <div className="p-6">
                    {data.claimable.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {data.claimable.map((item) => (
                                <div key={item.courseId} className="rounded-2xl border border-success/20 bg-success/10 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-success">Ready to claim</p>
                                            <h3 className="mt-1 text-lg font-semibold text-foreground">{item.course.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{item.course.category || "General"}</p>
                                        </div>
                                        <span className="rounded-full border border-success/20 bg-background/60 px-3 py-1 text-[11px] font-medium text-success">
                                            100%
                                        </span>
                                    </div>
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        Completed {item.completedRecordings}/{item.totalRecordings} recordings.
                                    </p>
                                    <button
                                        onClick={() => claimCertificate(item.courseId)}
                                        disabled={claimingCourseId === item.courseId}
                                        className="btn-primary mt-4 w-full justify-center disabled:opacity-60"
                                    >
                                        {claimingCourseId === item.courseId ? "Claiming..." : "Claim certificate"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
                            No courses are ready to claim yet. Finish all recordings in an enrolled course and it will appear here.
                        </div>
                    )}
                </div>
            </section>
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
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-lg opacity-80`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}