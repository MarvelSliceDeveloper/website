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
            className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 pr-11 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground"
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
          className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
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
          {submitting ? "Resetting..." : "Reset Password"}
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
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <section className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-12 lg:flex lg:w-[55%]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
          }}
        />
        <div
          className="relative z-10 pt-14"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
              <Image
                src="/images/logo.svg"
                alt="Marvel Slice"
                width={28}
                height={28}
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Marvel Slice
            </span>
          </div>
        </div>
        <div
          className="relative z-10 mt-20 max-w-lg"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
          }}
        >
          <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">
            Reset Your Password
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            Choose a new password for your account. Make sure it is strong and
            unique.
          </p>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div
          className="w-full max-w-[420px]"
          style={{
            animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
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
