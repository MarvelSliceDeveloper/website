"use client";

import Image from "next/image";
import Link from "next/link";
import type { PackageDetail } from "@/lib/api-types";
import { RazorpayCheckoutWidget } from "./RazorpayCheckoutWidget";
import { InternCheckoutWidget } from "./InternCheckoutWidget";

interface Props {
  pkg: PackageDetail;
}

function WhyBuySection({ pkg }: { pkg: PackageDetail }) {
  const totalModules = pkg.courses.reduce(
    (sum, c) => sum + (c.course.modules?.length ?? 0),
    0,
  );
  const totalLessons = pkg.totalLessons ?? 0;
  const totalQuizzes = pkg.totalQuizzes ?? 0;
  const totalPracticals = pkg.totalPracticals ?? 0;

  const highlights = [
    {
      label: "Comprehensive Curriculum",
      value: `${pkg.courses.length} courses`,
    },
    { label: "Deep Dive", value: `${totalModules} modules` },
    {
      label: "Hands-on Learning",
      value: `${totalPracticals} practicals, ${totalLessons} lessons`,
    },
    {
      label: "Knowledge Check",
      value: `${totalQuizzes} quizzes & assessments`,
    },
  ];

  const features = [
    "Industry-relevant curriculum designed by experts",
    "Hands-on projects & real-world case studies",
    "Lifetime access to course materials & updates",
    "Certificate of completion for each course",
    "Dedicated mentor support throughout the program",
    "Flexible learning — learn at your own pace",
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Why learn with us?
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-xs text-muted-foreground">{h.label}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {h.value}
            </p>
          </div>
        ))}
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <svg
              className="w-4 h-4 text-primary mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CoursesList({ pkg }: { pkg: PackageDetail }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Courses in this Package
      </h2>
      <div className="space-y-3">
        {pkg.courses.map((pc) => {
          const course = pc.course;
          const moduleCount = course.modules?.length ?? 0;

          return (
            <div
              key={course.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {course.description}
                </p>
              )}
              <div className="flex gap-3 text-xs text-muted">
                <span>{moduleCount} modules</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PackageDetailClient({ pkg }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/catalogue" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Marvel Slice"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-base font-extrabold tracking-tight">
              <span className="text-blue-600">Marvel</span>{" "}
              <span className="text-blue-500">Slice</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator.share({ url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
            <Link
              href="/catalogue"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — package detail */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {pkg.name}
              </h1>
              {pkg.description && (
                <p className="text-muted-foreground">{pkg.description}</p>
              )}
            </div>

            <WhyBuySection pkg={pkg} />
            <CoursesList pkg={pkg} />
          </div>

          {/* Right column — sticky checkout */}
          <div className="lg:col-span-1">
            {pkg.isInternship ? (
              <InternCheckoutWidget pkg={pkg} />
            ) : (
              <RazorpayCheckoutWidget pkg={pkg} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
