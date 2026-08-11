"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type FormState = {
  designation: string;
  qualification: string;
  experienceYears: string;
  skills: string;
  currentlyEmployed: boolean;
  companyName: string;
  availableTime: string;
  phone: string;
  bio: string;
  address: string;
  city: string;
  state: string;
  country: string;
  languages: string;
  linkedin: string;
  github: string;
  portfolio: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  upiId: string;
};

interface InstructorProfileData {
  designation: string | null;
  qualification: string | null;
  experienceYears: number | null;
  skills: string[] | null;
  currentlyEmployed: boolean;
  companyName: string | null;
  availableTime: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languages: string[] | null;
  socialLinks: { linkedin?: string; github?: string; portfolio?: string } | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankAccountHolderName: string | null;
  upiId: string | null;
}

interface InstructorResponse {
  id: string;
  instructorProfile: InstructorProfileData | null;
}

export default function EditInstructorPage() {
  usePageTitle("Edit Instructor");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [form, setForm] = useState<FormState>({
    designation: "",
    qualification: "",
    experienceYears: "",
    skills: "",
    currentlyEmployed: false,
    companyName: "",
    availableTime: "",
    phone: "",
    bio: "",
    address: "",
    city: "",
    state: "",
    country: "",
    languages: "",
    linkedin: "",
    github: "",
    portfolio: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    upiId: "",
  });

  useEffect(() => {
    async function fetchInstructor() {
      try {
        const data = await api.get<InstructorResponse>(
          `/api/admin/instructors/${params.id}`,
        );
        const p = data.instructorProfile ?? ({} as InstructorProfileData);
        const toCsv = (v: unknown) =>
          Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
        setForm({
          designation: p.designation ?? "",
          qualification: p.qualification ?? "",
          experienceYears: p.experienceYears?.toString() ?? "",
          skills: toCsv(p.skills),
          currentlyEmployed: p.currentlyEmployed ?? false,
          companyName: p.companyName ?? "",
          availableTime: p.availableTime ?? "",
          phone: p.phone ?? "",
          bio: p.bio ?? "",
          address: p.address ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
          country: p.country ?? "",
          languages: toCsv(p.languages),
          linkedin: p.socialLinks?.linkedin ?? "",
          github: p.socialLinks?.github ?? "",
          portfolio: p.socialLinks?.portfolio ?? "",
          bankName: p.bankName ?? "",
          bankAccountNumber: p.bankAccountNumber ?? "",
          bankIfscCode: p.bankIfscCode ?? "",
          bankAccountHolderName: p.bankAccountHolderName ?? "",
          upiId: p.upiId ?? "",
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
        router.push("/admin/instructors");
      } finally {
        setLoading(false);
      }
    }
    fetchInstructor();
  }, [params.id, router]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (
      form.experienceYears &&
      (Number(form.experienceYears) < 0 || Number(form.experienceYears) > 70)
    )
      e.experienceYears = "Enter a valid number (0-70)";
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  function buildPayload() {
    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const languages = form.languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const socialLinks: Record<string, string> = {};
    if (form.linkedin.trim()) socialLinks.linkedin = form.linkedin.trim();
    if (form.github.trim()) socialLinks.github = form.github.trim();
    if (form.portfolio.trim()) socialLinks.portfolio = form.portfolio.trim();

    return {
      designation: form.designation.trim() || undefined,
      qualification: form.qualification.trim() || undefined,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      skills: skills.length ? skills : undefined,
      currentlyEmployed: form.currentlyEmployed || undefined,
      companyName: form.companyName.trim() || undefined,
      availableTime: form.availableTime.trim() || undefined,
      phone: form.phone.trim() || undefined,
      bio: form.bio.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      languages: languages.length ? languages : undefined,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
      bankName: form.bankName.trim() || undefined,
      bankAccountNumber: form.bankAccountNumber.trim() || undefined,
      bankIfscCode: form.bankIfscCode.trim() || undefined,
      bankAccountHolderName: form.bankAccountHolderName.trim() || undefined,
      upiId: form.upiId.trim() || undefined,
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError ?? "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/api/admin/instructors/${params.id}`, buildPayload());
      toast.success("Instructor updated successfully!");
      router.push(`/admin/instructors/${params.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (field: keyof FormState) =>
    attempted && errors[field] ? (
      <p className="mt-1 text-xs text-danger">{errors[field]}</p>
    ) : null;

  function Field({
    label,
    field,
    type = "text",
    placeholder,
    textarea,
  }: {
    label: string;
    field: keyof FormState;
    type?: string;
    placeholder?: string;
    textarea?: boolean;
  }) {
    const Comp = textarea ? "textarea" : "input";
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
        <Comp
          type={textarea ? undefined : type}
          rows={textarea ? 3 : undefined}
          value={form[field] as string}
          onChange={(e) => update(field, e.target.value as never)}
          placeholder={placeholder}
          className={`field w-full ${textarea ? "resize-none" : ""}`}
        />
        {showError(field)}
      </div>
    );
  }

  function TagField({
    label,
    field,
    placeholder,
  }: {
    label: string;
    field: keyof FormState;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
        <input
          type="text"
          value={form[field] as string}
          onChange={(e) => update(field, e.target.value as never)}
          placeholder={placeholder ?? "Comma-separated values"}
          className="field w-full"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Comma-separated values
        </p>
      </div>
    );
  }

  function CardSection({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
      </div>
    );
  }

  function CheckboxField({
    label,
    field,
  }: {
    label: string;
    field: keyof FormState;
  }) {
    return (
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={form[field] as boolean}
          onChange={(e) => update(field, e.target.checked as never)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        {label}
      </label>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading instructor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Edit Instructor"
        description="Update instructor profile details."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Instructors", href: "/admin/instructors" },
          { label: "Edit", href: `/admin/instructors/${params.id}/edit` },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <CardSection title="Professional Details">
          <Field
            label="Designation"
            field="designation"
            placeholder="e.g. Senior Software Engineer"
          />
          <Field
            label="Qualification"
            field="qualification"
            placeholder="e.g. M.Tech in Computer Science"
          />
          <Field
            label="Experience Years"
            field="experienceYears"
            type="number"
            placeholder="Years of experience"
          />
          <TagField
            label="Skills"
            field="skills"
            placeholder="React, Node.js, Python"
          />
          <div className="flex items-end">
            <CheckboxField
              label="Currently Employed"
              field="currentlyEmployed"
            />
          </div>
          <Field
            label="Company Name"
            field="companyName"
            placeholder="Current company"
          />
          <Field
            label="Available Time"
            field="availableTime"
            placeholder="e.g. 20 hrs/week"
          />
        </CardSection>

        <CardSection title="Contact & Address">
          <Field
            label="Phone"
            field="phone"
            type="tel"
            placeholder="+1 234 567 890"
          />
          <Field
            label="City"
            field="city"
            placeholder="City"
          />
          <Field
            label="State"
            field="state"
            placeholder="State"
          />
          <Field
            label="Country"
            field="country"
            placeholder="Country"
          />
          <div className="md:col-span-2">
            <Field
              label="Bio"
              field="bio"
              textarea
              placeholder="Brief biography"
            />
          </div>
          <div className="md:col-span-2">
            <Field
              label="Address"
              field="address"
              textarea
              placeholder="Full address"
            />
          </div>
        </CardSection>

        <CardSection title="Social Links">
          <Field
            label="LinkedIn"
            field="linkedin"
            placeholder="https://linkedin.com/in/username"
          />
          <Field
            label="GitHub"
            field="github"
            placeholder="https://github.com/username"
          />
          <Field
            label="Portfolio"
            field="portfolio"
            placeholder="https://portfolio.dev"
          />
          <div className="md:col-span-2">
            <TagField
              label="Languages"
              field="languages"
              placeholder="English, Hindi, Spanish"
            />
          </div>
        </CardSection>

        <CardSection title="Bank Details">
          <Field
            label="Bank Name"
            field="bankName"
            placeholder="e.g. State Bank of India"
          />
          <Field
            label="Account Number"
            field="bankAccountNumber"
            placeholder="Account number"
          />
          <Field
            label="IFSC Code"
            field="bankIfscCode"
            placeholder="e.g. SBIN0001234"
          />
          <Field
            label="Account Holder Name"
            field="bankAccountHolderName"
            placeholder="Name on bank account"
          />
          <Field
            label="UPI ID"
            field="upiId"
            placeholder="name@upi"
          />
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
            disabled={submitting || !isValid}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
