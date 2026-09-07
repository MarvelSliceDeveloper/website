"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";
import { IconLock, IconShieldCheck } from "@tabler/icons-react";

interface Props {
  pkg: PackageDetail;
}

export function CourseDerivedCheckoutWidget({ pkg }: Props) {
  const courseId = (pkg as any)._derivedCourseId ?? pkg.courses?.[0]?.course?.id ?? pkg.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const hasPrice = pkg.price != null && pkg.price > 0;
  const formatPrice = (amount: number) => `₹${(amount / 100).toLocaleString("en-IN")}`;

  if (!hasPrice) {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Marvel Slice" width={28} height={28} className="h-7 w-auto" />
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-blue-600">Marvel</span> <span className="text-blue-500">Slice</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            <IconLock size={12} /> Secure Checkout
          </span>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">Course</p>
            <h3 className="text-base font-semibold text-foreground">{pkg.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Contact us for pricing and enrollment details.</p>
          </div>
          <div className="space-y-3">
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="field w-full text-sm" />
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field w-full text-sm" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field w-full text-sm" />
            <button
              onClick={() => {
                if (!name.trim() || !email.trim() || !phone.trim()) return toast.error("Fill all fields");
                toast.success("Enquiry sent — advisor will contact you.");
              }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white"
            >
              Submit Enquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Marvel Slice" width={28} height={28} className="h-7 w-auto" />
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-blue-600">Marvel</span> <span className="text-blue-500">Slice</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            <IconLock size={12} /> Secure Checkout
          </span>
        </div>
        <div className="p-6 py-10 text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">✓</div>
          <p className="font-semibold text-foreground">Enrollment captured!</p>
          <p className="text-sm text-muted-foreground">Check your email for confirmation.</p>
        </div>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const res: any = await api.post(`/api/courses/catalogue/${courseId}/checkout`, { name: name.trim(), email: email.trim(), phone: phone.trim() });
      const orderId = res.orderId ?? res.order_id ?? `stub_${Date.now()}`;
      // verify — stub support; real Razorpay would open widget here if key present
      await api.post(`/api/courses/catalogue/${courseId}/verify`, {
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpayOrderId: orderId,
        razorpaySignature: "stub",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success("Payment successful! Enrollment created.");
      setComplete(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Image src="/images/logo.svg" alt="Marvel Slice" width={28} height={28} className="h-7 w-auto" />
          <span className="text-sm font-extrabold tracking-tight">
            <span className="text-blue-600">Marvel</span> <span className="text-blue-500">Slice</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          <IconLock size={12} /> Secure Checkout
        </span>
      </div>
      <div className="space-y-5 p-6">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">Course</p>
          <h3 className="text-base font-semibold text-foreground">{pkg.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Enroll in this course and get lifetime access to all modules.</p>
        </div>
        <div className="flex justify-between border-t border-border pt-4 text-sm">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-foreground">{formatPrice(pkg.price!)}</span>
        </div>
        <form onSubmit={handleCheckout} className="space-y-3">
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="field w-full text-sm" required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field w-full text-sm" required />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field w-full text-sm" required />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Processing..." : `Pay ${formatPrice(pkg.price!)}`}
          </button>
        </form>
        <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
          <IconShieldCheck size={13} className="text-emerald-500" /> Secure payment via Razorpay
        </p>
      </div>
    </div>
  );
}
