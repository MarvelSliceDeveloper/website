"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  IconShoppingCart,
  IconCheck,
  IconClock,
  IconUsers,
  IconStar,
  IconSparkles,
  IconArrowRight,
  IconLoader2,
  IconCurrencyRupee,
  IconPlayerPlay,
  IconCertificate,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CatalogueCourse {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  price: number;
  nextBatch: string;
  isEnrolled: boolean;
  tags: string[];
  curriculum: { title: string; sessions: number }[];
  whatYouLearn: string[];
}

// ── Load Razorpay script dynamically ───────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Course Card Component ──────────────────────────────────────────────────────

function CourseCard({
  course,
  onEnroll,
  isProcessing,
}: {
  course: CatalogueCourse;
  onEnroll: (courseId: string) => void;
  isProcessing: string | null;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isValidUrl =
    course.thumbnail &&
    (course.thumbnail.startsWith("/") || course.thumbnail.startsWith("http"));

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
        {/* Thumbnail */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-card">
          {isValidUrl ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              {course.thumbnail || "📚"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent" />

          {/* Price Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-black/60 border border-white/10 px-3 py-1.5 backdrop-blur-sm">
            <IconCurrencyRupee size={14} className="text-success" />
            <span className="text-sm font-extrabold text-white">
              {course.price > 0 ? course.price.toLocaleString("en-IN") : "Free"}
            </span>
          </div>

          {/* Enrolled badge */}
          {course.isEnrolled && (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-success/80 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
              <IconCheck size={12} /> Enrolled
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
              {course.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              by <span className="text-white/70 font-medium">{course.instructor}</span>
            </p>
          </div>

          {/* Tags */}
          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {course.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta Row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconClock size={13} /> {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <IconUsers size={13} /> {course.nextBatch}
            </span>
            <span className="flex items-center gap-1">
              <IconPlayerPlay size={13} />{" "}
              {course.curriculum.reduce((s, m) => s + m.sessions, 0)} sessions
            </span>
          </div>

          {/* Curriculum Preview */}
          {course.curriculum.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Curriculum
              </p>
              {course.curriculum.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-3 py-1.5 text-xs"
                >
                  <span className="text-white/80 truncate">{m.title}</span>
                  <span className="text-muted-foreground text-[10px] shrink-0 ml-2">
                    {m.sessions} session{m.sessions !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
              {course.curriculum.length > 3 && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-[10px] text-primary font-semibold hover:underline"
                >
                  +{course.curriculum.length - 3} more modules
                </button>
              )}
            </div>
          )}

          {/* What You'll Learn */}
          {course.whatYouLearn.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                What You&apos;ll Learn
              </p>
              <ul className="space-y-0.5">
                {course.whatYouLearn.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                    <IconCheck size={12} className="text-success mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-3">
            {course.isEnrolled ? (
              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 py-2.5 text-xs font-bold text-success">
                <IconCertificate size={15} /> Already Enrolled
              </div>
            ) : (
              <button
                onClick={() => onEnroll(course.id)}
                disabled={isProcessing === course.id}
                className="btn-primary w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing === course.id ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <IconShoppingCart size={16} />
                    {course.price > 0 ? `Buy ₹${course.price.toLocaleString("en-IN")}` : "Enroll Free"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1628] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">{course.title}</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Full Curriculum</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {course.curriculum.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-4 py-2.5 text-sm"
                >
                  <span className="text-white/90">
                    <span className="text-muted-foreground mr-2">Module {i + 1}:</span>
                    {m.title}
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">
                    {m.sessions} session{m.sessions !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Catalogue Page ────────────────────────────────────────────────────────

export default function CourseCataloguePage() {
  const [courses, setCourses] = useState<CatalogueCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchCatalogue = useCallback(async () => {
    try {
      const data = await api.get<{ courses: CatalogueCourse[] }>("/api/courses/catalogue");
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error("Failed to fetch catalogue:", err);
      toast.error("Failed to load courses. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  // Filter by search term
  const filtered = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Razorpay Checkout Flow
  const handleEnroll = async (courseId: string) => {
    setIsProcessing(courseId);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setIsProcessing(null);
        return;
      }

      // 2. Create order via our API
      const orderData = await api.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        enrollmentId: string;
        paymentId: string;
      }>("/api/payments/order", { courseId });

      const course = courses.find((c) => c.id === courseId);

      // 3. Open Razorpay Checkout
      const options: any = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Marvel Slice LMS",
        description: course?.title || "Course Enrollment",
        order_id: orderData.orderId,
        prefill: {},
        theme: { color: "#6d7dff" },
        handler: async function (response: any) {
          // 4. Verify payment on our backend
          try {
            await api.post("/api/payments/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              enrollmentId: orderData.enrollmentId,
            });

            toast.success("🎉 Payment successful! You are now enrolled.");

            // Refresh catalogue to show updated enrollment state
            fetchCatalogue();
          } catch (verifyErr: any) {
            toast.error(verifyErr.message || "Payment verification failed.");
          } finally {
            setIsProcessing(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment was cancelled.");
            setIsProcessing(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        toast.error(`Payment failed: ${resp.error?.description || "Unknown error"}`);
        setIsProcessing(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong creating the order.");
      setIsProcessing(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d1a]">
      {/* Inline Animations */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.15); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-50px, 50px) scale(0.85); }
        }
        .animate-float-1 { animation: float-1 16s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 18s ease-in-out infinite; }
      `}</style>

      {/* Background Blobs */}
      <div className="absolute top-[5%] left-[10%] h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float-1 pointer-events-none" />
      <div className="absolute bottom-[5%] right-[5%] h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-float-2 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="text-base font-black text-white tracking-tight">
              Marvel<span className="text-primary">Slice</span>
            </span>
          </div>
          <a
            href="/login"
            className="btn-primary text-sm py-2 px-5 rounded-xl font-semibold"
          >
            Login / Sign Up
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-5">
          <IconSparkles size={14} /> Course Catalogue
        </div>
        <h1 className="text-4xl font-black text-white md:text-5xl tracking-tight leading-tight">
          Invest in your future.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
            Learn from the best.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Browse our published courses, enroll, and pay securely with Razorpay. Your learning journey starts here.
        </p>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-md relative">
          <IconSearch
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, instructors, tags…"
            className="field pl-11 border-white/10 bg-white/[0.03] text-white placeholder:text-muted rounded-xl"
          />
        </div>
      </section>

      {/* Course Grid */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <IconLoader2 size={32} className="animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading courses…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-3">📚</span>
            <h3 className="text-xl font-bold text-white">No courses found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "No published courses are available right now. Please log in to see the catalogue."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs font-semibold text-muted-foreground">
              Showing {filtered.length} course{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#060a15] py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Marvel Slice LMS. Powered by{" "}
          <span className="text-primary font-semibold">Razorpay</span> for secure payments.
        </p>
      </footer>
    </div>
  );
}
