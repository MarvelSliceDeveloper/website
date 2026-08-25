"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCalendarEvent,
  IconCheck,
  IconHeadset,
  IconLicense,
  IconPlayerPlay,
  IconRocket,
  IconSchool,
  IconSparkles,
  IconTarget,
  IconTrophy,
  IconPhone,
  IconMapPin,
  IconClockHour4,
  IconBuildingSkyscraper,
  IconFlag,
  IconSearch,
  IconChevronDown,
} from "@tabler/icons-react";
import { TIMEZONE_GROUPS, COUNTRIES } from "@/lib/location-data";

interface ProfileData {
  phone: string;
  timezone: string;
  address: string;
  state: string;
  country: string;
}

interface OnboardingWizardViewProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome", title: "Welcome to Marvel Slice" },
  { id: "tour", label: "Features", title: "Explore Your Tools" },
  { id: "profile", label: "Profile", title: "Complete Your Profile" },
  { id: "done", label: "All Set!", title: "Ready to Begin" },
] as const;

const FEATURES = [
  {
    icon: IconBook,
    title: "My Enrolled Courses",
    desc: "Access your active modules, structured video lessons, assignments, and quizzes.",
    badge: "Core Learning",
    color: "text-indigo-600 dark:text-indigo-300",
    iconBorder: "border-indigo-400/30",
    gradient: "from-indigo-500/8 via-indigo-500/3 to-indigo-500/12",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
  },
  {
    icon: IconPlayerPlay,
    title: "Live Interactive Classes",
    desc: "Join real-time sessions with expert instructors, ask questions, and collaborate.",
    badge: "Real-time",
    color: "text-emerald-600 dark:text-emerald-300",
    iconBorder: "border-emerald-400/30",
    gradient: "from-emerald-500/8 via-emerald-500/3 to-emerald-500/12",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    icon: IconCalendarEvent,
    title: "Interactive Calendar",
    desc: "Keep track of session schedules, project deadlines, and live event reminders.",
    badge: "Schedule",
    color: "text-amber-600 dark:text-amber-300",
    iconBorder: "border-amber-400/30",
    gradient: "from-amber-500/8 via-amber-500/3 to-amber-500/12",
    border: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: IconSchool,
    title: "1-on-1 Mentorship",
    desc: "Book direct mentorship sessions with your instructor for guidance & code reviews.",
    badge: "Personalized",
    color: "text-violet-600 dark:text-violet-300",
    iconBorder: "border-violet-400/30",
    gradient: "from-violet-500/8 via-violet-500/3 to-violet-500/12",
    border: "border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: IconLicense,
    title: "Verified Certificates",
    desc: "Earn shareable course completion certificates to highlight on your resume & LinkedIn.",
    badge: "Credentials",
    color: "text-sky-600 dark:text-sky-300",
    iconBorder: "border-sky-400/30",
    gradient: "from-sky-500/8 via-sky-500/3 to-sky-500/12",
    border: "border-sky-500/20 hover:border-sky-500/40",
  },
  {
    icon: IconHeadset,
    title: "Dedicated Support",
    desc: "Need assistance? Raise support tickets or message your instructors anytime.",
    badge: "24/7 Support",
    color: "text-rose-600 dark:text-rose-300",
    iconBorder: "border-rose-400/30",
    gradient: "from-rose-500/8 via-rose-500/3 to-rose-500/12",
    border: "border-rose-500/20 hover:border-rose-500/40",
  },
];

const DEFAULT_PROFILE: ProfileData = {
  phone: "",
  timezone: "Asia/Kolkata",
  address: "",
  state: "",
  country: "India",
};

const REQUIRED_FIELDS: Record<keyof ProfileData, string> = {
  phone: "Phone Number",
  timezone: "Time Zone",
  address: "Address",
  state: "State",
  country: "Country",
};

