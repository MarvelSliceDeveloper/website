"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconBook,
  IconPackage,
  IconUsers,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";

interface AdminWorkflowGuideProps {
  activeStep?: 1 | 2 | 3;
}

export function AdminWorkflowGuide({ activeStep }: AdminWorkflowGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("lms_admin_workflow_guide_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("lms_admin_workflow_guide_collapsed", String(nextState));
  };

  if (!mounted) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-card p-4 transition-all duration-300 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconSparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              LMS Admin Workflow Guide
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                How It Works
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Follow this 3-step pipeline to publish courses, bundle packages, and enroll student batches.
            </p>
          </div>
        </div>

        <button
          onClick={toggleCollapse}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-card-hover"
        >
          {isCollapsed ? (
            <>
              Show Guide <IconChevronDown size={16} />
            </>
          ) : (
            <>
              Hide Guide <IconChevronUp size={16} />
            </>
          )}
        </button>
      </div>

      {/* Main Steps Content (Shown when expanded) */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* STEP 1 */}
            <div
              className={`rounded-lg border p-3.5 transition-all ${
                activeStep === 1
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      activeStep === 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    1
                  </span>
                  <IconBook
                    size={18}
                    className={activeStep === 1 ? "text-primary" : "text-muted-foreground"}
                  />
                  <h4 className="text-xs font-bold text-foreground">1. Create & Edit Course</h4>
                </div>
                {activeStep === 1 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                    Current Page
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">
                Course creation happens in <strong>2 stages</strong>:
              </p>

              <div className="space-y-1.5 text-xs text-foreground bg-background/50 rounded-md p-2.5 border border-border/40 mb-3">
                <div className="flex items-start gap-1">
                  <span className="font-semibold text-primary text-[11px] shrink-0">Stage A:</span>
                  <span>
                    Fill initial details: Title<span className="text-danger font-bold">*</span>, Description<span className="text-danger font-bold">*</span>, Thumbnail Image<span className="text-danger font-bold">*</span>, Category.
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-semibold text-primary text-[11px] shrink-0">Stage B:</span>
                  <span>
                    Open the created course to add <strong>Modules</strong>, <strong>Video Lessons</strong>, <strong>Quizzes</strong>, & <strong>Assignments</strong>.
                  </span>
                </div>
              </div>

              <Link
                href="/admin/courses/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                + Add New Course <IconArrowRight size={13} />
              </Link>
            </div>

            {/* STEP 2 */}
            <div
              className={`rounded-lg border p-3.5 transition-all ${
                activeStep === 2
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      activeStep === 2
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    2
                  </span>
                  <IconPackage
                    size={18}
                    className={activeStep === 2 ? "text-primary" : "text-muted-foreground"}
                  />
                  <h4 className="text-xs font-bold text-foreground">2. Bundle into Package</h4>
                </div>
                {activeStep === 2 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                    Current Page
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">
                Group one or multiple completed courses together for catalog selling & subscription tiers.
              </p>

              <div className="space-y-1 text-xs text-foreground bg-background/50 rounded-md p-2.5 border border-border/40 mb-3">
                <p>
                  <strong>Mandatory fields:</strong> Package Title<span className="text-danger font-bold">*</span>, Included Courses<span className="text-danger font-bold">*</span>, Selling Price<span className="text-danger font-bold">*</span>, Access Validity<span className="text-danger font-bold">*</span>.
                </p>
              </div>

              <Link
                href="/admin/packages"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Go to Packages <IconArrowRight size={13} />
              </Link>
            </div>

            {/* STEP 3 */}
            <div
              className={`rounded-lg border p-3.5 transition-all ${
                activeStep === 3
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      activeStep === 3
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    3
                  </span>
                  <IconUsers
                    size={18}
                    className={activeStep === 3 ? "text-primary" : "text-muted-foreground"}
                  />
                  <h4 className="text-xs font-bold text-foreground">3. Schedule & Enroll Batch</h4>
                </div>
                {activeStep === 3 && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                    Current Page
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">
                Assign students to scheduled cohorts with start/end dates, live sessions, and instructors.
              </p>

              <div className="space-y-1 text-xs text-foreground bg-background/50 rounded-md p-2.5 border border-border/40 mb-3">
                <p>
                  <strong>Mandatory fields:</strong> Batch Name<span className="text-danger font-bold">*</span>, Linked Course/Package<span className="text-danger font-bold">*</span>, Start Date<span className="text-danger font-bold">*</span>, Instructors<span className="text-danger font-bold">*</span>.
                </p>
              </div>

              <Link
                href="/admin/batches"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Go to Batches <IconArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
            <IconInfoCircle size={14} className="text-primary shrink-0" />
            <span>
              Note: Fields marked with <span className="text-danger font-bold">*</span> are required when creating any Course, Package, or Batch.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
