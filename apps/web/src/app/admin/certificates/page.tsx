"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconCertificate,
  IconRefresh,
  IconBan,
  IconPalette,
  IconPlus,
  IconCheck,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react";

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

type CertificateTemplate = {
  id: string;
  name: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  footerText: string | null;
  logoUrl: string | null;
  backgroundPattern: string;
  layout: string;
  borderWidth: number;
  borderRadius: number;
  showBorder: boolean;
  showSignatureLine: boolean;
  showVerificationUrl: boolean;
  fontFamily: string;
  titleFontSize: number;
  nameFontSize: number;
  createdAt: string;
};

const defaultTemplateValues = {
  name: "",
  primaryColor: "#3b82f6",
  secondaryColor: "#93c5fd",
  backgroundColor: "#f8fafc",
  textColor: "#1e293b",
  borderColor: "#3b82f6",
  accentColor: "#93c5fd",
  title: "CERTIFICATE OF COMPLETION",
  subtitle: "This certifies that",
  footerText: "",
  logoUrl: "",
  backgroundPattern: "none",
  layout: "classic",
  borderWidth: 2,
  borderRadius: 5,
  showBorder: true,
  showSignatureLine: true,
  showVerificationUrl: true,
  fontFamily: "helvetica",
  titleFontSize: 28,
  nameFontSize: 22,
};

export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState<"certificates" | "templates">(
    "certificates",
  );

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
            Manage issued certificates and customize certificate templates.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border/70">
        <nav className="flex gap-6 text-sm font-semibold">
          {(
            [
              { id: "certificates" as const, label: "Issued Certificates" },
              { id: "templates" as const, label: "Certificate Templates" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 relative transition-colors ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "certificates" ? (
        <CertificatesTab />
      ) : (
        <TemplatesTab />
      )}
    </div>
  );
}

// ── Certificates Tab ────────────────────────────────────────────────────────
function CertificatesTab() {
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
    <>
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">
            All Certificates
          </p>
          <button
            onClick={fetchData}
            className="btn-secondary text-xs py-1.5 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
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
    </>
  );
}

