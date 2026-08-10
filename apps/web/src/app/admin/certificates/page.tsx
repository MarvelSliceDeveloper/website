"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconRefresh,
  IconBan,
  IconPalette,
  IconPlus,
  IconCheck,
  IconTrash,
  IconEdit,
  IconX,
  IconCrosshair,
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

type PlaceholderField = {
  key: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
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
  pdfTemplateType?: "jsPdf" | "uploadedPdf";
  pdfTemplateUrl?: string | null;
  pdfTemplateFields?: PlaceholderField[];
  hasPdfUpload?: boolean;
};

// The API stores a relative on-disk path (forward- or backslash-separated, and
// for legacy uploads may contain spaces/commas). For the browser we must serve
// it under /uploads/ with a proper URL: backslashes -> forward slashes and the
// whole thing percent-encoded so the iframe / Open-PDF link actually fetches the
// file instead of 404-ing on malformed paths.
function uploadsPublicUrl(relative?: string | null): string {
  if (!relative) return "";
  return encodeURI(`/uploads/${relative.replace(/\\/g, "/")}`);
}

const defaultTemplateValues = {
  name: "",
  primaryColor: "#2551d9",
  secondaryColor: "#93c5fd",
  backgroundColor: "#f8fafc",
  textColor: "#1e293b",
  borderColor: "#2551d9",
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
  pdfTemplateType: "uploadedPdf",
};

const defaultPdfFields: PlaceholderField[] = [
  {
    key: "studentName",
    x: 0,
    y: 130,
    fontSize: 22,
    color: "#1e293b",
    align: "center",
  },
  {
    key: "courseName",
    x: 0,
    y: 170,
    fontSize: 18,
    color: "#1e293b",
    align: "center",
  },
  {
    key: "date",
    x: 0,
    y: 200,
    fontSize: 10,
    color: "#64748b",
    align: "center",
  },
  {
    key: "certificateNumber",
    x: 120,
    y: 240,
    fontSize: 10,
    color: "#64748b",
    align: "left",
  },
];

// Sample values used to preview how real field data will look/fit once a
// certificate is actually issued. Falls back to "Sample <key>" for any
// custom placeholder keys a template author might add.
const SAMPLE_FIELD_DATA: Record<string, string> = {
  studentName: "Jordan Smith",
  courseName: "Web Development Bootcamp",
  date: new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  certificateNumber: "CERT-2026-00123",
};

function getSampleFieldValue(key: string): string {
  return SAMPLE_FIELD_DATA[key] ?? `Sample ${key}`;
}

// The API stores pdfTemplateType="uploadedPdf" when a PDF has been uploaded.
// `hasPdfUpload` is not returned by the API, so derive it from the type + URL.
function hasUploadedPdf(template: CertificateTemplate): boolean {
  return (
    template.pdfTemplateType === "uploadedPdf" && !!template.pdfTemplateUrl
  );
}

