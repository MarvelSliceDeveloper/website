"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { usePageTitle } from "@/lib/use-page-title";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconUserCheck,
  IconCalendarPlus,
  IconBriefcase,
  IconSchool,
  IconCurrencyRupee,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";

type Intern = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: "WORKING" | "STUDYING" | null;
  internField: { id: string; name: string } | null;
  payments: { id: string; amount: number; status: string }[];
};

type InternField = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  isActive: boolean;
  order: number;
  _count: { interns: number };
};

type Tab = "interns" | "fields";

const tabs: { value: Tab; label: string }[] = [
  { value: "interns", label: "Interns" },
  { value: "fields", label: "Fields & Fees" },
];

const formatPrice = (amount: number) =>
  `₹${(amount / 100).toLocaleString("en-IN")}`;

const toCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCSV = (rows: Intern[], filename = "interns.csv") => {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Designation",
    "Field",
    "Payment Status",
    "Payment Amount",
  ];
  const lines = [
    headers.map(toCsvValue).join(","),
    ...rows.map((i) =>
      [
        i.name,
        i.email,
        i.phone ?? "",
        i.designation ?? "",
        i.internField?.name ?? "",
        i.payments[0]
          ? i.payments[0].status === "PAID"
            ? "Paid"
            : "Pending"
          : "",
        i.payments[0] ? formatPrice(i.payments[0].amount) : "",
      ]
        .map(toCsvValue)
        .join(","),
    ),
  ];
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default function AdminInternsPage() {
  usePageTitle("Interns");
  const [tab, setTab] = useState<Tab>("interns");

  // Interns tab
  const [interns, setInterns] = useState<Intern[]>([]);
  const [fieldOptions, setFieldOptions] = useState<InternField[]>([]);
  const [fieldFilter, setFieldFilter] = useState("");
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [search, setSearch] = useState("");

  // Fields tab
  const [fields, setFields] = useState<InternField[]>([]);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<InternField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    description: "",
    fee: "",
    isActive: true,
  });

  const fetchInterns = () => {
    setLoadingInterns(true);
    const params = new URLSearchParams();
    if (fieldFilter) params.set("fieldId", fieldFilter);
    api
      .get<{ items: Intern[] }>(
        `/api/admin/interns${params.toString() ? `?${params.toString()}` : ""}`,
      )
      .then((res) => setInterns(res.items ?? []))
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setInterns([]);
      })
      .finally(() => setLoadingInterns(false));
  };

  const fetchFields = () => {
    api
      .get<{ fields: InternField[] }>("/api/admin/interns/fields")
      .then((res) => {
        const fieldsData = res.fields ?? [];
        setFields(fieldsData);
        setFieldOptions(fieldsData);
      })
      .catch(() => setFields([]));
  };

  useEffect(() => {
    fetchInterns();
    fetchFields();
  }, [fieldFilter]);

  const openFieldModal = (field?: InternField) => {
    setEditingField(field ?? null);
    setFieldForm({
      name: field?.name ?? "",
      description: field?.description ?? "",
      fee: field ? String((field.fee ?? 0) / 100) : "",
      isActive: field?.isActive ?? true,
    });
    setShowFieldModal(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.name.trim()) {
      toast.error("Field name is required");
      return;
    }
    const feeRupees = fieldForm.fee.trim() === "" ? 0 : Number(fieldForm.fee);
    if (!Number.isFinite(feeRupees) || feeRupees < 0) {
      toast.error("Enter a valid fee in rupees");
      return;
    }
    const fee = Math.round(feeRupees * 100);
    setSavingFieldId(editingField?.id ?? "__new__");
    try {
      if (editingField) {
        await api.patch(`/api/admin/interns/fields/${editingField.id}`, {
          name: fieldForm.name.trim(),
          description: fieldForm.description || undefined,
          fee,
          isActive: fieldForm.isActive,
        });
        toast.success("Field updated");
      } else {
        await api.post("/api/admin/interns/fields", {
          name: fieldForm.name.trim(),
          description: fieldForm.description || undefined,
          fee,
          isActive: fieldForm.isActive,
        });
        toast.success("Field added");
      }
      setShowFieldModal(false);
      fetchFields();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleDeleteField = async (field: InternField) => {
    if (!window.confirm(`Delete field "${field.name}"?`)) return;
    try {
      await api.delete(`/api/admin/interns/fields/${field.id}`);
      toast.success("Field deleted");
      fetchFields();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredInterns = useMemo(
    () =>
      interns.filter((i) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          (i.phone || "").toLowerCase().includes(q) ||
          (i.internField?.name || "").toLowerCase().includes(q)
        );
      }),
    [interns, search],
  );

  const internColumns: DataTableColumn<Intern>[] = [
    {
      key: "name",
      label: "Intern",
      sortable: true,
      render: (_, intern) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600">
            {intern.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {intern.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {intern.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      render: (_, intern) =>
        intern.designation === "WORKING" ? (
          <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            <IconBriefcase size={12} /> Working
          </span>
        ) : intern.designation === "STUDYING" ? (
          <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
            <IconSchool size={12} /> Studying
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (_, intern) => (
        <span className="text-sm text-muted-foreground">
          {intern.phone || "—"}
        </span>
      ),
    },
    {
      key: "field",
      label: "Field",
      sortable: true,
      render: (_, intern) =>
        intern.internField ? (
          <span className="inline-flex items-center rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
            {intern.internField.name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (_, intern) => {
        const payment = intern.payments[0];
        if (!payment) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const paid = payment.status === "PAID";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
              paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            }`}
          >
            <IconCurrencyRupee size={12} />
            {paid ? "Paid" : "Pending"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Interns"
        description="Manage intern applications, internship fields, and per-field internship fees."
        breadcrumbs={[{ label: "Interns", href: "/admin/interns" }]}
        action={
          <Link
            href="/admin/interns/schedule"
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <IconCalendarPlus size={16} stroke={1.5} />
            Schedule Class
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              tab === t.value
                ? "bg-primary text-white border-primary"
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "interns" && (
        <>
          {/* Field filter */}
          {fieldOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFieldFilter("")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  fieldFilter === ""
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-card-hover"
                }`}
              >
                All Fields
              </button>
              {fieldOptions
                .filter((f) => f.isActive)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      setFieldFilter(fieldFilter === f.id ? "" : f.id)
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      fieldFilter === f.id
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:bg-card-hover"
                    }`}
                  >
                    {f.name} · {f._count.interns}
                  </button>
                ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <SearchInput
              placeholder="Search by name, email, phone, or field..."
              value={search}
              onChange={setSearch}
            />
            <button
              onClick={() => downloadCSV(filteredInterns)}
              disabled={filteredInterns.length === 0}
              className="btn-secondary text-xs flex items-center gap-1.5 whitespace-nowrap"
              title="Download visible interns as CSV"
            >
              <IconDownload size={13} /> Export CSV
            </button>
          </div>

          <DataTable
            columns={internColumns}
            data={filteredInterns}
            loading={loadingInterns}
            showSerialNumber
            pageSize={10}
            emptyState={
              <EmptyState
                variant="glass"
                icon={IconUserCheck}
                title="No interns found"
                description="Interns appear here after they apply and pay the internship fee from the catalogue."
              />
            }
          />
        </>
      )}

      {tab === "fields" && (
        <div className="glass-card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Internship Fields & Fees
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Each field has its own internship fee charged to applicants (Web
                Development, Backend, Cybersecurity, UI/UX, ...). Inactive
                fields are hidden from new applicants.
              </p>
            </div>
            <button
              onClick={() => openFieldModal()}
              className="btn-primary text-xs flex items-center gap-1"
            >
              <IconPlus size={14} /> Add Field
            </button>
          </div>

          {fields.length === 0 ? (
            <EmptyState
              variant="glass"
              icon={IconUserCheck}
              title="No fields yet"
              description="Add internship fields that applicants can choose from."
            />
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {field.name}
                      </p>
                      {!field.isActive && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {field._count.interns} intern(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {field.fee > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2.5 py-1 text-sm font-semibold text-success">
                        <IconCurrencyRupee size={14} />
                        {formatPrice(field.fee)}
                      </span>
                    ) : (
                      <span className="rounded bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
                        No fee set
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openFieldModal(field)}
                        className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                        title="Edit field"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field)}
                        className="rounded-md border border-danger/20 p-2 text-danger hover:bg-danger/10 transition-colors"
                        title="Delete field"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showFieldModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                <h3 className="text-base font-semibold text-foreground">
                  {editingField ? "Edit Field" : "Add Field"}
                </h3>
                <form onSubmit={handleSaveField} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={fieldForm.name}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, name: e.target.value })
                      }
                      className="field w-full text-sm"
                      placeholder="e.g. Web Development"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Internship Fee (₹){" "}
                      <span className="text-muted-foreground">
                        — charged per applicant
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={fieldForm.fee}
                        onChange={(e) =>
                          setFieldForm({ ...fieldForm, fee: e.target.value })
                        }
                        className="field w-full text-sm"
                        placeholder="e.g. 2999"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Leave 0 to keep applications for this field closed.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Description
                    </label>
                    <textarea
                      value={fieldForm.description}
                      onChange={(e) =>
                        setFieldForm({
                          ...fieldForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="field w-full text-sm"
                      placeholder="Short description shown to applicants"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={fieldForm.isActive}
                      onChange={(e) =>
                        setFieldForm({
                          ...fieldForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="accent-primary"
                    />
                    Active (visible on application form)
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFieldModal(false)}
                      className="btn-secondary text-xs px-3 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingFieldId !== null}
                      className="btn-primary text-xs px-3 py-2"
                    >
                      {savingFieldId !== null ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
