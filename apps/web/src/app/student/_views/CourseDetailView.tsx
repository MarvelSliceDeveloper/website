"use client";

import { useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconAward,
  IconBriefcase,
  IconClock,
  IconCode,
  IconTarget,
  IconUsers,
  IconStack2,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import CourseHero from "@/app/catalogue/_components/CourseHero";
import type { CatalogueCourse } from "@/lib/api-types";

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
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

const HIGHLIGHT_ICONS: Record<string, any> = {
  "Industry-Relevant Curriculum": IconCode,
  "Dedicated Mentor Support": IconUsers,
  "Certificate of Completion": IconAward,
  "Placement Assistance": IconBriefcase,
  "Flexible Learning": IconClock,
  "Hands-On Projects": IconTarget,
};

const FALLBACK_HIGHLIGHTS = [
  { label: "Industry-Relevant Curriculum", value: "Designed by working professionals" },
  { label: "Dedicated Mentor Support", value: "1:1 guidance throughout" },
  { label: "Certificate of Completion", value: "Shareable credential" },
  { label: "Placement Assistance", value: "Resume & interview prep" },
  { label: "Flexible Learning", value: "Learn at your own pace" },
  { label: "Hands-On Projects", value: "Real-world case studies" },
];

const FALLBACK_FAQS = [
  { q: "Who is this program for?", a: "Students, professionals and career-switchers wanting in-demand skills." },
  { q: "What do I get after enrolling?", a: "Full access to courses, projects and certificate on completion." },
  { q: "How does payment work?", a: "Secure Razorpay payment; invoice on email immediately." },
];

interface CourseDetailViewProps {
  course: CatalogueCourse;
  onEnroll?: (courseId: string) => Promise<void>;
}

export default function CourseDetailView({ course, onEnroll }: CourseDetailViewProps) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(course.isEnrolled);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEnquire, setShowEnquire] = useState(false);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await onEnroll?.(course.id);
      setEnrolled(true);
    } finally {
      setEnrolling(false);
      setShowConfirm(false);
    }
  }

  // Landing-equivalent derived data
  const modules: any[] = (course.modules as any[]) || [];
  const fallbackCurriculum = course.curriculum || [];
  // Use real modules when available, otherwise fall back to curriculum summary
  const displayModules: { id: string; title: string; description?: string | null; lessons: any[]; quizzes: any[]; assignments: any[] }[] =
    modules.length > 0
      ? modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lessons: m.lessons || [],
          quizzes: m.quizzes || [],
          assignments: m.assignments || [],
        }))
      : fallbackCurriculum.map((c, i) => ({
          id: `cur-${i}`,
          title: c.title,
          description: null,
          lessons: Array.from({ length: c.sessions }, (_, k) => ({ id: `s-${k}` })),
          quizzes: [],
          assignments: [],
        }));

  const totalLessons =
    course.totalLessons ??
    displayModules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

  // Hero needs the same shape as catalogue: { title, description, learningObjectives/highlights, price, coverImageUrl, thumbnailUrl, videoUrl, modules }
  const heroCourse: any = {
    ...course,
    description: (course as any).description ?? "",
    learningObjectives: (course as any).learningObjectives ?? course.whatYouLearn ?? course.highlights ?? [],
    highlights: (course as any).learningObjectives ?? course.whatYouLearn ?? [],
    coverImageUrl: (course as any).coverImageUrl ?? null,
    thumbnailUrl: (course as any).thumbnailUrl ?? course.thumbnail ?? null,
    videoUrl: (course as any).videoUrl ?? null,
    modules: displayModules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — exact landing component */}
      <CourseHero
        course={heroCourse}
        onEnroll={() => {
          if (enrolled) return;
          setShowConfirm(true);
        }}
        onEnquire={() => setShowEnquire(true)}
      />

      {/* Key Highlights — exact landing 3-col grid */}
      <section className="py-12 bg-bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-bold text-2xl sm:text-3xl text-center mb-10">Key Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {FALLBACK_HIGHLIGHTS.map((h) => {
              const Icon = HIGHLIGHT_ICONS[h.label] || IconAward;
              return (
                <div
                  key={h.label}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 border border-gray-100 flex items-center gap-4 p-4 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={18} className="text-indigo-500 group-hover:text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-dark-navy group-hover:text-primary">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{h.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's included + Modules (landing style) */}
      <section className="bg-card border-y border-border py-8">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            kicker="What's Included"
            title="Everything you need to succeed"
            subtitle="A complete learning journey — from fundamentals to career-ready skills."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FALLBACK_HIGHLIGHTS.map((h) => (
              <div
                key={h.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-background p-5 hover:border-primary/30 transition-colors"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-60 group-hover:opacity-100" />
                <p className="font-semibold text-foreground">{h.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{h.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-background p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Included Modules — {displayModules.length} modules, {totalLessons} lessons
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {displayModules.slice(0, 8).map((m: any) => (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center">
                    <IconStack2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.lessons?.length || 0} lessons {m.quizzes?.length ? `· ${m.quizzes.length} quizzes` : ""}{" "}
                      {m.assignments?.length ? `· ${m.assignments.length} assignments` : ""}
                    </p>
                    {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                  </div>
                </div>
              ))}
              {displayModules.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Content coming soon.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Certification */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-card p-8 flex flex-col sm:flex-row gap-6 items-center">
            <div className="h-24 w-24 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <IconAward size={40} stroke={1.6} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Certification</p>
              <h3 className="text-xl font-bold">Earn a certificate on completion</h3>
              <p className="text-sm text-muted-foreground mt-1">Complete all lessons, quizzes and assignments to earn a shareable certificate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading kicker="FAQs" title="Frequently asked questions" />
          <div className="space-y-3">
            {FALLBACK_FAQS.map((f, i) => (
              <details key={i} className="rounded-xl border border-border bg-background p-4 group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm">
                  {f.q}
                  <IconChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Enroll CTA — student authenticated flow, styled to match landing CTA */}
      <section className="pb-24 md:pb-10 px-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6">
          {enrolled ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <IconCheck size={20} stroke={2.5} />
              </span>
              <p className="font-semibold text-foreground">You&apos;re already enrolled!</p>
              <p className="text-sm text-muted-foreground">Head to My Courses to continue learning.</p>
            </div>
          ) : !showConfirm ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Ready to join?</p>
                <p className="text-sm text-muted-foreground">Request enrollment — admin will approve</p>
              </div>
              <button onClick={() => setShowConfirm(true)} className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-full shadow-md transition-colors shrink-0">
                Enroll Now →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Enrollment request will be submitted for admin approval. You&apos;ll be notified once approved.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-full border border-border bg-background py-2.5 text-sm font-semibold hover:bg-card">
                  Cancel
                </button>
                <button onClick={handleEnroll} disabled={enrolling} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                  {enrolling ? <IconLoader2 size={16} className="animate-spin" /> : null}
                  {enrolling ? "Processing…" : "Submit Request →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enquiry modal — mirrors landing Talk to Advisor modal */}
      {showEnquire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEnquire(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Talk to Advisor — {course.title}</h3>
              <button onClick={() => setShowEnquire(false)} className="p-1 hover:bg-gray-100 rounded">
                <IconX size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Our advisor will contact you shortly. For immediate help, reach out via Mentorship.</p>
            <button onClick={() => setShowEnquire(false)} className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
