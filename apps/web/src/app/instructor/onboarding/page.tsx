"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconUserPlus,
  IconChevronRight,
  IconBriefcase,
  IconMapPin,
  IconBuildingBank,
  IconSend,
  IconEdit,
  IconCheck,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";

type OnboardingState =
  | "loading"
  | "no_profile"
  | "pending"
  | "rejected"
  | "completed";

interface ProfileFormData {
  bio: string;
  designation: string;
  qualification: string;
  experienceYears: number;
  skills: string;
  currentlyEmployed: boolean;
  companyName: string;
  availableTime: string;
  phone: string;
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
}

const defaultForm: ProfileFormData = {
  bio: "",
  designation: "",
  qualification: "",
  experienceYears: 0,
  skills: "",
  currentlyEmployed: false,
  companyName: "",
  availableTime: "",
  phone: "",
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
};

const STEPS = [
  { label: "Profile", key: "profile" },
  { label: "Verification", key: "verification" },
  { label: "Complete", key: "complete" },
];

export default function InstructorOnboardingPage() {
  usePageTitle("Instructor Onboarding");
  const router = useRouter();

  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>("loading");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status = await api.get<{
        profileComplete: boolean;
        status: string | null;
        rejectionReason: string | null;
        onboardingComplete: boolean;
      }>("/api/instructor/profile/status");

      if (status.onboardingComplete) {
        router.replace("/instructor/dashboard");
        return;
      }

      if (!status.profileComplete || status.status === null) {
        setOnboardingState("no_profile");
        return;
      }

      setRejectionReason(status.rejectionReason);

      if (status.status === "PENDING") {
        setOnboardingState("pending");
      } else if (status.status === "REJECTED") {
        setOnboardingState("rejected");
        await loadProfile();
      } else {
        setOnboardingState("completed");
        router.replace("/instructor/dashboard");
      }
    } catch {
      toast.error("Failed to check onboarding status");
    }
  }, [router]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get<{
        user: { name: string; email: string };
        profile: {
          bio?: string;
          designation?: string;
          qualification?: string;
          experienceYears?: number;
          skills?: string[];
          currentlyEmployed?: boolean;
          companyName?: string;
          availableTime?: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          country?: string;
          languages?: string[];
          socialLinks?: Record<string, string>;
          bankName?: string;
          bankAccountNumber?: string;
          bankIfscCode?: string;
          bankAccountHolderName?: string;
          upiId?: string;
        };
      }>("/api/instructor/profile");

      const p = res.profile;
      setForm({
        bio: p?.bio ?? "",
        designation: p?.designation ?? "",
        qualification: p?.qualification ?? "",
        experienceYears: p?.experienceYears ?? 0,
        skills: Array.isArray(p?.skills) ? p.skills.join(", ") : "",
        currentlyEmployed: p?.currentlyEmployed ?? false,
        companyName: p?.companyName ?? "",
        availableTime: p?.availableTime ?? "",
        phone: p?.phone ?? "",
        address: p?.address ?? "",
        city: p?.city ?? "",
        state: p?.state ?? "",
        country: p?.country ?? "",
        languages: Array.isArray(p?.languages) ? p.languages.join(", ") : "",
        linkedin: p?.socialLinks?.linkedin ?? "",
        github: p?.socialLinks?.github ?? "",
        portfolio: p?.socialLinks?.portfolio ?? "",
        bankName: p?.bankName ?? "",
        bankAccountNumber: p?.bankAccountNumber ?? "",
        bankIfscCode: p?.bankIfscCode ?? "",
        bankAccountHolderName: p?.bankAccountHolderName ?? "",
        upiId: p?.upiId ?? "",
      });
    } catch {
      toast.error("Failed to load profile");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  function update<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        bio: form.bio || undefined,
        designation: form.designation || undefined,
        qualification: form.qualification || undefined,
        experienceYears: form.experienceYears || undefined,
        skills: form.skills
          ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        currentlyEmployed: form.currentlyEmployed,
        companyName: form.companyName || undefined,
        availableTime: form.availableTime || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        languages: form.languages
          ? form.languages.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        socialLinks: {
          ...(form.linkedin && { linkedin: form.linkedin }),
          ...(form.github && { github: form.github }),
          ...(form.portfolio && { portfolio: form.portfolio }),
        },
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankIfscCode: form.bankIfscCode || undefined,
        bankAccountHolderName: form.bankAccountHolderName || undefined,
        upiId: form.upiId || undefined,
      };

      Object.keys(body).forEach((k) => {
        if (body[k] === undefined) delete body[k];
      });

      await api.put("/api/instructor/profile", body);
      toast.success("Profile submitted for verification");
      setSubmitted(true);
      setOnboardingState("pending");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (onboardingState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderStepIndicator = () => {
    const currentStep =
      onboardingState === "pending"
        ? 1
        : onboardingState === "rejected"
          ? 0
          : submitted
            ? 1
            : 0;

    return (
      <div className="mx-auto flex max-w-lg items-center justify-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  i < currentStep
                    ? "bg-primary text-white"
                    : i === currentStep
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <IconCheck size={16} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  i <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mt-[-1.25rem] h-px w-16 sm:w-24 ${
                  i < currentStep
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPendingState = () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {renderStepIndicator()}
        <div
          className="mt-10"
          style={{
            animation:
              "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
                <IconClockHour4
                  size={40}
                  className="text-amber-500"
                />
              </div>
              <h2 className="mt-6 text-xl font-bold text-foreground">
                Profile Under Review
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your profile has been submitted for verification. You will be
                able to access the instructor portal once approved.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                <span>Pending Approval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRejectedState = () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {renderStepIndicator()}
        <div
          className="mt-10"
          style={{
            animation:
              "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
                  <IconCircleX
                    size={40}
                    className="text-danger"
                  />
                </div>
                <h2 className="mt-6 text-xl font-bold text-foreground">
                  Profile Rejected
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your instructor profile was not approved. Please review the
                  reason below and resubmit.
                </p>
              </div>

              {rejectionReason && (
                <div className="mt-6 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                    Reason
                  </p>
                  <p className="mt-1.5 text-sm text-foreground">
                    {rejectionReason}
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={() => setOnboardingState("no_profile")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <IconEdit size={18} />
                  Edit & Resubmit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {renderStepIndicator()}

        <div
          className="mt-10"
          style={{
            animation:
              "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="mb-6 text-center">
            <h2 className="text-[22px] font-bold text-foreground">
              Complete Your Instructor Profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in your details to get started as an instructor
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Professional Info */}
            <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
              <div className="rounded-[14px] bg-card px-6 py-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <IconBriefcase size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Professional Info
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your teaching qualifications and experience
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => update("designation", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) => update("qualification", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="e.g. M.Sc. Computer Science"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.experienceYears}
                      onChange={(e) =>
                        update("experienceYears", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="e.g. 5"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Skills
                    </label>
                    <input
                      type="text"
                      value={form.skills}
                      onChange={(e) => update("skills", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="React, Node.js, Python (comma-separated)"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Available Time
                    </label>
                    <input
                      type="text"
                      value={form.availableTime}
                      onChange={(e) => update("availableTime", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="e.g. 20 hrs/week, Weekends"
                    />
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="currentlyEmployed"
                      checked={form.currentlyEmployed}
                      onChange={(e) =>
                        update("currentlyEmployed", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <label
                      htmlFor="currentlyEmployed"
                      className="text-sm text-foreground"
                    >
                      Currently Employed
                    </label>
                  </div>

                  {form.currentlyEmployed && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-foreground">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) =>
                          update("companyName", e.target.value)
                        }
                        className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                        placeholder="Current employer"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Languages
                    </label>
                    <input
                      type="text"
                      value={form.languages}
                      onChange={(e) => update("languages", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="English, Hindi, Spanish (comma-separated)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
              <div className="rounded-[14px] bg-card px-6 py-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <IconMapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Contact Details
                    </p>
                    <p className="text-xs text-muted-foreground">
                      How to reach you
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="+1 234 567 890"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={form.github}
                      onChange={(e) => update("github", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={form.portfolio}
                      onChange={(e) => update("portfolio", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="https://your-portfolio.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Country
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
              <div className="rounded-[14px] bg-card px-6 py-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <IconBuildingBank size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Bank Information
                    </p>
                    <p className="text-xs text-muted-foreground">
                      For payouts and earnings
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Bank name"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountNumber}
                      onChange={(e) =>
                        update("bankAccountNumber", e.target.value)
                      }
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Account number"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={form.bankIfscCode}
                      onChange={(e) => update("bankIfscCode", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="IFSC code"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountHolderName}
                      onChange={(e) =>
                        update("bankAccountHolderName", e.target.value)
                      }
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="Name on bank account"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={form.upiId}
                      onChange={(e) => update("upiId", e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                      placeholder="upi@bank"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-center pb-8">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <IconSend size={18} />
                <span>
                  {submitting
                    ? onboardingState === "rejected"
                      ? "Resubmitting..."
                      : "Submitting..."
                    : onboardingState === "rejected"
                      ? "Resubmit Profile"
                      : "Submit for Verification"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (onboardingState === "pending") return renderPendingState();
  if (onboardingState === "rejected") return renderRejectedState();

  return renderForm();
}
