"use client";

import { useState } from "react";
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
} from "@tabler/icons-react";

interface OnboardingWizardViewProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome", title: "Welcome to Marvel Slice" },
  { id: "tour", label: "Features", title: "Explore Your Tools" },
  { id: "done", label: "All Set!", title: "Ready to Begin" },
] as const;

const FEATURES = [
  {
    icon: IconBook,
    title: "My Enrolled Courses",
    desc: "Access your active modules, structured video lessons, assignments, and quizzes.",
    badge: "Core Learning",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/12 dark:bg-indigo-500/20",
    border: "border-indigo-500/25 hover:border-indigo-500/50",
  },
  {
    icon: IconPlayerPlay,
    title: "Live Interactive Classes",
    desc: "Join real-time sessions with expert instructors, ask questions, and collaborate.",
    badge: "Real-time",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/12 dark:bg-emerald-500/20",
    border: "border-emerald-500/25 hover:border-emerald-500/50",
  },
  {
    icon: IconCalendarEvent,
    title: "Interactive Calendar",
    desc: "Keep track of session schedules, project deadlines, and live event reminders.",
    badge: "Schedule",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/12 dark:bg-amber-500/20",
    border: "border-amber-500/25 hover:border-amber-500/50",
  },
  {
    icon: IconSchool,
    title: "1-on-1 Mentorship",
    desc: "Book direct mentorship sessions with your instructor for guidance & code reviews.",
    badge: "Personalized",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/12 dark:bg-violet-500/20",
    border: "border-violet-500/25 hover:border-violet-500/50",
  },
  {
    icon: IconLicense,
    title: "Verified Certificates",
    desc: "Earn shareable course completion certificates to highlight on your resume & LinkedIn.",
    badge: "Credentials",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/12 dark:bg-sky-500/20",
    border: "border-sky-500/25 hover:border-sky-500/50",
  },
  {
    icon: IconHeadset,
    title: "Dedicated Support",
    desc: "Need assistance? Raise support tickets or message your instructors anytime.",
    badge: "24/7 Support",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/12 dark:bg-rose-500/20",
    border: "border-rose-500/25 hover:border-rose-500/50",
  },
];

export default function OnboardingWizardView({
  onComplete,
}: OnboardingWizardViewProps) {
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-8">
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
                          ? "bg-gradient-to-tr from-primary to-indigo-600 text-white ring-4 ring-primary/25 shadow-lg scale-105"
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
                        ? "bg-gradient-to-r from-primary to-indigo-500"
                        : "bg-border/60"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content with animated entrance */}
        <div className="relative z-10 min-h-[340px] w-full sp-view-enter">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <FeatureTourStep />}
          {step === 2 && <AllSetStep />}
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
            {step > 0 && step < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hidden sm:block"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn-primary px-7 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
            >
              {step === STEPS.length - 1 ? (
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
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-violet-600 text-white shadow-xl shadow-indigo-500/25">
          <IconSparkles size={48} stroke={1.5} />
        </div>
      </div>

      <h1 className="mb-3 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Welcome to your{" "}
        <span className="bg-gradient-to-r from-indigo-500 via-primary to-violet-500 bg-clip-text text-transparent">
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
            className={`group flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-card/60 ${f.border}`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${f.bg}`}
            >
              <f.icon size={22} className={f.color} stroke={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {f.title}
                </h3>
                <span className="shrink-0 rounded-full border border-border/80 bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
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
