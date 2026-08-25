"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconCopy, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

type FormState = {
  name: string;
  email: string;
  password: string;
};

function FieldInput({
  label,
  value,
  onChange,
  error,
  attempted,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  attempted: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field w-full"
      />
      {attempted && error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export default function CreateInstructorPage() {
  usePageTitle("Add Instructor");
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  const [created, setCreated] = useState<{
    id: string;
    email: string;
    generatedPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Invalid email format";
    if (form.password) {
      if (form.password.length < 8) e.password = "At least 8 characters";
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        e.password = "Must include upper, lower and a number";
    }
    return e;
  }, [form]);

  const isValid = !errors.name && !errors.email && !errors.password;

  function buildPayload() {
    return {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    };
  }

  const createInstructorMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      api.post<{ id: string; generatedPassword?: string }>(
        "/api/admin/instructors",
        payload,
      ),
    onSuccess: (result) => {
      const gp = (result as { generatedPassword?: string }).generatedPassword;
      if (gp) {
        setCreated({
          id: result.id,
          email: form.email.trim(),
          generatedPassword: gp,
        });
        toast.success(
          "Instructor created — copy the auto-generated password now (shown once).",
        );
      } else {
        toast.success(
          "Instructor created — one-time password emailed. They will set their own on first login.",
        );
        router.push(`/admin/instructors/${result.id}`);
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — please select and copy manually");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError ?? "Please fix the highlighted fields");
      return;
    }

    createInstructorMutation.mutate(buildPayload());
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Add Instructor"
        description="Create a new instructor account with a one-time password. The instructor sets their own password on first login and completes the rest of the profile during onboarding."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Instructors", href: "/admin/instructors" },
          { label: "New", href: "/admin/instructors/new" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <CardSection
          title="Account Info"
          description="Only these three fields are needed. Everything else (designation, address, bank, etc.) is filled by the instructor during onboarding."
        >
          <FieldInput
            label="Name"
            value={form.name}
            onChange={(v) => update("name", v)}
            error={errors.name}
            attempted={attempted}
            placeholder="John Doe"
            required
          />
          <FieldInput
            label="Email"
            value={form.email}
            onChange={(v) => update("email", v)}
            error={errors.email}
            attempted={attempted}
            type="email"
            placeholder="john@example.com"
            required
          />
          <FieldInput
            label="One-time password"
            value={form.password}
            onChange={(v) => update("password", v)}
            error={errors.password}
            attempted={attempted}
            type="password"
            placeholder="Leave empty to auto-generate"
          />
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">
              One-time password for first login. Leave empty to auto-generate —
              it will be emailed to the instructor. They must set their own
              password on first login via{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                /set-password
              </code>{" "}
              before onboarding.
            </p>
          </div>
        </CardSection>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/instructors")}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={createInstructorMutation.isPending}
          >
            {createInstructorMutation.isPending
              ? "Creating..."
              : "Create Instructor"}
          </button>
        </div>
      </form>

      {created?.generatedPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Instructor credentials"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500/15 p-2 text-amber-600">
                <IconAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Instructor created — copy password now
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  This auto-generated password is shown{" "}
                  <span className="font-semibold text-foreground">once</span>{" "}
                  and is also emailed. Copy it now if you need to share it.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background px-3 py-2 text-sm font-mono text-foreground border border-border">
                    {created.email}
                  </code>
                  <button
                    onClick={() => void copyText(created.email)}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    {copied ? (
                      <IconCheck size={16} className="text-success" />
                    ) : (
                      <IconCopy size={16} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  One-time password
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono font-bold tracking-wider text-foreground border border-border break-all">
                    {created.generatedPassword}
                  </code>
                  <button
                    onClick={() => void copyText(created.generatedPassword!)}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                    title="Copy password"
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <IconCheck size={16} className="text-success" />
                    ) : (
                      <IconCopy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  void copyText(
                    `Email: ${created.email}\nPassword: ${created.generatedPassword}`,
                  )
                }
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconCopy size={14} /> Copy both
              </button>
              <button
                onClick={() => void copyText(created.generatedPassword!)}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />} Copy
                password
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => router.push(`/admin/instructors/${created.id}`)}
                className="btn-primary text-sm"
              >
                Done — view instructor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
