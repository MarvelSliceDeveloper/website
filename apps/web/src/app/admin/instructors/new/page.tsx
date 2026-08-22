"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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
      api.post<{ id: string; generatedPassword?: string }>("/api/admin/instructors", payload),
    onSuccess: (result) => {
      if ((result as { generatedPassword?: string }).generatedPassword) {
        toast.success(`Instructor created — auto-generated password emailed. Temp: ${(result as { generatedPassword?: string }).generatedPassword}`);
      } else {
        toast.success("Instructor created — one-time password emailed. They will set their own on first login.");
      }
      router.push(`/admin/instructors/${result.id}`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

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
              One-time password for first login. Leave empty to auto-generate — it will be emailed to the instructor. They must set their own password on first login via <code className="rounded bg-muted px-1 py-0.5 text-foreground">/set-password</code> before onboarding.
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
    </div>
  );
}
