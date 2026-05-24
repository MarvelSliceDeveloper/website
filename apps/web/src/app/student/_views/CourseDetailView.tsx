"use client";

import { useState } from "react";
import type { CatalogueCourse } from "@/lib/student-mock-data";

interface CourseDetailViewProps {
  course: CatalogueCourse;
  onEnroll?: (courseId: string) => Promise<void>;
}

export default function CourseDetailView({ course, onEnroll }: CourseDetailViewProps) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(course.isEnrolled);
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div className="glass-card overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-4xl shadow-lg overflow-hidden">
            {course.thumbnail && (course.thumbnail.startsWith("/") || course.thumbnail.startsWith("http")) ? (
              <img src={course.thumbnail} className="h-full w-full object-cover" alt="" />
            ) : (
              course.thumbnail || "📚"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              {course.tags.map((t) => (
                <span key={t} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground">{course.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Duration: {course.duration} · Instructor: {course.instructor} · Next Batch: {course.nextBatch}
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">₹{course.price.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* What you'll learn */}
      <div className="glass-card p-5">
        <p className="mb-3 font-semibold text-foreground">What you&apos;ll learn</p>
        <ul className="space-y-2">
          {course.whatYouLearn.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-0.5 text-success">✅</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Curriculum */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <p className="font-semibold text-foreground">Curriculum</p>
          <p className="text-xs text-muted-foreground">
            {course.curriculum.reduce((acc, m) => acc + m.sessions, 0)} total sessions across {course.curriculum.length} modules
          </p>
        </div>
        <div className="divide-y divide-border/60">
          {course.curriculum.map((mod, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <p className="text-sm text-foreground">
                <span className="mr-2 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                {mod.title}
              </p>
              <span className="text-xs text-muted">{mod.sessions} sessions</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enroll CTA */}
      <div className="glass-card p-6">
        {enrolled ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">✅</span>
            <p className="font-semibold text-foreground">You&apos;re already enrolled!</p>
            <p className="text-sm text-muted-foreground">Head to My Courses to continue learning.</p>
          </div>
        ) : !showConfirm ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Ready to join?</p>
              <p className="text-sm text-muted-foreground">
                Enroll & pay ₹{course.price.toLocaleString("en-IN")} via Razorpay
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-primary flex-shrink-0"
            >
              Enroll & Pay ₹{course.price.toLocaleString("en-IN")} →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              ⚠️ Payment creates a pending request. Admin reviews and assigns you to the next available batch. You&apos;ll be notified by email.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn-primary flex-1"
              >
                {enrolling ? "Processing…" : "Confirm & Pay →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