// ── Templates Tab ───────────────────────────────────────────────────────────
function TemplatesTab() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultTemplateValues);
  const [saving, setSaving] = useState(false);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const data = await api.get<{ templates: CertificateTemplate[] }>(
        "/api/admin/certificate-templates",
      );
      setTemplates(data.templates);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  function openCreateForm() {
    setForm(defaultTemplateValues);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(template: CertificateTemplate) {
    setForm({
      name: template.name,
      primaryColor: template.primaryColor,
      secondaryColor: template.secondaryColor,
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      borderColor: template.borderColor,
      accentColor: template.accentColor,
      title: template.title,
      subtitle: template.subtitle,
      footerText: template.footerText || "",
      logoUrl: template.logoUrl || "",
      backgroundPattern: template.backgroundPattern,
      layout: template.layout,
      borderWidth: template.borderWidth,
      borderRadius: template.borderRadius,
      showBorder: template.showBorder,
      showSignatureLine: template.showSignatureLine,
      showVerificationUrl: template.showVerificationUrl,
      fontFamily: template.fontFamily,
      titleFontSize: template.titleFontSize,
      nameFontSize: template.nameFontSize,
    });
    setEditingId(template.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        footerText: form.footerText || null,
        logoUrl: form.logoUrl || null,
      };

      if (editingId) {
        await api.put(`/api/admin/certificate-templates/${editingId}`, payload);
        toast.success("Template updated");
      } else {
        await api.post("/api/admin/certificate-templates", payload);
        toast.success("Template created");
      }
      setShowForm(false);
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await api.post(`/api/admin/certificate-templates/${id}/set-default`);
      toast.success("Default template updated");
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/certificate-templates/${id}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Customize the appearance of generated certificates. The default template
          is used for all new certificates.
        </p>
        <button
          onClick={openCreateForm}
          className="btn-primary text-xs py-2 flex items-center gap-1.5"
        >
          <IconPlus size={14} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-12 text-center">
          <IconPalette size={40} className="mx-auto text-muted/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">
            No templates yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first template to customize certificate appearance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-xl border bg-card p-5 transition-all ${
                template.isDefault
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {template.name}
                    </p>
                    {template.isDefault && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {template.title}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(template)}
                    className="p-1.5 rounded-md hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <IconEdit size={14} />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-4 flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.primaryColor }}
                  title={`Primary: ${template.primaryColor}`}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.secondaryColor }}
                  title={`Secondary: ${template.secondaryColor}`}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.backgroundColor }}
                  title={`Background: ${template.backgroundColor}`}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.textColor }}
                  title={`Text: ${template.textColor}`}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.borderColor }}
                  title={`Border: ${template.borderColor}`}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.accentColor }}
                  title={`Accent: ${template.accentColor}`}
                />
                <span className="text-[10px] text-muted ml-1">Colors</span>
              </div>

              {/* Certificate Preview Mockup */}
              <div
                className="mt-3 rounded-lg border border-border/60 p-3 text-center"
                style={{
                  backgroundColor: template.backgroundColor,
                  border: template.showBorder
                    ? `${template.borderWidth}px solid ${template.borderColor}`
                    : `${template.borderWidth}px solid ${template.borderColor}`,
                  borderRadius: template.borderRadius,
                }}
              >
                <p
                  className="text-[10px] font-bold tracking-wider"
                  style={{
                    color: template.textColor,
                    fontFamily:
                      template.fontFamily === "times"
                        ? "serif"
                        : template.fontFamily === "courier"
                          ? "monospace"
                          : "sans-serif",
                  }}
                >
                  {template.title}
                </p>
                <p className="text-[8px] text-muted-foreground mt-1">
                  {template.subtitle}
                </p>
                <p
                  className="text-[11px] font-bold mt-1"
                  style={{
                    color: template.textColor,
                    fontFamily:
                      template.fontFamily === "times"
                        ? "serif"
                        : template.fontFamily === "courier"
                          ? "monospace"
                          : "sans-serif",
                  }}
                >
                  Student Name
                </p>
                <div
                  className="h-px w-16 mx-auto mt-1"
                  style={{ backgroundColor: template.primaryColor }}
                />
              </div>

              {!template.isDefault && (
                <button
                  onClick={() => handleSetDefault(template.id)}
                  className="mt-3 w-full btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                >
                  <IconCheck size={12} /> Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Edit Template" : "New Template"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Customize the certificate appearance.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Default, Gold, Premium"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Colors - Section 1: Core Colors */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Colors
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["primaryColor", "Primary Color"],
                      ["secondaryColor", "Secondary Color"],
                      ["backgroundColor", "Background Color"],
                      ["textColor", "Text Color"],
                      ["borderColor", "Border Color"],
                      ["accentColor", "Accent Color"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={form[key]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                          className="h-8 w-8 rounded border border-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={form[key]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout & Style */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Layout & Style
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Layout
                    </label>
                    <select
                      value={form.layout}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, layout: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                      <option value="elegant">Elegant</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Background Pattern
                    </label>
                    <select
                      value={form.backgroundPattern}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          backgroundPattern: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                      <option value="corners">Corners</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Font Family
                    </label>
                    <select
                      value={form.fontFamily}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fontFamily: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="helvetica">Helvetica</option>
                      <option value="times">Times Roman</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Border Width (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={form.borderWidth}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          borderWidth: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Border Radius (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={form.borderRadius}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          borderRadius: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Title Font Size (pt)
                    </label>
                    <input
                      type="number"
                      min="12"
                      max="48"
                      value={form.titleFontSize}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          titleFontSize: parseInt(e.target.value) || 28,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Name Font Size (pt)
                    </label>
                    <input
                      type="number"
                      min="12"
                      max="48"
                      value={form.nameFontSize}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nameFontSize: parseInt(e.target.value) || 22,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Options */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Display Options
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ["showBorder", "Show Border"],
                      ["showSignatureLine", "Show Signature Line"],
                      ["showVerificationUrl", "Show Verification URL"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Text Content
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Certificate Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subtitle: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Footer Text (optional)
                    </label>
                    <input
                      type="text"
                      value={form.footerText}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, footerText: e.target.value }))
                      }
                      placeholder="e.g., Powered by Marvel Slice"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Logo URL (optional)
                    </label>
                    <input
                      type="text"
                      value={form.logoUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, logoUrl: e.target.value }))
                      }
                      placeholder="https://example.com/logo.png"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Preview
                </p>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: form.backgroundColor,
                    border: form.showBorder
                      ? `${form.borderWidth}px solid ${form.borderColor}`
                      : "none",
                    borderRadius: form.borderRadius,
                  }}
                >
                  <div
                    className="h-0.5 w-16 mx-auto mb-2"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <p
                    className="font-bold tracking-wider"
                    style={{
                      color: form.textColor,
                      fontSize: Math.min(form.titleFontSize / 2, 14),
                      fontFamily:
                        form.fontFamily === "times"
                          ? "serif"
                          : form.fontFamily === "courier"
                            ? "monospace"
                            : "sans-serif",
                    }}
                  >
                    {form.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {form.subtitle}
                  </p>
                  <p
                    className="font-bold mt-2"
                    style={{
                      color: form.textColor,
                      fontSize: Math.min(form.nameFontSize / 2, 11),
                      fontFamily:
                        form.fontFamily === "times"
                          ? "serif"
                          : form.fontFamily === "courier"
                            ? "monospace"
                            : "sans-serif",
                    }}
                  >
                    John Doe
                  </p>
                  <div
                    className="h-px w-20 mx-auto mt-1"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">
                    has successfully completed the course
                  </p>
                  <p
                    className="text-xs font-bold mt-1"
                    style={{ color: form.textColor }}
                  >
                    Web Development Bootcamp
                  </p>
                  {form.showSignatureLine && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="h-px w-24 mx-auto bg-gray-400" />
                      <p className="text-[8px] text-muted-foreground mt-1">
                        Instructor Signature
                      </p>
                    </div>
                  )}
                  {form.footerText && (
                    <p className="text-[8px] text-muted-foreground mt-2">
                      {form.footerText}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 text-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
