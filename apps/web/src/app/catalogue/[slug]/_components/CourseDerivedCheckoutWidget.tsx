"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";
import {
  IconBadge,
  IconCheck,
  IconInfinity,
  IconLock,
  IconMail,
  IconPhone,
  IconReceipt,
  IconRefresh,
  IconShieldCheck,
  IconStack2,
  IconUser,
  IconVideo,
} from "@tabler/icons-react";

interface Props {
  pkg: PackageDetail;
}

interface CheckoutResponse {
  orderId?: string;
  order_id?: string;
}

function formatPrice(amount: number): string {
  return `₹${(amount / 100).toLocaleString("en-IN")}`;
}

function CheckoutHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-2.5">
        <Image
          src="/images/logo.svg"
          alt="Marvel Slice"
          width={28}
          height={28}
          className="h-7 w-auto"
        />
        <span className="text-sm font-extrabold tracking-tight">
          <span className="text-blue-600">Marvel</span>{" "}
          <span className="text-blue-500">Slice</span>
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
        <IconLock size={12} /> Secure Checkout
      </span>
    </div>
  );
}

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border pt-4 text-muted-foreground">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconShieldCheck size={15} className="text-primary" />
        Razorpay Secure
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconReceipt size={15} className="text-primary" />
        Email Invoice
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconRefresh size={15} className="text-primary" />
        Money-back Guarantee
      </span>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-primary/5">
      <div className="h-1 bg-gradient-to-r from-primary via-primary-hover to-primary" />
      <CheckoutHeader />
      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

function Field({
  id,
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="field w-full pl-9! text-sm"
        />
      </div>
    </div>
  );
}

function CourseSummary({ pkg }: { pkg: PackageDetail }) {
  const course = pkg.courses?.[0]?.course;
  const thumbnail = course?.thumbnailUrl ?? null;
  const moduleCount = course?.modules?.length ?? 0;
  const lessons = pkg.totalLessons ?? 0;
  const quizzes = pkg.totalQuizzes ?? 0;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Course
      </p>
      <div className="flex items-start gap-3">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={pkg.name}
            width={80}
            height={56}
            className="h-14 w-20 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white">
            <IconVideo size={22} stroke={1.6} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-foreground">
            {pkg.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <IconInfinity size={13} className="text-primary" />
            Lifetime access to all modules
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <IconStack2 size={12} /> {moduleCount} modules
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <IconVideo size={12} /> {lessons} lessons
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <IconBadge size={12} /> {quizzes} quizzes
        </span>
      </div>
    </div>
  );
}

export function CourseDerivedCheckoutWidget({ pkg }: Props) {
  const courseId =
    pkg._derivedCourseId ?? pkg.courses?.[0]?.course?.id ?? pkg.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const hasPrice = pkg.price != null && pkg.price > 0;

  if (!hasPrice) {
    return (
      <CardShell>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Course
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {pkg.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact us for pricing and enrollment details. Our advisor will
            reach out shortly.
          </p>
        </div>
        <div className="space-y-3">
          <Field
            id="enq-name"
            label="Full name"
            icon={<IconUser size={15} />}
            placeholder="Your full name"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
          <Field
            id="enq-email"
            label="Email"
            icon={<IconMail size={15} />}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            id="enq-phone"
            label="Phone"
            icon={<IconPhone size={15} />}
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
          />
          <button
            type="button"
            onClick={() => {
              if (!name.trim() || !email.trim() || !phone.trim())
                return toast.error("Fill all fields");
              toast.success("Enquiry sent — advisor will contact you.");
            }}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Submit Enquiry
          </button>
        </div>
        <TrustRow />
      </CardShell>
    );
  }

  if (complete) {
    return (
      <CardShell>
        <div className="space-y-3 py-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <IconCheck size={32} className="text-success" stroke={2.5} />
          </div>
          <p className="text-base font-semibold text-foreground">
            Enrollment captured!
          </p>
          <p className="text-sm text-muted-foreground">
            Check your email for confirmation and login details.
          </p>
        </div>
      </CardShell>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim())
      return toast.error("Fill all fields");
    setLoading(true);
    try {
      const res = await api.post<CheckoutResponse>(
        `/api/courses/catalogue/${courseId}/checkout`,
        { name: name.trim(), email: email.trim(), phone: phone.trim() },
      );
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
    <CardShell>
      <CourseSummary pkg={pkg} />

      <div className="space-y-2 rounded-xl bg-muted/40 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatPrice(pkg.price!)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            {formatPrice(pkg.price!)}
          </span>
        </div>
        <p className="text-right text-[11px] text-muted-foreground">
          Inclusive of all taxes
        </p>
      </div>

      <form onSubmit={handleCheckout} className="space-y-3">
        <Field
          id="co-name"
          label="Full name"
          icon={<IconUser size={15} />}
          placeholder="Your full name"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          id="co-email"
          label="Email"
          icon={<IconMail size={15} />}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          id="co-phone"
          label="Phone"
          icon={<IconPhone size={15} />}
          type="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <IconLock size={15} />
              Pay {formatPrice(pkg.price!)}
            </>
          )}
        </button>
      </form>

      <TrustRow />
    </CardShell>
  );
}
