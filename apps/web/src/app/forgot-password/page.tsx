"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { IconMail, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { api } from "@/lib/api";

function FloatingShape({
  className,
  delay = 0,
  duration = 10,
}: {
  className: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <div
      className={`absolute rounded-full bg-white/10 ${className}`}
      style={{
        animation: `login-float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page flex min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-background to-background">
      {/* ─── LEFT: Hero Panel ─── */}
      <section className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2551d9] to-[#3b82f6] px-12 lg:flex lg:w-[55%]">
        {/* Dotted grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            opacity: 0.08,
          }}
        />

        {/* Floating ambient shapes */}
        <FloatingShape className="h-16 w-16 top-[12%] right-[18%]" delay={0} duration={10} />
        <FloatingShape className="h-10 w-10 bottom-[28%] left-[8%]" delay={2} duration={12} />
        <FloatingShape className="h-6 w-6 top-[55%] right-[8%]" delay={4} duration={9} />
        <FloatingShape className="h-12 w-12 top-[8%] left-[30%]" delay={1} duration={11} />
        <FloatingShape className="h-8 w-8 bottom-[15%] right-[30%]" delay={3} duration={13} />

        {/* Content column — centered as one balanced block */}
        <div className="relative z-10 flex h-full flex-col justify-center py-16">
          {/* Logo + Brand */}
          <div style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl shadow-black/15">
                <Image
                  src="/images/logo.svg"
                  alt="Marvel Slice"
                  width={48}
                  height={48}
                  priority
                  loading="eager"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <span className="text-4xl font-extrabold tracking-tight text-white">Marvel Slice</span>
            </div>
          </div>

          {/* Headline + Tagline */}
          <div
            className="mt-14 max-w-lg"
            style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" }}
          >
            <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">
              Forgot Your Password?
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              No worries. Enter your email and we will send you a link to reset it.
            </p>
          </div>

          {/* Illustration */}
          <div
            className="relative mx-auto mt-10 w-full max-w-[440px] pt-4"
            style={{ animation: "login-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both" }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-2xl"
            />
            <div style={{ animation: "login-float 9s ease-in-out 1s infinite" }}>
              <Image
                src="/images/login-hero.svg"
                alt=""
                width={440}
                height={270}
                unoptimized
                priority
                className="relative h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── RIGHT: Form Panel ─── */}
      <section
        className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="w-full max-w-[500px]"
          style={{ animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <div className="rounded-xl border border-border bg-white shadow-md">
            <div className="px-8 py-9 sm:px-10 sm:py-10">
              {sent ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                    <IconCheck size={28} className="text-success" />
                  </div>
                  <h2 className="text-[22px] font-bold text-foreground">Check Your Email</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    If an account exists with that email, we have sent a password reset link.
                  </p>
                  <Link
                    href="/login"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    <IconArrowLeft size={16} />
                    Back to Login
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15">
                    <IconMail size={22} stroke={1.5} className="text-blue-600" />
                  </div>
                  <h2 className="text-center text-[22px] font-bold text-foreground">
                    Reset Password
                  </h2>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Enter your registered email address.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {!submitting && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(245,158,11,0.35), transparent)",
                            backgroundSize: "200% 100%",
                            animation: "login-button-shimmer 1.5s linear infinite",
                          }}
                        />
                      )}
                      <span className="relative z-10">
                        {submitting ? "Sending..." : "Send Reset Link"}
                      </span>
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      <IconArrowLeft size={16} />
                      Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
