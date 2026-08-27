"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  IconKey,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const checks = {
    min: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };
  const allPassed = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) return;
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully!");
      setDone(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <IconCheck size={28} className="text-success" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground">
          Password Reset
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been reset successfully.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5"
        >
          <IconKey size={16} />
          Log In Now
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
          <IconX size={28} className="text-danger" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground">Invalid Link</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is invalid or missing.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15">
        <IconKey size={22} stroke={1.5} className="text-blue-600" />
      </div>
      <h2 className="text-[22px] font-bold text-foreground text-center">
        Set New Password
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center">
        Choose a strong password.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className="h-11 w-full rounded-md border border-input bg-white px-3 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/10 hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <IconEyeOff size={18} stroke={1.5} />
            ) : (
              <IconEye size={18} stroke={1.5} />
            )}
          </button>
        </div>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />

        <div className="space-y-1.5 rounded-xl border border-border bg-muted/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Requirements
          </p>
          {(["min", "upper", "lower", "digit", "match"] as const).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full ${checks[key] ? "bg-success" : "bg-muted/30"}`}
              />
              <span
                className={`text-xs ${checks[key] ? "text-success" : "text-muted-foreground"}`}
              >
                {key === "min"
                  ? "At least 8 characters"
                  : key === "upper"
                    ? "One uppercase letter"
                    : key === "lower"
                      ? "One lowercase letter"
                      : key === "digit"
                        ? "One number"
                        : "Passwords match"}
              </span>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={!allPassed || submitting}
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
            {submitting ? "Resetting..." : "Reset Password"}
          </span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-page flex min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-background to-background">
      {/* ─── LEFT: Hero Panel ─── */}
      <section
        className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2551d9] to-[#3b82f6] px-12 lg:flex lg:w-[55%]"
      >
        {/* Diagonal stripe texture overlay */}
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
              Reset Your Password
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              Choose a new password for your account. Make sure it is strong and
              unique.
            </p>
          </div>

          {/* Illustration */}
          <div
            className="relative mx-auto mt-10 w-full max-w-[440px] pt-4"
            style={{ animation: "login-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both" }}
          >
            {/* Soft glow behind the scene */}
            <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-2xl" />
            <div style={{ animation: "login-float 10s ease-in-out infinite" }}>
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

      {/* ─── RIGHT: Form Card ─── */}
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
              <Suspense
                fallback={
                  <div className="text-center text-muted-foreground">
                    Loading...
                  </div>
                }
              >
                <ResetPasswordForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
