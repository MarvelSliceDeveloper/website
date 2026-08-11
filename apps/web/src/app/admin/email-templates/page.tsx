"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconEdit,
  IconRefresh,
  IconEye,
  IconX,
  IconPlus,
} from "@tabler/icons-react";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
};

export default function AdminEmailTemplatesPage() {
  usePageTitle("Email Templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const modalOpen = editing !== null || creating;

  async function fetchTemplates() {
    setLoading(true);
    try {
      const data = await api.get<{ templates: EmailTemplate[] }>(
        "/api/admin/email-templates",
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

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") cancelEdit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function openEdit(tpl: EmailTemplate) {
    setCreating(false);
    setEditing(tpl);
    setFormName(tpl.name);
    setFormSubject(tpl.subject);
    setFormBody(tpl.body);
    setFormActive(tpl.isActive);
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setFormActive(true);
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setFormActive(true);
  }

  async function handleSave() {
    if (!formSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (creating && !formName.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      if (creating) {
        await api.post("/api/admin/email-templates", {
          name: formName.trim(),
          subject: formSubject.trim(),
          body: formBody,
          isActive: formActive,
        });
        toast.success("Template created");
      } else if (editing) {
        await api.put(`/api/admin/email-templates/${editing.id}`, {
          subject: formSubject.trim(),
          body: formBody,
          isActive: formActive,
        });
        toast.success("Template updated");
      }
      cancelEdit();
      fetchTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview(tpl: EmailTemplate) {
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const data = await api.post<{ html: string }>(
        `/api/admin/email-templates/${tpl.id}/preview`,
      );
      setPreviewHtml(data.html);
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Email Templates"
        description="Manage email templates for automated notifications."
        breadcrumbs={[{ label: "Email Templates", href: "/admin/email-templates" }]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> New Template
            </button>
            <button
              onClick={fetchTemplates}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* Editor Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelEdit();
          }}
        >
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border-2 border-primary/40 bg-card shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">
                {creating ? "New Template" : `Edit: ${editing!.name}`}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Two-column body: form (left) / live preview (right) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              {/* Left: form fields */}
              <div className="p-5 space-y-3 overflow-y-auto border-b md:border-b-0 md:border-r border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Template Details
                </p>
                {creating && (
                  <input
                    type="text"
                    placeholder="Template name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input text-xs w-full"
                  />
                )}
                <input
                  type="text"
                  placeholder="Subject line"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="input text-xs w-full"
                />
                <textarea
                  placeholder="Email body (HTML supported)"
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="input text-xs w-full min-h-[320px] font-mono"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-foreground">Active</span>
                </label>
              </div>

              {/* Right: live preview */}
              <div className="p-5 overflow-y-auto bg-muted/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Live Preview
                </p>
                <div className="rounded-lg border border-border bg-white p-6 text-xs text-foreground min-h-[300px]">
                  <div className="mb-3 pb-2 border-b border-border/40">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Subject
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {formSubject.trim() || (
                        <span className="text-gray-400 font-normal">
                          (no subject yet)
                        </span>
                      )}
                    </p>
                  </div>
                  {formBody.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: formBody }} />
                  ) : (
                    <p className="text-gray-400">
                      Start typing the email body to see a live preview here.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !formSubject.trim() || (creating && !formName.trim())}
                className="btn-primary text-xs py-2 disabled:opacity-40"
              >
                {saving ? "Saving..." : creating ? "Create Template" : "Save Changes"}
              </button>
              <button onClick={cancelEdit} className="btn-secondary text-xs py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server-rendered Preview Modal (from table row action) */}
      {previewHtml !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewHtml(null);
          }}
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border-2 border-primary/40 bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Preview</h3>
              <button
                onClick={() => setPreviewHtml(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div
                className="rounded-lg border border-border bg-white p-6 text-xs text-foreground"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Templates Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No email templates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Subject</th>
                  <th className="py-2.5 pr-3">Active</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {templates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {tpl.name}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[300px] truncate">
                      {tpl.subject}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          tpl.isActive
                            ? "bg-success/15 text-success border-success/25"
                            : "bg-muted/15 text-muted-foreground border-muted/25"
                        }`}
                      >
                        {tpl.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tpl)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handlePreview(tpl)}
                          disabled={previewLoading}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                          title="Preview"
                        >
                          <IconEye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}