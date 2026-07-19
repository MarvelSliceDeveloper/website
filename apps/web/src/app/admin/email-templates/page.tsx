"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconMail,
  IconEdit,
  IconRefresh,
  IconEye,
  IconX,
} from "@tabler/icons-react";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
};

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  function openEdit(tpl: EmailTemplate) {
    setEditing(tpl);
    setFormSubject(tpl.subject);
    setFormBody(tpl.body);
    setFormActive(tpl.isActive);
  }

  function cancelEdit() {
    setEditing(null);
    setFormSubject("");
    setFormBody("");
    setFormActive(true);
  }

  async function handleSave() {
    if (!editing) return;
    if (!formSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/admin/email-templates/${editing.id}`, {
        subject: formSubject.trim(),
        body: formBody,
        isActive: formActive,
      });
      toast.success("Template updated");
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconMail size={28} className="text-primary-hover" />
            Email Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage email templates for automated notifications.
          </p>
        </div>
        <button
          onClick={fetchTemplates}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Editor Panel */}
      {editing && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              Edit: {editing.name}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          </div>
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
            className="input text-xs w-full min-h-[300px] font-mono"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-foreground">Active</span>
            </label>
            <button
              onClick={handleSave}
              disabled={saving || !formSubject.trim()}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={cancelEdit} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {previewHtml !== null && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Preview</h3>
            <button
              onClick={() => setPreviewHtml(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          </div>
          <div
            className="rounded-lg border border-border bg-white p-6 text-xs text-foreground max-h-[500px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
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
