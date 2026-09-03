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
  IconLock,
  IconShieldCheck,
  IconArrowLeft,
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
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <IconCheck size={30} stroke={2.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Password Reset Complete!
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          Your password has been updated. You can now log in with your new credentials.
        </p>
        <Link
          href="/login"
          className="mt-6 w-full h-11 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF5E14] via-[#D83A00] to-[#0A47BF] shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <IconKey size={18} />
          <span>Log In Now</span>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <IconX size={30} stroke={2.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Invalid Reset Link</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 text-xs font-bold text-[#0052CC] hover:underline cursor-pointer inline-block"
        >
          Request a new link &rarr;
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        {/* New Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            New Password
          </label>
          <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
              <IconLock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              className="auth-input w-full h-9 bg-transparent px-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <IconEyeOff size={18} stroke={1.8} />
              ) : (
                <IconEye size={18} stroke={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
              <IconLock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="auth-input w-full h-9 bg-transparent px-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Password Requirements
          </p>
          {(["min", "upper", "lower", "digit", "match"] as const).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  checks[key] ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  checks[key] ? "text-emerald-700 font-semibold" : "text-slate-500"
                }`}
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

        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={!allPassed || submitting}
          className="w-full h-11 mt-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF5E14] via-[#D83A00] to-[#0A47BF] shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Resetting Password..." : "Reset Password"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-[#0052CC] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <IconArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-[#EEF2F7] relative flex items-center justify-center px-3 py-4 sm:p-6 lg:p-8 overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* ─── ENHANCED BACKGROUND DESIGN SYSTEM (EXACT MATCH TO LOGIN) ─── */}
      
      {/* 1. Geometric Grid Overlay with Radial Vignette Mask */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, #CBD5E1 1px, transparent 1px),
            linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)
          `,
          backgroundSize: "3rem 3rem",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
        }}
      />

      {/* 2. Micro Dot Pattern Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#0055FE 1px, transparent 1px)",
          backgroundSize: "1.5rem 1.5rem",
        }}
      />

      {/* 3. Dynamic Vector Wavy Rays & Tech Nodes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bg-line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5E14" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0055FE" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="bg-line-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0055FE" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF5E14" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M-100,200 C300,100 500,600 1200,300 C1500,200 1800,500 2200,400"
          fill="none"
          stroke="url(#bg-line-grad-1)"
          strokeWidth="2.5"
          strokeDasharray="8 8"
        />
        <path
          d="M-200,650 C400,850 700,250 1400,750 C1700,950 1900,450 2300,550"
          fill="none"
          stroke="url(#bg-line-grad-2)"
          strokeWidth="2"
        />
        <circle cx="300" cy="150" r="4" fill="#FF5E14" opacity="0.6" />
        <circle cx="1200" cy="300" r="5" fill="#0055FE" opacity="0.6" />
        <circle cx="700" cy="600" r="3" fill="#6366F1" opacity="0.6" />
      </svg>

      {/* 4. Multi-Layered Ambient Glow Orbs */}
      <div className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#FF5E14]/30 via-[#FF8A48]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0055FE]/25 via-[#3B82F6]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#6366F1]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#FFD8C2] via-[#FFEBE0]/70 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#F59E0B]/20 to-transparent blur-3xl pointer-events-none" />

      {/* 5. Inset Tech Accents & Abstract Geometry */}
      <div className="hidden lg:block absolute top-12 right-12 w-28 h-28 rounded-full border-[10px] border-white/50 shadow-2xl backdrop-blur-xs pointer-events-none animate-pulse opacity-70" />
      <div className="hidden lg:flex absolute top-12 left-12 items-center justify-center w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-lg pointer-events-none text-[#0055FE]">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div className="hidden lg:block absolute bottom-12 left-12 w-20 h-20 rounded-full border-4 border-dashed border-orange-500/25 pointer-events-none animate-[spin_20s_linear_infinite]" />
      <div className="hidden lg:grid absolute bottom-8 right-8 z-0 grid-cols-5 gap-2.5 opacity-30 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        ))}
      </div>
      <div className="hidden lg:grid absolute top-8 left-28 z-0 grid-cols-4 gap-2 opacity-25 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" />
        ))}
      </div>

      {/* ─── MAIN CONTAINER CARD ─── */}
      <div className="relative z-10 w-full max-w-[1140px] my-auto rounded-2xl sm:rounded-[28px] overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.14)] border border-slate-100 grid grid-cols-1 lg:grid-cols-2">
        
        {/* ─── Left Hero Section: HIDDEN ON MOBILE ─── */}
        <section className="hidden lg:flex relative bg-gradient-to-br from-[#0055FE] via-[#0047BA] to-[#0038A8] p-8 xl:p-10 flex-col justify-between overflow-hidden text-white lg:min-h-[500px]">
          {/* Subtle Background Radial Grid overlay inside hero card */}
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: "radial-gradient(#FFFFFF 1.5px, transparent 1.5px)",
              backgroundSize: "1.25rem 1.25rem",
            }}
          />

          {/* Ambient Glowing Orbs */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#FF5E14]/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#0055FE]/40 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 pt-3">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-3xl bg-white shadow-2xl shadow-black/20 border border-white/90 flex items-center justify-center p-2.5 shrink-0 transition-transform hover:scale-105">
                <Image
                  src="/images/Marvel_logo.png"
                  alt="Marvel Slice Logo"
                  width={96}
                  height={96}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-4xl xl:text-5xl font-black text-white tracking-tight">
                Marvel <span className="text-[#FF8A48]">Slice</span>
              </span>
            </div>

            {/* Header & Typography */}
            <h1 className="mt-6 xl:mt-8 text-3xl xl:text-[2.25rem] font-black leading-[1.1] tracking-tight">
              Reset <br />
              your <br />
              <span className="text-[#FF5E14]">password.</span>
            </h1>
            <p className="mt-2.5 text-xs xl:text-sm text-white/85 leading-relaxed max-w-sm font-medium">
              Choose a new password for your account. Make sure it meets our complexity standards for your security.
            </p>
          </div>

          {/* Middle Stacked Feature Cards */}
          <div className="relative z-10 my-4 space-y-3">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/80 flex items-center gap-4 text-slate-800 transition-transform hover:scale-[1.01]">
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0">
                <IconKey size={24} stroke={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  High-Entropy Security
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strong passwords keep your progress & certificates safe.
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/80 flex items-center gap-4 text-slate-800 transition-transform hover:scale-[1.01]">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-[#0047BA] flex items-center justify-center shrink-0">
                <IconShieldCheck size={24} stroke={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  Instant Access
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resume your courses immediately after setting your new key.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof Bar */}
          <div className="relative z-10 flex items-center gap-3 pt-1">
            <div className="flex items-center -space-x-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-[#0047BA] flex items-center justify-center text-[10px] font-extrabold text-amber-950 shadow-sm">
                JK
              </div>
              <div className="w-7 h-7 rounded-full bg-[#FF5E14] border-2 border-[#0047BA] flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">
                MR
              </div>
              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-[#0047BA] flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">
                +
              </div>
            </div>
            <p className="text-xs text-white/90 font-medium">
              <strong className="text-white font-bold">12,400</strong> learners active on the platform
            </p>
          </div>
        </section>

        {/* ─── Right Form Section: FULL WIDTH ON MOBILE ─── */}
        <section className="bg-white px-5 py-6 sm:px-8 sm:py-8 lg:p-10 flex flex-col justify-center relative">
          <div className="w-full max-w-[440px] mx-auto">
            {/* Logo Badge & Header */}
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-[0_12px_35px_-8px_rgba(255,94,20,0.20)] border border-slate-100 flex items-center justify-center p-2.5 mx-auto transition-transform hover:scale-105">
                <Image
                  src="/images/Marvel_logo.png"
                  alt="Marvel Slice Logo"
                  width={96}
                  height={96}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
                Marvel <span className="text-[#FF5E14]">Slice</span>
              </h2>

              <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900">
                Set New Password
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Create a strong password for your account
              </p>
            </div>

            <Suspense
              fallback={
                <div className="mt-6 text-center text-xs text-slate-400 py-8">
                  Loading reset details...
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
