"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMail, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { api } from "@/lib/api";

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
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <section className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-12 lg:flex lg:w-[55%]">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)" }} />
        <div className="relative z-10 pt-14" style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
              <img src="/images/logo.svg" alt="Marvel Slice" className="h-7 w-auto object-contain" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">Marvel Slice</span>
          </div>
        </div>
        <div className="relative z-10 mt-20 max-w-lg" style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" }}>
          <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">Forgot Your Password?</h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            No worries. Enter your email and we will send you a link to reset it.
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]" style={{ animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
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
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
                  <h2 className="text-[22px] font-bold text-foreground text-center">Reset Password</h2>
                  <p className="mt-1 text-sm text-muted-foreground text-center">
                    Enter your registered email address.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {submitting ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
