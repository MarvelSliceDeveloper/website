"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconLogout2,
  IconUserPlus,
  IconChevronRight,
  IconBriefcase,
  IconMapPin,
  IconBuildingBank,
  IconSend,
  IconEdit,
  IconCheck,
  IconPhoto,
  IconFileUpload,
  IconX,
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

// Fields instructors MUST provide during onboarding (marked with * and
// validated on submit). Mobile, address and bank/payout details are required
// for contact, compliance and earnings payouts.
const REQUIRED_FIELDS = [
  "phone",
  "address",
  "city",
  "state",
  "country",
  "bio",
  "bankName",
  "bankAccountNumber",
  "bankIfscCode",
  "bankAccountHolderName",
] as const;

type FieldKey = keyof ProfileFormData;

const inputBase =
  "w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover";

function inputCls(errors: Record<string, string>, key: string) {
  return `${inputBase} ${
    errors[key]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : ""
  }`;
}

export default function InstructorOnboardingPage() {
  usePageTitle("Instructor Onboarding");
  const router = useRouter();

  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>("loading");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResume, setExistingResume] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
          photoUrl?: string;
          resumeUrl?: string;
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
      if (p?.photoUrl) setPhotoPreview(p.photoUrl);
      setExistingResume(Boolean(p?.resumeUrl));
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

  async function uploadFile(file: File, field: string): Promise<string> {
    const formData = new FormData();
    formData.append(field, file);
    const res = await api.post<{ photoUrl?: string; resumeUrl?: string }>(
      "/api/instructor/profile/upload",
      formData,
    );
    return res[field === "photo" ? "photoUrl" : "resumeUrl"] ?? "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const newErrors: Record<string, string> = {};
    for (const key of REQUIRED_FIELDS) {
      if (!String(form[key] ?? "").trim()) {
        newErrors[key] = "Required";
      }
    }
    if (!photoFile && !photoPreview) {
      newErrors.photo = "Required";
    }
    if (!resumeFile && !existingResume) {
      newErrors.resume = "Required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    setErrors({});

    try {
      let photoUrl = "";
      let resumeUrl = "";

      if (photoFile) {
        setUploadingFiles(true);
        photoUrl = await uploadFile(photoFile, "photo");
      }
      if (resumeFile) {
        setUploadingFiles(true);
        resumeUrl = await uploadFile(resumeFile, "resume");
      }

      const body: Record<string, unknown> = {
        bio: form.bio || undefined,
        designation: form.designation || undefined,
        qualification: form.qualification || undefined,
        experienceYears: form.experienceYears || undefined,
        skills: form.skills
          ? form.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
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
          ? form.languages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
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
        ...(photoUrl && { photoUrl }),
        ...(resumeUrl && { resumeUrl }),
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
      setUploadingFiles(false);
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
                      ? "border-2 border-primary bg-primary text-white shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
                      : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <IconCheck size={16} /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  i <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mt-[-1.25rem] h-px w-16 sm:w-24 ${
                  i < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPendingState = () => (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <button
        onClick={handleLogout}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
      >
        <IconLogout2 size={14} />
        Logout
      </button>
      <div className="w-full max-w-lg">
        {renderStepIndicator()}
        <div
          className="mt-10"
          style={{
            animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
                <IconClockHour4 size={40} className="text-amber-500" />
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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <button
        onClick={handleLogout}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
      >
        <IconLogout2 size={14} />
        Logout
      </button>
      <div className="w-full max-w-lg">
        {renderStepIndicator()}
        <div
          className="mt-10"
          style={{
            animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
                  <IconCircleX size={40} className="text-danger" />
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

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/login");
  }

  const renderForm = () => (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          {renderStepIndicator()}
          <button
            onClick={handleLogout}
            className="absolute right-0 top-0 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
          >
            <IconLogout2 size={14} />
            Logout
          </button>
        </div>

        <div
          className="mt-10"
          style={{
            animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
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
            {/* Profile Photo & Resume */}
            <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
              <div className="rounded-[14px] bg-card px-6 py-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <IconPhoto size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Profile Photo & Resume
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload your photo and CV
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Photo */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Profile Photo
                      <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="h-28 w-28 rounded-xl object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow"
                        >
                          <IconX size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/5 transition-all hover:border-primary/50 hover:bg-primary/5">
                        <IconPhoto
                          size={24}
                          className="text-muted-foreground"
                        />
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          Upload
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("Photo must be less than 5 MB");
                                return;
                              }
                              setPhotoFile(file);
                              setPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.photo && (
                    <p className="mt-1 text-xs text-red-500">{errors.photo}</p>
                  )}

                  {/* Resume */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Resume / CV<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    {resumeFile ? (
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/5 px-4 py-3">
                        <IconFileUpload size={20} className="text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {resumeFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(resumeFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResumeFile(null)}
                          className="text-muted-foreground hover:text-danger"
                        >
                          <IconX size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/5 transition-all hover:border-primary/50 hover:bg-primary/5">
                        <IconFileUpload
                          size={24}
                          className="text-muted-foreground"
                        />
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          Upload
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error("Resume must be less than 10 MB");
                                return;
                              }
                              setResumeFile(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.resume && (
                    <p className="mt-1 text-xs text-red-500">{errors.resume}</p>
                  )}
                </div>
              </div>
            </div>

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
                      Bio<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      rows={3}
                      className={inputCls(errors, "bio")}
                      placeholder="Tell us about yourself..."
                    />
                    {errors.bio && (
                      <p className="mt-1 text-xs text-red-500">{errors.bio}</p>
                    )}
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
                        onChange={(e) => update("companyName", e.target.value)}
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
                      Mobile Number
                      <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={inputCls(errors, "phone")}
                      placeholder="+1 234 567 890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone}
                      </p>
                    )}
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
                      Address<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      rows={2}
                      className={inputCls(errors, "address")}
                      placeholder="Street address"
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      City<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className={inputCls(errors, "city")}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      State<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      className={inputCls(errors, "state")}
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Country<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className={inputCls(errors, "country")}
                      placeholder="Country"
                    />
                    {errors.country && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.country}
                      </p>
                    )}
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
                      Bank Name<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                      className={inputCls(errors, "bankName")}
                      placeholder="Bank name"
                    />
                    {errors.bankName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.bankName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Bank Account Number
                      <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountNumber}
                      onChange={(e) =>
                        update("bankAccountNumber", e.target.value)
                      }
                      className={inputCls(errors, "bankAccountNumber")}
                      placeholder="Account number"
                    />
                    {errors.bankAccountNumber && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.bankAccountNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      IFSC Code<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bankIfscCode}
                      onChange={(e) => update("bankIfscCode", e.target.value)}
                      className={inputCls(errors, "bankIfscCode")}
                      placeholder="IFSC code"
                    />
                    {errors.bankIfscCode && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.bankIfscCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Account Holder Name
                      <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountHolderName}
                      onChange={(e) =>
                        update("bankAccountHolderName", e.target.value)
                      }
                      className={inputCls(errors, "bankAccountHolderName")}
                      placeholder="Name on bank account"
                    />
                    {errors.bankAccountHolderName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.bankAccountHolderName}
                      </p>
                    )}
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
                disabled={submitting || uploadingFiles}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <IconSend size={18} />
                <span>
                  {uploadingFiles
                    ? "Uploading files..."
                    : submitting
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
