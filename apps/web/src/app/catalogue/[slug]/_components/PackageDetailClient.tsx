"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PackageDetail } from "@/lib/api-types";
import { RazorpayCheckoutWidget } from "./RazorpayCheckoutWidget";
import { InternCheckoutWidget } from "./InternCheckoutWidget";
import { CourseDerivedCheckoutWidget } from "./CourseDerivedCheckoutWidget";
import {
  IconArrowLeft,
  IconBook,
  IconCertificate,
  IconCheck,
  IconChevronDown,
  IconStack2,
  IconBadge,
  IconVideo,
  IconBriefcase,
  IconAward,
  IconStar,
  IconUsers,
  IconLifebuoy,
  IconShare,
  IconRocket,
  IconCode,
  IconClipboardCheck,
  IconInfinity,
} from "@tabler/icons-react";

interface Props {
  pkg: PackageDetail;
}

// ── Mock / attractive fallback content (frontend only) ─────────────────────────
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
    <div className="mb-8 max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
        <span className="h-px w-6 bg-primary" />
        {kicker}
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PageHeading({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  const hasPrice = pkg.price != null && pkg.price > 0;

  const stats = isInternship
    ? [
        { icon: IconLifebuoy, label: "1:1 Mentorship" },
        { icon: IconVideo, label: "Live Sessions" },
        { icon: IconBriefcase, label: "Hands-on Assignments" },
        { icon: IconCertificate, label: "Certificate on finish" },
      ]
    : [
        { icon: IconBook, label: `${pkg.courses.length} Courses` },
        { icon: IconVideo, label: `${pkg.totalLessons ?? 0} Lessons` },
        { icon: IconBadge, label: `${pkg.totalQuizzes ?? 0} Quizzes` },
        { icon: IconUsers, label: "1:1 Mentors" },
      ];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        {isInternship && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            <IconBriefcase size={13} /> Internship Program
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <IconStar size={13} className="text-primary" /> Career-Focused
        </span>
      </div>

      <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {pkg.name}
      </h1>

      {pkg.description && (
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          {pkg.description}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2">
          {stats.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <s.icon size={14} className="text-primary" />
              {s.label}
            </span>
          ))}
        </div>
        <a
          href="#apply"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md sm:ml-auto"
        >
          {isInternship ? "Apply Now" : hasPrice ? "Enroll Now" : "Contact Us"}
        </a>
      </div>
    </div>
  );
}

const WHY_CHOOSE = [
  {
    icon: IconRocket,
    title: "Industry-focused curriculum",
    value: "Designed with inputs from working professionals.",
  },
  {
    icon: IconCode,
    title: "Hands-on practical projects",
    value: "Learn by building real-world projects.",
  },
  {
    icon: IconLifebuoy,
    title: "1:1 mentor guidance",
    value: "Get personal guidance whenever you're stuck.",
  },
  {
    icon: IconAward,
    title: "Recognized certificate",
    value: "Earn a shareable certificate on completion.",
  },
];

const JOURNEY_STEPS = [
  { title: "Learn", value: "Master concepts through structured lessons." },
  {
    title: "Practice",
    value: "Reinforce with quizzes and hands-on exercises.",
  },
  { title: "Build", value: "Apply your skills in real-world projects." },
  { title: "Get Mentored", value: "1:1 guidance from industry mentors." },
  {
    title: "Get Certified",
    value: "Earn a certificate to showcase your skills.",
  },
];

const INTERN_JOURNEY_STEPS = [
  { title: "Apply", value: "Submit your application for the program." },
  {
    title: "Get Selected",
    value: "Our team reviews and confirms your seat.",
  },
  {
    title: "Attend Live Sessions",
    value: "Join interactive online sessions with mentors.",
  },
  {
    title: "Complete Assignments",
    value: "Submit hands-on assignments and get feedback.",
  },
  {
    title: "Build Projects",
    value: "Work on real projects for your portfolio.",
  },
  {
    title: "Get Certified",
    value: "Earn your internship certificate on completion.",
  },
];

function WhyChoose() {
  return (
    <section className="pb-10">
      <SectionHeading kicker="Why Choose Us" title="Why choose this program?" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_CHOOSE.map((h) => (
          <div
            key={h.title}
            className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-orange/10"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange-tint text-brand-orange">
              <h.icon size={22} stroke={1.7} />
            </div>
            <p className="font-semibold text-foreground">{h.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{h.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatYoullLearn({ pkg }: { pkg: PackageDetail }) {
  const blocks = pkg.courses
    .map((pc) => ({
      id: pc.course.id,
      title: pc.course.title,
      points:
        pc.course.learningObjectives && pc.course.learningObjectives.length > 0
          ? pc.course.learningObjectives
          : (pc.course.modules ?? []).map((m) => m.title),
    }))
    .filter((b) => b.points.length > 0);
  if (blocks.length === 0) return null;
  const showCourseTitles = blocks.length > 1;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="Outcomes"
          title="What you'll learn"
          subtitle="Skills and outcomes you'll walk away with."
        />
        <div className="space-y-6">
          {blocks.map((b) => (
            <div key={b.id}>
              {showCourseTitles && (
                <p className="mb-3 text-sm font-bold text-foreground">
                  {b.title}
                </p>
              )}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {b.points.map((pt, idx) => (
                  <li
                    key={`${b.id}-${idx}`}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange-tint text-brand-orange">
                      <IconCheck size={13} stroke={2.5} />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {pt}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Curriculum({ pkg }: { pkg: PackageDetail }) {
  const courses = pkg.courses.filter(
    (pc) => (pc.course.modules?.length ?? 0) > 0,
  );
  const [openId, setOpenId] = useState<string | null>(
    courses[0]?.course.id ?? null,
  );
  if (courses.length === 0) return null;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="Curriculum"
          title="Program curriculum"
          subtitle="Module-by-module breakdown of everything covered."
        />
        <div className="space-y-3">
          {courses.map((pc, courseIdx) => {
            const course = pc.course;
            const modules = [...(course.modules ?? [])].sort(
              (a, b) => a.order - b.order,
            );
            const open = openId === course.id;
            return (
              <div
                key={course.id}
                className={`overflow-hidden rounded-2xl border bg-card transition-colors ${
                  open ? "border-primary/30" : "border-border"
                }`}
              >
                <button
                  onClick={() => setOpenId(open ? null : course.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                    {String(courseIdx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {course.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {modules.length}{" "}
                      {modules.length === 1 ? "module" : "modules"}
                    </span>
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      open
                        ? "bg-primary text-white"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    <IconChevronDown
                      size={15}
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {open && (
                  <ul className="space-y-1 border-t border-border px-3 py-3">
                    {modules.map((m, idx) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-orange-tint text-[11px] font-extrabold text-brand-orange">
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {m.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProgramJourney({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  const steps = isInternship ? INTERN_JOURNEY_STEPS : JOURNEY_STEPS;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="How It Works"
          title="Your program journey"
          subtitle="Know exactly how you'll go from enrollment to certification."
        />
        <div>
          {steps.map((s, i) => (
            <div key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-1 pt-1.5">
                <p className="text-sm font-bold text-foreground">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramGlance({ pkg }: { pkg: PackageDetail }) {
  const totalModules = pkg.courses.reduce(
    (sum, c) => sum + (c.course.modules?.length ?? 0),
    0,
  );
  const rows = [
    { icon: IconBook, label: "Courses", value: String(pkg.courses.length) },
    { icon: IconStack2, label: "Modules", value: String(totalModules) },
    {
      icon: IconVideo,
      label: "Lessons",
      value: String(pkg.totalLessons ?? 0),
    },
    {
      icon: IconBadge,
      label: "Quizzes",
      value: String(pkg.totalQuizzes ?? 0),
    },
    {
      icon: IconClipboardCheck,
      label: "Assignments",
      value: String(pkg.totalAssignments ?? 0),
    },
    { icon: IconAward, label: "Certificate", value: "Yes" },
    { icon: IconUsers, label: "Mentorship", value: "1:1" },
    { icon: IconInfinity, label: "Access", value: "Lifetime" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <p className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-foreground">
        <span className="h-4 w-1 rounded-full bg-brand-orange" />
        Program at a glance
      </p>
      <dl className="px-5 py-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <r.icon size={15} className="text-brand-orange" />
              {r.label}
            </dt>
            <dd className="font-bold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhatYouGet({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;

  return (
    <section className="border-y border-border bg-card py-10">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="What's Included"
          title="Everything you need to succeed"
          subtitle="One program, complete package — learn, practice, and get certified."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(isInternship ? INTERN_FEATURES : FEATURES).map((f) => (
            <div
              key={f}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <IconCheck size={13} stroke={2.5} />
              </span>
              <p className="text-sm font-medium text-foreground">{f}</p>
            </div>
          ))}
        </div>

        {isInternship && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INTERN_DELIVERABLES.map((d, idx) => (
              <div
                key={d.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/30"
              >
                <span className="text-xs font-extrabold text-primary/40">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white">
                  <d.icon size={22} stroke={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {d.label}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Certification({ pkg }: { pkg: PackageDetail }) {
  const isInternship = pkg.isInternship ?? false;
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-5">
          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primary-hover p-10 lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white shadow-xl">
              <IconAward size={52} className="text-primary" stroke={1.5} />
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 lg:col-span-3 lg:p-12">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-primary" />
              Certification
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
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
                  className="flex items-start gap-2.5 text-sm font-medium text-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <IconCheck size={12} stroke={3} className="text-primary" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
    <section className="border-t border-border bg-card py-10">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading kicker="FAQs" title="Frequently asked questions" />
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border bg-background transition-colors ${
                  open ? "border-primary/30" : "border-border"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {f.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      open
                        ? "bg-primary text-white"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    <IconChevronDown
                      size={15}
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </span>
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
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/catalogue" className="group flex items-center gap-3">
          <Image
            src="/images/logo.svg"
            alt="Marvel Slice"
            width={48}
            height={48}
            className="h-10 w-auto object-contain shrink-0"
          />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
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

export function PackageDetailClient({ pkg }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content — compact heading, then details */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <PageHeading pkg={pkg} />
        <WhyChoose />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column — package detail */}
          <div className="space-y-10 lg:col-span-2">
            <WhatYoullLearn pkg={pkg} />
            <Curriculum pkg={pkg} />
            <ProgramJourney pkg={pkg} />
            <div id="courses">
              <WhatYouGet pkg={pkg} />
            </div>
            <Certification pkg={pkg} />
          </div>

          {/* Right column — sticky checkout + glance */}
          <div id="apply" className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              {pkg._derivedCourseId ? (
                <CourseDerivedCheckoutWidget pkg={pkg} />
              ) : pkg.isInternship ? (
                <InternCheckoutWidget pkg={pkg} />
              ) : (
                <RazorpayCheckoutWidget pkg={pkg} />
              )}
              <ProgramGlance pkg={pkg} />
            </div>
          </div>
        </div>
      </main>

      <FAQ pkg={pkg} />
    </div>
  );
}
