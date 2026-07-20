"use client";

import { useState } from "react";
import {
  IconBook,
  IconCalendarEvent,
  IconCheck,
  IconHeadset,
  IconLicense,
  IconPlayerPlay,
  IconSchool,
  IconSparkles,
} from "@tabler/icons-react";

interface OnboardingWizardViewProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "tour", label: "Features" },
  { id: "done", label: "All Set!" },
] as const;

const FEATURES = [
  {
    icon: IconBook,
    title: "My Courses",
    desc: "Access all your enrolled courses, modules, and study materials.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: IconPlayerPlay,
    title: "Live Sessions",
    desc: "Join live classes, ask questions, and interact with instructors in real time.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: IconCalendarEvent,
    title: "Calendar",
    desc: "View upcoming sessions, deadlines, and mentorship meetings at a glance.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: IconSchool,
    title: "Mentorship",
    desc: "Connect with your instructor for 1-on-1 guidance and support.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: IconLicense,
    title: "Certificates",
    desc: "Earn certificates when you complete a course and share them on LinkedIn.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: IconHeadset,
    title: "Support",
    desc: "Need help? Raise a support ticket and our team will assist you.",
    color: "text-rose-600",
    bg: "bg-rose-50",
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

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12">
      {/* Step indicators */}
      <div className="mb-10 flex items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <IconCheck size={16} stroke={2.5} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 transition-colors ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full">
        {step === 0 && <WelcomeStep />}
        {step === 1 && <FeatureTourStep />}
        {step === 2 && <AllSetStep />}
      </div>

      {/* Actions */}
      <div className="mt-10 flex items-center gap-4">
        {step < STEPS.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
        )}
        <button onClick={handleNext} className="btn-primary px-8">
          {step === STEPS.length - 1 ? "Get Started" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <IconSparkles size={40} className="text-primary" stroke={1.5} />
      </div>
      <h1 className="mb-3 text-3xl font-bold text-foreground">
        Welcome to the Learning Portal!
      </h1>
      <p className="mx-auto max-w-md text-muted-foreground">
        We&apos;re excited to have you on board. Let&apos;s take a quick tour of
        the features available to you so you can make the most of your learning
        journey.
      </p>
    </div>
  );
}

function FeatureTourStep() {
  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
        Explore Your Dashboard
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        Here are the key features at your fingertips:
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-card-hover"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${f.bg}`}
            >
              <f.icon size={20} className={f.color} stroke={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
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
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <IconCheck size={40} className="text-emerald-600" stroke={2} />
      </div>
      <h1 className="mb-3 text-3xl font-bold text-foreground">
        You&apos;re All Set!
      </h1>
      <p className="mx-auto max-w-md text-muted-foreground">
        You&apos;re ready to start learning. Head to your dashboard to explore
        your courses, join live sessions, and track your progress. Good luck on
        your journey!
      </p>
      <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground">
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