export default function OnboardingWizardView({
  onComplete,
}: OnboardingWizardViewProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileData, string>>
  >({});
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validateProfile() {
    const nextErrors: Partial<Record<keyof ProfileData, string>> = {};
    (Object.keys(REQUIRED_FIELDS) as (keyof ProfileData)[]).forEach((key) => {
      if (!profile[key].trim()) {
        nextErrors[key] = `${REQUIRED_FIELDS[key]} is required`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleNext() {
    if (step === 2 && !validateProfile()) {
      toast.error("Please fill in all required fields to continue.");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setErrors({});
    } else {
      setSubmitting(true);
      try {
        await api.patch("/api/onboarding/complete", profile);
        onComplete();
      } catch {
        toast.error("Failed to save profile. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleSkip() {
    setStep(2);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-4 py-8">
      {/* Outer Card Wrapper */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all duration-300">
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        {/* Step indicators */}
        <div className="relative z-10 mb-10 flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300 ${
                      i < step
                        ? "bg-primary text-white shadow-md shadow-primary/20 cursor-pointer hover:scale-105"
                        : i === step
                          ? "bg-gradient-to-tr from-primary to-primary-hover text-white ring-4 ring-primary/25 shadow-lg scale-105"
                          : "bg-muted/15 border border-border text-muted-foreground"
                    }`}
                  >
                    {i < step ? <IconCheck size={18} stroke={3} /> : i + 1}
                  </button>
                  <span
                    className={`text-[11px] font-bold tracking-tight hidden sm:block ${
                      i === step
                        ? "text-primary"
                        : i < step
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div
                    className={`h-1 w-12 sm:w-20 rounded-full transition-all duration-500 -mt-4 sm:mt-0 ${
                      i < step
                        ? "bg-gradient-to-r from-primary to-primary-hover"
                        : "bg-border/60"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content with animated entrance */}
        <div className="relative z-10 min-h-[500px] w-full sp-view-enter">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <FeatureTourStep />}
          {step === 2 && (
            <ProfileStep profile={profile} update={update} errors={errors} />
          )}
          {step === 3 && <AllSetStep />}
        </div>

        {/* Actions Bar */}
        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-border/60 pt-6">
          <div>
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-card-hover hover:border-border-hover"
              >
                <IconArrowLeft size={16} />
                Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip intro
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hidden sm:block"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary px-7 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : step === STEPS.length - 1 ? (
                <>
                  Get Started <IconRocket size={16} className="ml-1" />
                </>
              ) : (
                <>
                  Continue <IconArrowRight size={16} className="ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon Badge */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-hover via-primary to-primary-hover text-white shadow-xl shadow-primary/25">
          <IconSparkles size={48} stroke={1.5} />
        </div>
      </div>

      <h1 className="mb-3 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Welcome to your{" "}
        <span className="bg-gradient-to-r from-primary-hover via-primary to-primary-hover bg-clip-text text-transparent">
          Learning Portal!
        </span>
      </h1>

      <p className="mx-auto max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground">
        We&apos;re thrilled to have you here. This portal is your all-in-one hub
        designed to help you master new skills, complete structured modules, and
        achieve your career goals.
      </p>

      {/* Highlight Pills */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 w-full max-w-xl">
        <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-3 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <IconBook size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Structured</p>
            <p className="text-[11px] text-muted-foreground">Course Modules</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <IconTarget size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Interactive</p>
            <p className="text-[11px] text-muted-foreground">Live Sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <IconTrophy size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Verified</p>
            <p className="text-[11px] text-muted-foreground">Certifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureTourStep() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Explore Your Dashboard Tools
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Here are the core features built to accelerate your learning journey:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`group flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-br ${f.gradient} ${f.border}`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm ${f.iconBorder}`}
            >
              <f.icon size={20} className={f.color} stroke={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {f.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${f.iconBorder} ${f.color}`}
                >
                  {f.badge}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllSetStep() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Success Animated Badge */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/25">
          <IconCheck size={48} stroke={3} />
        </div>
      </div>

      <h1 className="mb-2 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        You&apos;re All Set &amp; Ready!
      </h1>

      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
        Your learning dashboard is prepared. Dive in to start your enrolled
        courses, stay updated on live sessions, and track your progress.
      </p>

      {/* Action Checklist Box */}
      <div className="mt-6 w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
          <IconSparkles size={15} /> Next steps for success:
        </p>
        <ul className="space-y-2.5 text-xs text-foreground">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              1
            </span>
            <span>
              Launch active courses from the{" "}
              <strong>&quot;My Courses&quot;</strong> tab
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              2
            </span>
            <span>
              Check live class schedules under{" "}
              <strong>&quot;My Sessions&quot;</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              3
            </span>
            <span>
              Submit assignments &amp; quizzes on time to earn credentials
            </span>
          </li>
        </ul>
      </div>

      <p className="mx-auto mt-5 max-w-md text-[11px] text-muted-foreground">
        By continuing, you agree to our{" "}
        <a
          href="/pages/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Terms &amp; Conditions
        </a>{" "}
        and{" "}
        <a
          href="/pages/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  icon,
  groups,
}: {
  value: string;
  onChange: (val: string) => void;
  options?: { label: string; value: string }[];
  placeholder: string;
  searchPlaceholder?: string;
  icon: React.ReactNode;
  groups?: { region: string; zones: { label: string; value: string }[] }[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        zones: g.zones.filter(
          (z) =>
            z.label.toLowerCase().includes(q) ||
            z.value.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.zones.length > 0);
  }, [groups, search]);

  const filteredOptions = useMemo(() => {
    if (!options) return [];
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  const selectedLabel = groups
    ? groups.flatMap((g) => g.zones).find((z) => z.value === value)?.label
    : options?.find((o) => o.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm text-left transition-all ${
          open
            ? "border-primary ring-4 ring-primary/20 bg-card"
            : "border-border bg-muted/5 hover:border-border-hover"
        } ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
        <IconChevronDown
          size={15}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="relative border-b border-border">
            <IconSearch
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder || "Search..."}
              className="w-full bg-transparent pl-9 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted/10 transition-colors"
            >
              {placeholder}
            </button>
            {groups
              ? filteredGroups.map((g) => (
                  <div key={g.region}>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/5 sticky top-0">
                      {g.region}
                    </p>
                    {g.zones.map((z) => (
                      <button
                        key={z.value}
                        type="button"
                        onClick={() => {
                          onChange(z.value);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-primary/10 ${
                          value === z.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground"
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                ))
              : filteredOptions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-primary/10 ${
                      value === o.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileStep({
  profile,
  update,
  errors,
}: {
  profile: ProfileData;
  update: (key: keyof ProfileData, value: string) => void;
  errors: Partial<Record<keyof ProfileData, string>>;
}) {
  const selectedCountry = COUNTRIES.find((c) => c.name === profile.country);
  const states = selectedCountry?.states || [];

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Complete Your Profile
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Add your contact details so we can keep in touch
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IconPhone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
              />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={`w-full rounded-xl border bg-muted/5 pl-9 pr-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-primary/20 ${
                  errors.phone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-border focus:border-primary"
                }`}
                placeholder="+1 234 567 890"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Time Zone <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={profile.timezone}
              onChange={(val) => update("timezone", val)}
              groups={TIMEZONE_GROUPS}
              placeholder="Select time zone"
              searchPlaceholder="Search time zones..."
              icon={<IconClockHour4 size={16} />}
            />
            {errors.timezone && (
              <p className="mt-1 text-xs text-red-500">{errors.timezone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IconMapPin
              size={16}
              className="absolute left-3 top-3 text-muted-foreground z-10"
            />
            <textarea
              value={profile.address}
              onChange={(e) => update("address", e.target.value)}
              rows={2}
              className={`w-full rounded-xl border bg-muted/5 pl-9 pr-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-primary/20 ${
                errors.address
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border focus:border-primary"
              }`}
              placeholder="Street address"
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-xs text-red-500">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Country <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={profile.country}
              onChange={(val) => {
                update("country", val);
                update("state", "");
              }}
              options={COUNTRIES.map((c) => ({ label: c.name, value: c.name }))}
              placeholder="Select country"
              searchPlaceholder="Search countries..."
              icon={<IconFlag size={16} />}
            />
            {errors.country && (
              <p className="mt-1 text-xs text-red-500">{errors.country}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              State <span className="text-red-500">*</span>
            </label>
            {states.length > 0 ? (
              <SearchableSelect
                value={profile.state}
                onChange={(val) => update("state", val)}
                options={states.map((s) => ({ label: s, value: s }))}
                placeholder="Select state"
                searchPlaceholder="Search states..."
                icon={<IconBuildingSkyscraper size={16} />}
              />
            ) : (
              <div className="relative">
                <IconBuildingSkyscraper
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
                />
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={`w-full rounded-xl border bg-muted/5 pl-9 pr-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-primary/20 ${
                    errors.state
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-border focus:border-primary"
                  }`}
                  placeholder="State / Region"
                />
              </div>
            )}
            {errors.state && (
              <p className="mt-1 text-xs text-red-500">{errors.state}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
