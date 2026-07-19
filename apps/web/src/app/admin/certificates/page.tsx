"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { IconCertificate, IconRefresh, IconBan } from "@tabler/icons-react";

type Certificate = {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issuedAt: string;
  status: "ACTIVE" | "REVOKED";
};

type CertificateStats = {
  total: number;
  issuedThisMonth: number;
  revoked: number;
};

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  async function fetchData() {
    setLoading(true);
    try {
      const [certsData, statsData] = await Promise.all([
        api.get<{
          certificates: Certificate[];
          pagination: { total: number };
        }>("/api/admin/certificates", {
          page: String(page),
          limit: String(limit),
        }),
        api.get<CertificateStats>("/api/admin/certificates/stats"),
      ]);
      setCertificates(certsData.certificates);
      setTotal(certsData.pagination.total);
      setStats(statsData);
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page]);

  async function handleRevoke(id: string, number: string) {
    if (
      !confirm(`Revoke certificate "${number}"? This action cannot be undone.`)
    )
      return;
    try {
      await api.put(`/api/admin/certificates/${id}/revoke`);
      toast.success("Certificate revoked");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconCertificate size={28} className="text-primary-hover" />
            Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage issued course certificates.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats
          ? [
              {
                label: "Total Certificates",
                value: stats.total,
                color: "text-primary",
              },
              {
                label: "Issued This Month",
                value: stats.issuedThisMonth,
                color: "text-success",
              },
              {
                label: "Revoked",
                value: stats.revoked,
                color: "text-danger",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))
          : Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
      </div>

      {/* Certificates Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading certificates...
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No certificates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Certificate #</th>
                  <th className="py-2.5 pr-3">Student</th>
                  <th className="py-2.5 pr-3">Course</th>
                  <th className="py-2.5 pr-3">Issued Date</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {certificates.map((cert) => (
                  <tr
                    key={cert.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono text-[10px] text-muted-foreground">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {cert.studentName}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {cert.courseName}
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(cert.issuedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          cert.status === "ACTIVE"
                            ? "bg-success/15 text-success border-success/25"
                            : "bg-danger/15 text-danger border-danger/25"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end">
                        {cert.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              handleRevoke(cert.id, cert.certificateNumber)
                            }
                            className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                            title="Revoke"
                          >
                            <IconBan size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