export default function AdminCertificatesPage() {
  usePageTitle("Certificates");
  const [activeTab, setActiveTab] = useState<"certificates" | "templates">(
    "certificates",
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Certificates"
        description="Manage issued certificates and customize certificate templates."
        breadcrumbs={[{ label: "Certificates", href: "/admin/certificates" }]}
      />

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
      {activeTab === "certificates" ? <CertificatesTab /> : <TemplatesTab />}
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
          total: number;
        }>("/api/admin/certificates", {
          page: String(page),
          limit: String(limit),
        }),
        api.get<CertificateStats>("/api/admin/certificates/stats"),
      ]);
      setCertificates(certsData.certificates);
      setTotal(certsData.total);
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
        {[
          {
            label: "Total Certificates",
            value: stats?.total ?? null,
            color: "text-primary",
          },
          {
            label: "Issued This Month",
            value: stats?.issuedThisMonth ?? null,
            color: "text-success",
          },
          {
            label: "Revoked",
            value: stats?.revoked ?? null,
            color: "text-danger",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-xs text-foreground/60">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>
              {s.value !== null && !loading ? (
                s.value.toLocaleString()
              ) : loading ? (
                <span className="text-foreground/20">—</span>
              ) : (
                "0"
              )}
            </p>
          </div>
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
          <div className="py-12 text-center text-sm text-foreground/60 animate-pulse">
            Loading certificates...
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-12 text-center text-sm text-foreground/50">
            No certificates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-foreground/50 uppercase font-bold tracking-wider">
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
                    <td className="py-3 pr-3 font-mono text-xs text-foreground/70">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {cert.studentName}
                    </td>
                    <td className="py-3 pr-3 text-foreground/70">
                      {cert.courseName}
                    </td>
                    <td className="py-3 pr-3 text-foreground/60 whitespace-nowrap">
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
                            className="p-1.5 rounded-md hover:bg-danger/10 text-foreground/60 hover:text-danger transition-colors"
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfTemplateFields, setPdfTemplateFields] = useState<
    PlaceholderField[]
  >([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPageSize, setPdfPageSize] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    null,
  );
  // Shows rendered sample data (name/course/date/etc.) at each field's real
  // position/size/color instead of just a bare crosshair + key label.
  const [showSampleText, setShowSampleText] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Ignore a page size that belongs to a previously previewed file.
  const pageSize =
    pdfPageSize && pdfPageSize.url === pdfPreviewUrl ? pdfPageSize : null;
  const pageW = pageSize?.width || 595;
  const pageH = pageSize?.height || 842;

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

  // Load the first page's dimensions so markers can be positioned accurately
  // (x/y are in PDF points, mapped to the preview as percentages).
  useEffect(() => {
    let cancelled = false;
    if (!pdfPreviewUrl) return;
    (async () => {
      try {
        const res = await fetch(pdfPreviewUrl);
        const bytes = await res.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const page = doc.getPages()[0];
        if (!cancelled)
          setPdfPageSize({
            url: pdfPreviewUrl,
            width: page.getWidth(),
            height: page.getHeight(),
          });
      } catch {
        if (!cancelled) setPdfPageSize(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfPreviewUrl]);

  function openCreateForm() {
    setForm(defaultTemplateValues);
    setEditingId(null);
    setShowForm(true);
    setPdfTemplateFields(defaultPdfFields);
    setPdfFile(null);
    setPdfPreviewUrl("");
    setPdfPageSize(null);
    setSelectedFieldIndex(null);
  }

  async function openEditForm(template: CertificateTemplate) {
    // Re-fetch fresh data so the saved PDF upload / field positions always
    // show in the preview (avoids stale list state right after a save).
    let fresh = template;
    try {
      const res = await api.get<{ template: CertificateTemplate }>(
        `/api/admin/certificate-templates/${template.id}`,
      );
      fresh = res.template;
    } catch {
      // fall back to the list item if the single fetch fails
    }
    setForm({
      name: fresh.name,
      primaryColor: fresh.primaryColor,
      secondaryColor: fresh.secondaryColor,
      backgroundColor: fresh.backgroundColor,
      textColor: fresh.textColor,
      borderColor: fresh.borderColor,
      accentColor: fresh.accentColor,
      title: fresh.title,
      subtitle: fresh.subtitle,
      footerText: fresh.footerText || "",
      logoUrl: fresh.logoUrl || "",
      backgroundPattern: fresh.backgroundPattern,
      layout: fresh.layout,
      borderWidth: fresh.borderWidth,
      borderRadius: fresh.borderRadius,
      showBorder: fresh.showBorder,
      showSignatureLine: fresh.showSignatureLine,
      showVerificationUrl: fresh.showVerificationUrl,
      fontFamily: fresh.fontFamily,
      titleFontSize: fresh.titleFontSize,
      nameFontSize: fresh.nameFontSize,
      pdfTemplateType: "uploadedPdf",
    });
    setEditingId(fresh.id);
    setShowForm(true);
    setPdfTemplateFields(fresh.pdfTemplateFields || []);
    setPdfFile(null);
    setPdfPreviewUrl(
      fresh.pdfTemplateType === "uploadedPdf" && fresh.pdfTemplateUrl
        ? uploadsPublicUrl(fresh.pdfTemplateUrl)
        : "",
    );
    setPdfPageSize(null);
    setSelectedFieldIndex(null);
  }

  function closeModal() {
    setShowForm(false);
    setPdfTemplateFields([]);
    setPdfFile(null);
    setPdfPreviewUrl("");
    setPdfPageSize(null);
    setSelectedFieldIndex(null);
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
        pdfTemplateType: "uploadedPdf",
        pdfTemplateFields,
      };

      let templateId = editingId;
      if (templateId) {
        await api.put(
          `/api/admin/certificate-templates/${templateId}`,
          payload,
        );
      } else {
        const res = await api.post<{ template: CertificateTemplate }>(
          "/api/admin/certificate-templates",
          payload,
        );
        templateId = res.template.id;
      }

      // A picked PDF is only persisted via /upload-pdf — upload it as part of
      // Save so a file selected but not separately "Uploaded" isn't silently
      // dropped (the uploaded template then takes effect on generated certs).
      if (form.pdfTemplateType === "uploadedPdf" && pdfFile && templateId) {
        const fd = new FormData();
        fd.append("pdf", pdfFile);
        fd.append("pdfTemplateFields", JSON.stringify(pdfTemplateFields));
        const up = await api.post<{ template: CertificateTemplate }>(
          `/api/admin/certificate-templates/${templateId}/upload-pdf`,
          fd,
        );
        if (up.template?.pdfTemplateUrl) {
          setPdfPreviewUrl(uploadsPublicUrl(up.template.pdfTemplateUrl));
        }
        setPdfFile(null);
      }

      toast.success(editingId ? "Template updated" : "Template created");
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

  async function handleUploadPdf() {
    if (!pdfFile || !editingId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("pdfTemplateFields", JSON.stringify(pdfTemplateFields));
      const res = await api.post<{ template: CertificateTemplate }>(
        `/api/admin/certificate-templates/${editingId}/upload-pdf`,
        formData,
      );
      toast.success("PDF template uploaded");
      setPdfFile(null);
      setForm((f) => ({ ...f, pdfTemplateType: "uploadedPdf" }));
      if (res.template?.pdfTemplateUrl) {
        setPdfPreviewUrl(uploadsPublicUrl(res.template.pdfTemplateUrl));
      }
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePdf(templateId: string) {
    if (!confirm("Remove the uploaded PDF template?")) return;
    try {
      await api.delete(
        `/api/admin/certificate-templates/${templateId}/pdf-template`,
      );
      toast.success("PDF template removed");
      setForm((f) => ({ ...f, pdfTemplateType: "uploadedPdf" }));
      setPdfPreviewUrl("");
      setPdfPageSize(null);
      setSelectedFieldIndex(null);
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handlePdfFileChange(file: File | null) {
    setPdfFile(file);
    setSelectedFieldIndex(null);
    if (file) {
      setPdfPreviewUrl(URL.createObjectURL(file));
    } else if (editingId) {
      const template = templates.find((t) => t.id === editingId);
      setPdfPreviewUrl(
        template?.pdfTemplateType === "uploadedPdf" && template.pdfTemplateUrl
          ? uploadsPublicUrl(template.pdfTemplateUrl)
          : "",
      );
    }
  }

  function scrollToField(index: number) {
    document
      .getElementById(`pdf-field-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Clicking anywhere on the PDF preview moves the currently selected field.
  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>) {
    if (
      selectedFieldIndex === null ||
      selectedFieldIndex < 0 ||
      selectedFieldIndex >= pdfTemplateFields.length ||
      !pageSize ||
      !previewRef.current
    )
      return;
    const rect = previewRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.round(
      ((e.clientX - rect.left) / rect.width) * pageSize.width,
    );
    const y = Math.round(
      ((e.clientY - rect.top) / rect.height) * pageSize.height,
    );
    setPdfTemplateFields((prev) =>
      prev.map((f, j) =>
        j === selectedFieldIndex
          ? {
              ...f,
              x: Math.min(Math.max(0, x), Math.round(pageSize.width)),
              y: Math.min(Math.max(0, y), Math.round(pageSize.height)),
            }
          : f,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Customize the appearance of generated certificates. The default
          template is used for all new certificates.
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground">
                      {template.pdfTemplateType === "uploadedPdf"
                        ? "Uploaded PDF"
                        : "jsPDF"}
                    </span>
                    {hasUploadedPdf(template) && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                        PDF Ready
                      </span>
                    )}
                  </div>
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

            {/* Certificate Preview */}
              {hasUploadedPdf(template) ? (
                <div className="mt-3 relative w-full aspect-[1.414/1] min-h-[180px] overflow-hidden rounded-lg border border-border/60 bg-white">
                  <iframe
                    src={`${uploadsPublicUrl(template.pdfTemplateUrl)}#toolbar=0&view=Fit`}
                    title={`${template.name} preview`}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                </div>
              ) : (
                <div
                  className="mt-3 rounded-lg border border-border/60 p-6 text-center min-h-[180px] flex flex-col items-center justify-center"
                  style={{
                    backgroundColor: template.backgroundColor,
                    border: `${template.borderWidth}px solid ${template.borderColor}`,
                    borderRadius: template.borderRadius,
                  }}
                >
                  <p
                    className="text-sm font-bold tracking-wider"
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
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {template.subtitle}
                  </p>
                  <p
                    className="text-base font-bold mt-2"
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
                    className="h-px w-24 mx-auto mt-2"
                    style={{ backgroundColor: template.primaryColor }}
                  />
                </div>
              )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[1600px] max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingId ? "Edit Template" : "New Template"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize the certificate appearance.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors shrink-0"
                title="Close"
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="flex flex-1 min-h-0 flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
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

                {/* PDF Template */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    PDF Template
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload your certificate design as a PDF and position the
                    dynamic fields (name, course, date, etc.) on it.
                  </p>

                  <div className="mt-4 space-y-4">
                    {/* Has PDF uploaded indicator */}
                    {editingId &&
                      (() => {
                        const t = templates.find(
                          (item) => item.id === editingId,
                        );
                        return (
                          !!t &&
                          t.pdfTemplateType === "uploadedPdf" &&
                          !!t.pdfTemplateUrl
                        );
                      })() && (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <IconCheck size={16} className="text-emerald-500" />
                            <span className="text-sm text-foreground">
                              PDF template uploaded
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemovePdf(editingId!)}
                            className="text-xs text-danger hover:text-danger-hover font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                    {/* File upload */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Upload PDF File
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            handlePdfFileChange(e.target.files?.[0] || null)
                          }
                          className="flex-1 text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-semibold file:bg-background file:text-foreground hover:file:bg-card-hover"
                        />
                        <button
                          onClick={handleUploadPdf}
                          disabled={!pdfFile || uploading}
                          className="btn-primary text-xs py-2 px-4 disabled:opacity-60"
                        >
                          {uploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>

                    {/* Placeholder Fields Editor */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Placeholder Fields
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
                        Configure position and style for each placeholder on the
                        PDF.
                      </p>
                      <div className="space-y-3">
                        {pdfTemplateFields.map((field, i) => (
                          <div
                            key={field.key}
                            id={`pdf-field-${i}`}
                            onClick={() => setSelectedFieldIndex(i)}
                            className={`rounded-xl border bg-background p-3 cursor-pointer transition-colors ${
                              selectedFieldIndex === i
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-border hover:border-border-hover"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono font-bold text-foreground">
                                {field.key}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground">
                                ({field.x}, {field.y})
                              </span>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  X
                                </label>
                                <input
                                  type="number"
                                  value={field.x}
                                  onChange={(e) =>
                                    setPdfTemplateFields((prev) =>
                                      prev.map((f, j) =>
                                        j === i
                                          ? {
                                              ...f,
                                              x: parseInt(e.target.value) || 0,
                                            }
                                          : f,
                                      ),
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Y
                                </label>
                                <input
                                  type="number"
                                  value={field.y}
                                  onChange={(e) =>
                                    setPdfTemplateFields((prev) =>
                                      prev.map((f, j) =>
                                        j === i
                                          ? {
                                              ...f,
                                              y: parseInt(e.target.value) || 0,
                                            }
                                          : f,
                                      ),
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Font Size
                                </label>
                                <input
                                  type="number"
                                  min="6"
                                  max="48"
                                  value={field.fontSize}
                                  onChange={(e) =>
                                    setPdfTemplateFields((prev) =>
                                      prev.map((f, j) =>
                                        j === i
                                          ? {
                                              ...f,
                                              fontSize:
                                                parseInt(e.target.value) || 10,
                                            }
                                          : f,
                                      ),
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Color
                                </label>
                                <div className="mt-0.5 flex items-center gap-1">
                                  <input
                                    type="color"
                                    value={field.color}
                                    onChange={(e) =>
                                      setPdfTemplateFields((prev) =>
                                        prev.map((f, j) =>
                                          j === i
                                            ? { ...f, color: e.target.value }
                                            : f,
                                        ),
                                      )
                                    }
                                    className="h-6 w-6 rounded border border-border cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={field.color}
                                    onChange={(e) =>
                                      setPdfTemplateFields((prev) =>
                                        prev.map((f, j) =>
                                          j === i
                                            ? { ...f, color: e.target.value }
                                            : f,
                                        ),
                                      )
                                    }
                                    className="flex-1 rounded-lg border border-border bg-background px-1.5 py-1 text-[10px] font-mono text-foreground focus:border-primary focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Align
                                </label>
                                <select
                                  value={field.align}
                                  onChange={(e) =>
                                    setPdfTemplateFields((prev) =>
                                      prev.map((f, j) =>
                                        j === i
                                          ? {
                                              ...f,
                                              align: e.target.value as
                                                | "left"
                                                | "center"
                                                | "right",
                                            }
                                          : f,
                                      ),
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Key
                                </label>
                                <input
                                  type="text"
                                  value={field.key}
                                  onChange={(e) =>
                                    setPdfTemplateFields((prev) =>
                                      prev.map((f, j) =>
                                        j === i
                                          ? { ...f, key: e.target.value }
                                          : f,
                                      ),
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-1.5 py-1 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview Panel */}
              <div className="shrink-0 lg:w-[920px] border-t lg:border-t-0 lg:border-l border-border bg-background/40 p-6 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Preview
                </p>
                {pdfPreviewUrl ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground">
                      Crosshair markers show where each field lands. Click a
                      marker to select its field, or click directly on the page
                      to move the selected field. Coordinates are in PDF points
                      from the top-left.
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={showSampleText}
                          onChange={(e) => setShowSampleText(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                        />
                        Show sample text
                      </label>
                      {pdfPreviewUrl.startsWith("/uploads/") && (
                        <a
                          href={pdfPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-[10px] py-1 px-2.5 inline-flex items-center gap-1"
                          title="View the uploaded certificate at full size in a new tab"
                        >
                          Open PDF
                        </a>
                      )}
                    </div>

                    <div
                       ref={previewRef}
                       onClick={handlePreviewClick}
                       className="relative w-full max-h-[75vh] mx-auto overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                       style={{
                         aspectRatio: pageSize
                           ? `${pageSize.width} / ${pageSize.height}`
                           : "595 / 842",
                          // let height drive width when the page is portrait and
                         // the panel is wide enough that width-first sizing
                          // would overflow max-h
                         width: pageSize && pageSize.height > pageSize.width
                            ? "auto"
                            : "100%",
                          height: pageSize && pageSize.height > pageSize.width
                            ? "75vh"
                            : "auto",
                       }}
                     >
                      <iframe
                        src={`${pdfPreviewUrl}#toolbar=0&view=Fit`}
                        title="Certificate PDF preview"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                      />
                      {pdfPreviewUrl.startsWith("/uploads/") && (
                        <p className="absolute bottom-1.5 right-2 z-10 max-w-[70%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white">
                          {decodeURIComponent(
                            pdfPreviewUrl.split("/").pop() || "",
                          )}
                        </p>
                      )}
                      {showSampleText && (
                        <svg
                          className="pointer-events-none absolute inset-0 h-full w-full"
                          viewBox={`0 0 ${pageW} ${pageH}`}
                          preserveAspectRatio="none"
                        >
                          {pdfTemplateFields.map((field, i) => (
                            <text
                              key={`sample-${field.key}-${i}`}
                              x={field.x}
                              y={field.y}
                              fontSize={field.fontSize}
                              fill={field.color}
                              textAnchor={
                                field.align === "center"
                                  ? "middle"
                                  : field.align === "right"
                                    ? "end"
                                    : "start"
                              }
                              fontFamily={
                                form.fontFamily === "times"
                                  ? "Times New Roman, serif"
                                  : form.fontFamily === "courier"
                                    ? "Courier New, monospace"
                                    : "Helvetica, Arial, sans-serif"
                              }
                            >
                              {getSampleFieldValue(field.key)}
                            </text>
                          ))}
                        </svg>
                      )}
                      {pdfTemplateFields.map((field, i) => {
                        const selected = selectedFieldIndex === i;
                        return (
                          <div
                            key={`${field.key}-${i}`}
                            className="pointer-events-none absolute"
                            style={{
                              left: `${(field.x / pageW) * 100}%`,
                              top: `${(field.y / pageH) * 100}%`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFieldIndex(i);
                                scrollToField(i);
                              }}
                              title={`${field.key}: (${field.x}, ${field.y})`}
                              className="pointer-events-auto relative flex items-start"
                            >
                              <IconCrosshair
                                size={selected ? 18 : 14}
                                className={`-translate-x-1/2 -translate-y-1/2 shrink-0 drop-shadow ${
                                  selected ? "text-primary" : "text-primary/70"
                                }`}
                              />
                              <span
                                className={`ml-1 whitespace-nowrap rounded px-1 py-px text-[8px] font-bold font-mono ${
                                  selected
                                    ? "bg-primary text-white"
                                    : "bg-black/70 text-white"
                                }`}
                              >
                                {field.key}
                              </span>
                            </button>
                            {selected && (
                              <span className="absolute left-1/2 top-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-card px-1 py-px text-[8px] font-mono text-foreground shadow">
                                ({field.x}, {field.y})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-xs text-muted-foreground">
                    Select a PDF file and click Upload to preview its layout.
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={closeModal}
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
