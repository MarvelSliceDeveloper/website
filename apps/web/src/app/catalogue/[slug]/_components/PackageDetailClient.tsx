"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PackageDetail } from "@/lib/api-types";
import { RazorpayCheckoutWidget } from "./RazorpayCheckoutWidget";
import { InternCheckoutWidget } from "./InternCheckoutWidget";
import {
  IconArrowRight,
  IconArrowLeft,
  IconBook,
  IconCertificate,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconCode,
  IconStack2,
  IconUsers,
  IconBadge,
  IconTarget,
  IconVideo,
  IconBriefcase,
  IconRocket,
  IconAward,
  IconSparkles,
  IconLifebuoy,
  IconStar,
  IconShare,
} from "@tabler/icons-react";

interface Props {
  pkg: PackageDetail;
}

// ── Mock / attractive fallback content (frontend only) ─────────────────────────
const HIGHLIGHTS = [
  {
    icon: IconRocket,
    label: "Industry-Relevant Curriculum",
    value: "Designed by working professionals",
  },
  {
    icon: IconLifebuoy,
    label: "Dedicated Mentor Support",
    value: "1:1 guidance throughout",
  },
  {
    icon: IconCertificate,
    label: "Certificate of Completion",
    value: "Shareable, recognized credential",
  },
  {
    icon: IconBriefcase,
    label: "Placement Assistance",
    value: "Resume & interview prep",
  },
  {
    icon: IconClock,
    label: "Flexible Learning",
    value: "Learn at your own pace",
  },
  {
    icon: IconTarget,
    label: "Hands-On Projects",
    value: "Real-world case studies",
  },
];

const FEATURES = [
  "Industry-relevant curriculum designed by experts",
  "Hands-on projects & real-world case studies",
  "Lifetime access to course materials & updates",
  "Certificate of completion for each course",
  "Dedicated mentor support throughout the program",
  "Flexible learning — learn at your own pace",
];

const INTERN_FEATURES = [
  "1:1 mentorship from industry professionals",
  "Live online sessions with hands-on practice",
  "Real-world assignments & projects",
  "Progress tracked with regular feedback",
  "Certificate of completion after finishing",
  "Flexible schedule — learn at your own pace",
];

const INTERN_DELIVERABLES = [
  {
    icon: IconVideo,
    label: "Live Online Sessions",
    value: "Interactive classes conducted online by expert mentors",
  },
  {
    icon: IconLifebuoy,
    label: "Dedicated Mentorship",
    value: "1:1 guidance and support throughout the program",
  },
  {
    icon: IconBriefcase,
    label: "Hands-On Assignments",
    value: "Practical assignments to apply what you learn",
  },
  {
    icon: IconCertificate,
    label: "Certificate on Completion",
    value: "Verified certificate once you complete all requirements",
  },
];

