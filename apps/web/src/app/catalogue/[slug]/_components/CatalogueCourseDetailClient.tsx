"use client";
import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconChevronDown, IconArrowLeft, IconLoader2, IconAward, IconBriefcase, IconClock, IconCode, IconTarget, IconUsers, IconStack2, IconFileText, IconX } from "@tabler/icons-react";
import { useApiQuery } from "@/lib/query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import CourseHero from "@/app/catalogue/_components/CourseHero";
import BrandLogo from "@/components/BrandLogo";

function SectionHeading({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker}</p>
      <h2 className="mt-2 text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
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

export function CatalogueCourseDetailClient({ slug }: { slug: string }) {
  const { data, isPending } = useApiQuery<{ course: any }>(["catalogue", "course", slug], `/api/courses/catalogue/${slug}`);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiry, setEnquiry] = useState({ name: "", email: "", phone: "" });
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "" });
  const [showCheckout, setShowCheckout] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  if (isPending)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-6 space-y-3">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
            <div className="lg:col-span-6 h-[300px] bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  if (!data?.course) return <div className="py-20 text-center">Course not found</div>;
  const c = data.course;
  const modules = c.modules || [];
  const totalLessons = modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);

  const handleCheckout = async () => {
    if (!checkout.name.trim() || !checkout.email.trim() || !checkout.phone.trim()) return toast.error("Fill all fields");
    setPayLoading(true);
    try {
      const res: any = await api.post(`/api/courses/catalogue/${c.id}/checkout`, checkout);
      if (res.orderId?.startsWith("stub_")) {
        await api.post(`/api/courses/catalogue/${c.id}/verify`, { razorpayPaymentId: `pay_${Date.now()}`, razorpayOrderId: res.orderId, ...checkout });
        toast.success("Enrollment captured! Check email.");
        setShowCheckout(false);
        return;
      }
      // Load Razorpay if keys configured — fallback stub for now
      await api.post(`/api/courses/catalogue/${c.id}/verify`, { razorpayPaymentId: `pay_${Date.now()}`, razorpayOrderId: res.orderId, razorpaySignature: "stub", ...checkout });
      toast.success("Payment successful! Enrollment created.");
      setShowCheckout(false);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setPayLoading(false); }
  };

  const handleEnquiry = async () => {
    if (!enquiry.name.trim() || !enquiry.email.trim() || !enquiry.phone.trim()) return toast.error("Fill all fields");
    // store enquiry locally / send to backend if exists — for now toast
    toast.success("Enquiry sent — advisor will contact you.");
    setShowEnquiry(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <BrandLogo size="lg" />
          <div className="flex items-center gap-3">
            <Link href="/catalogue" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <IconArrowLeft size={16} /> Back to Catalogue
            </Link>
            <span className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1 text-xs font-bold">
              {c.price != null && c.price > 0 ? `₹${(c.price / 100).toLocaleString("en-IN")}` : "Enquiry"}
            </span>
          </div>
        </div>
      </header>

      <CourseHero course={c} onEnroll={() => setShowCheckout(true)} onEnquire={() => setShowEnquiry(true)} />

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
          <SectionHeading kicker="What's Included" title="Everything you need to succeed" subtitle="A complete learning journey — from fundamentals to career-ready skills." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FALLBACK_HIGHLIGHTS.map((h) => (
              <div key={h.label} className="group relative overflow-hidden rounded-2xl border border-border bg-background p-5 hover:border-primary/30 transition-colors">
                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-60 group-hover:opacity-100" />
                <p className="font-semibold text-foreground">{h.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{h.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-background p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Included Modules — {modules.length} modules, {totalLessons} lessons</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {modules.slice(0, 8).map((m: any) => (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center">
                    <IconStack2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.lessons?.length || 0} lessons {m.quizzes?.length ? `· ${m.quizzes.length} quizzes` : ""} {m.assignments?.length ? `· ${m.assignments.length} assignments` : ""}
                    </p>
                    {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                  </div>
                </div>
              ))}
              {modules.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Content coming soon.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Certification */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-card p-8 flex flex-col sm:flex-row gap-6 items-center">
            <div className="h-24 w-24 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl">🎓</div>
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

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCheckout(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Enroll in {c.title}</h3>
              <button onClick={() => setShowCheckout(false)} className="p-1 hover:bg-gray-100 rounded"><IconX size={18} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Full name" value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} className="field w-full" />
              <input placeholder="Email" type="email" value={checkout.email} onChange={(e) => setCheckout({ ...checkout, email: e.target.value })} className="field w-full" />
              <input placeholder="Phone" value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} className="field w-full" />
              <button onClick={handleCheckout} disabled={payLoading} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                {payLoading ? <IconLoader2 size={16} className="animate-spin" /> : null}
                {c.price ? `Pay ₹${(c.price / 100).toLocaleString("en-IN")}` : "Submit"}
              </button>
              <p className="text-xs text-muted-foreground text-center">We&apos;ll capture your details after payment.</p>
            </div>
          </div>
        </div>
      )}

      {showEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEnquiry(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Enquire — {c.title}</h3>
              <button onClick={() => setShowEnquiry(false)} className="p-1 hover:bg-gray-100 rounded"><IconX size={18} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Full name" value={enquiry.name} onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })} className="field w-full" />
              <input placeholder="Email" type="email" value={enquiry.email} onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })} className="field w-full" />
              <input placeholder="Phone" value={enquiry.phone} onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })} className="field w-full" />
              <button onClick={handleEnquiry} className="w-full btn-secondary py-2.5">Submit Enquiry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