const FAQS = [
  {
    q: "Who is this program for?",
    a: "This program is ideal for students, working professionals, and career-switchers who want to build in-demand skills and gain practical, hands-on experience.",
  },
  {
    q: "What do I get after enrolling?",
    a: "You get full access to all included courses, live online classes, hands-on projects, and a certificate of completion once you finish the requirements.",
  },
  {
    q: "Is there any mentor support?",
    a: "Yes. Every learner gets dedicated mentor support to help with doubts, project reviews, and career guidance throughout the program.",
  },
  {
    q: "How does the payment work?",
    a: "Payments are processed securely via Razorpay. You will receive a confirmation and invoice on your email immediately after payment.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds are handled on a case-by-case basis. Please reach out to our support team within the policy window for assistance.",
  },
];

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-6 py-6 backdrop-blur-sm">
      <Icon size={18} className="text-white/90" />
      <div>
        <p className="text-[15px] font-bold uppercase tracking-wide text-white">
          {label}
        </p>
        <p className="text-[15px] font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Highlights() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="Key Highlights"
          title="Everything you get in this program"
          subtitle="A complete learning journey — from fundamentals to career-ready skills."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary-hover opacity-60 transition-opacity group-hover:opacity-100" />
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <h.icon size={22} stroke={1.6} />
              </div>
              <p className="font-semibold text-foreground">{h.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{h.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatYouGet({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  const courses = pkg.courses;
  const totalModules = courses.reduce(
    (sum, c) => sum + (c.course.modules?.length ?? 0),
    0,
  );

  return (
    <section className="bg-card border-y border-border py-8">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="What's Included"
          title="Everything you need to succeed"
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {(isInternship ? INTERN_FEATURES : FEATURES).map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="mt-0.5 flex flex-col h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <IconCheck size={13} stroke={2.5} />
                </span>
                <p className="text-bold text-foreground">{f}</p>
              </div>
            ))}
          </div>

          {isInternship ? (
            <div className="flex flex-col gap-4">
              {INTERN_DELIVERABLES.map((d) => (
                <div
                  key={d.label}
                  className="flow-root flex items-start gap-4 rounded-xl border border-border bg-background p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white">
                    <d.icon size={22} stroke={1.6} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {d.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-black">
                Included Courses
              </p>
              <div className="flex flex-col gap-4">
                {courses.map((pc) => {
                  const course = pc.course;
                  const moduleCount = course.modules?.length ?? 0;
                  return (
                    <div
                      key={course.id}
                      className="flow-root rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white">
                          <IconBook size={18} stroke={1.6} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {course.title}
                          </p>
                          {course.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {course.description}
                            </p>
                          )}
                          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            <IconStack2 size={12} /> {moduleCount} modules
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
                {[
                  { icon: IconBook, value: courses.length, label: "Courses" },
                  { icon: IconStack2, value: totalModules, label: "Modules" },
                  {
                    icon: IconVideo,
                    value: pkg.totalLessons ?? 0,
                    label: "Lessons",
                  },
                  {
                    icon: IconBadge,
                    value: pkg.totalQuizzes ?? 0,
                    label: "Quizzes",
                  },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon
                      size={20}
                      className="mx-auto mb-1 text-primary"
                      stroke={1.6}
                    />
                    <p className="text-lg font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Certification({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-card to-card">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover p-10">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white shadow-2xl shadow-primary/30">
                <IconAward size={56} className="text-primary" stroke={1.4} />
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Certification
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                Earn a certificate on completion
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isInternship
                  ? "Complete all mentorship sessions and assignments to earn a shareable certificate that showcases your internship experience to employers and recruiters."
                  : "Complete all courses, quizzes, and assignments to earn a shareable certificate that showcases your new skills to employers and recruiters."}
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Verified & shareable certificate",
                  "Showcases your skills to employers",
                  "Adds credibility to your resume & LinkedIn",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <IconSparkles
                      size={16}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="bg-card border-t border-border py-8">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading kicker="FAQs" title="Frequently asked questions" />
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-xl border border-border bg-background"
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {f.q}
                  </span>
                  <IconChevronDown
                    size={18}
                    className={`shrink-0 text-muted-foreground transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                    {f.q === "What do I get after enrolling?"
                      ? isInternship
                        ? "You get 1:1 mentorship, live online sessions, hands-on assignments, and a certificate of completion once you finish all requirements."
                        : f.a
                      : f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/catalogue" className="group flex items-center gap-3">
          <div className="transition-transform group-hover:scale-105">
            <Image
              src="/images/logo.svg"
              alt="Marvel Slice"
              width={220}
              height={64}
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">
            <span className="text-blue-600">Marvel</span>{" "}
            <span className="text-blue-500">Slice</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground sm:flex"
          >
            <IconShare size={15} />
            Share
          </button>
          <Link
            href="/catalogue"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft size={15} />
            Back
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  const hasPrice = pkg.price != null && pkg.price > 0;
  const totalLessons = pkg.totalLessons ?? 0;
  const totalQuizzes = pkg.totalQuizzes ?? 0;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-primary-hover text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-40 w-40 rounded-full border border-white/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 lg:py-20">
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition-colors hover:text-white"
        >
          <IconArrowLeft size={15} /> Back to Catalogue
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {isInternship && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                  <IconBriefcase size={13} /> Internship Program
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconStar size={13} /> Career-Focused
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {pkg.name}
            </h1>

            {pkg.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85">
                {pkg.description}
              </p>
            )}

            {isInternship ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill
                  icon={IconLifebuoy}
                  label="1:1 Mentorship"
                  value="Dedicated"
                />
                <StatPill
                  icon={IconVideo}
                  label="Live Sessions"
                  value="Online"
                />
                <StatPill
                  icon={IconBriefcase}
                  label="Assignments"
                  value="Hands-on"
                />
                <StatPill
                  icon={IconCertificate}
                  label="Certificate"
                  value="On finish"
                />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill
                  icon={IconBook}
                  label="Courses"
                  value={String(pkg.courses.length)}
                />
                <StatPill
                  icon={IconVideo}
                  label="Lessons"
                  value={String(totalLessons)}
                />
                <StatPill
                  icon={IconBadge}
                  label="Quizzes"
                  value={String(totalQuizzes)}
                />
                <StatPill icon={IconUsers} label="Mentors" value="1:1" />
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#apply"
                className="nline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {isInternship
                  ? "Apply Now"
                  : hasPrice
                    ? "Enroll Now"
                    : "Contact Us"}
              </a>
              <a
                href="#courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {isInternship ? "What's Included" : "Explore Courses"}{" "}
                <IconArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-2">
                <IconSparkles size={18} className="text-white/90" />
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Why choose this program
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-3">
                {[
                  { icon: IconCode, label: "Hands-on, practical learning" },
                  { icon: IconTarget, label: "Goal-oriented curriculum" },
                  { icon: IconAward, label: "Recognized certification" },
                  { icon: IconLifebuoy, label: "Mentor & community support" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3.5"
                  >
                    <f.icon size={17} className="shrink-0 text-white/90" />
                    <span className="text-sm font-medium text-white">
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PackageDetailClient({ pkg }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero pkg={pkg} />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column — package detail */}
          <div className="lg:col-span-2 space-y-8">
            <Highlights />
            <div id="courses">
              <WhatYouGet pkg={pkg} />
            </div>
            <Certification pkg={pkg} />
          </div>

          {/* Right column — sticky checkout */}
          <div id="apply" className="lg:col-span-1">
            {pkg.isInternship ? (
              <InternCheckoutWidget pkg={pkg} />
            ) : (
              <RazorpayCheckoutWidget pkg={pkg} />
            )}
          </div>
        </div>
      </main>

      <FAQ pkg={pkg} />
    </div>
  );
}
