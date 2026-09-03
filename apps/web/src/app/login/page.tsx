"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconLock,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import TwoFactorLogin from "@/components/TwoFactorLogin";
import type { LoginInput } from "@lms/config";

// ── Main Login Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  usePageTitle("Login");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");

  // ── Mouse-driven parallax for background layers (rAF-throttled) ───────
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Skip on touch-only devices — no meaningful mouse movement to track
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    let raf = 0;
    let latest: { x: number; y: number } | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to roughly -1 → 1 relative to viewport center
      latest = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (latest) setMouse(latest);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const result = await api.post<{
        user?: { role?: string; mustChangePassword?: boolean };
        requires2fa?: boolean;
        tempToken?: string;
      }>("/api/auth/login", {
        email: normalizedEmail,
        password,
        rememberMe,
      } satisfies LoginInput);

      if (result?.requires2fa && result?.tempToken) {
        setTempToken(result.tempToken);
        setTwoFactorEmail(normalizedEmail);
        setShowTwoFactor(true);
        return;
      }

      toast.success("Signed in successfully");
      const role = result?.user?.role;

      if (result?.user?.mustChangePassword) {
        router.push("/set-password");
        return;
      }

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
        return;
      }
      if (role === "INSTRUCTOR") {
        router.push("/instructor/onboarding");
        return;
      }
      router.push("/student/");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorComplete = (result: { token: string; user: { role?: string; mustChangePassword?: boolean } }) => {
    toast.success("Signed in successfully");
    const role = result?.user?.role;

    if (result?.user?.mustChangePassword) {
      router.push("/set-password");
      return;
    }

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
    if (role === "INSTRUCTOR") {
      router.push("/instructor/onboarding");
      return;
    }
    router.push("/student/");
  };

  const handleCancelTwoFactor = () => {
    setShowTwoFactor(false);
    setTempToken(null);
    setTwoFactorEmail("");
  };

  const devAccounts = [
    { label: "Student", email: "student@lms.local", pw: "student123" },
    { label: "Instructor", email: "instructor@lms.local", pw: "instructor123" },
    { label: "Admin", email: "admin@lms.local", pw: "admin123" },
    { label: "Super Admin", email: "superadmin@lms.local", pw: "superadmin123" },
  ] as const;

  return (
    <div className="min-h-dvh bg-[#EEF2F7] relative flex items-center justify-center px-3 py-4 sm:p-6 lg:p-8 overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* ─── ENHANCED BACKGROUND DESIGN SYSTEM ─── */}

      {/* 1. Geometric Grid Overlay with Radial Vignette Mask */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-50 transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(to right, #CBD5E1 1px, transparent 1px),
            linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)
          `,
          backgroundSize: "3rem 3rem",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
          transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0)`,
        }}
      />

      {/* 2. Micro Dot Pattern Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: "radial-gradient(#0055FE 1px, transparent 1px)",
          backgroundSize: "1.5rem 1.5rem",
          transform: `translate3d(${mouse.x * 14}px, ${mouse.y * 14}px, 0)`,
        }}
      />

      {/* 3. Dynamic Vector Wavy Rays & Tech Nodes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0 transition-transform duration-500 ease-out will-change-transform"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `translate3d(${mouse.x * 12}px, ${mouse.y * 12}px, 0)`,
        }}
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
        {/* Decorative Grid Nodes */}
        <circle cx="300" cy="150" r="4" fill="#FF5E14" opacity="0.6" />
        <circle cx="1200" cy="300" r="5" fill="#0055FE" opacity="0.6" />
        <circle cx="700" cy="600" r="3" fill="#6366F1" opacity="0.6" />
      </svg>

      {/* 4. Multi-Layered Ambient Glow Orbs */}
      {/* Top-Right Vibrant Orange Burst */}
      <div
        className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#FF5E14]/30 via-[#FF8A48]/20 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * -25}px, ${mouse.y * -25}px, 0)` }}
      />

      {/* Top-Left Electric Royal Blue Glow */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0055FE]/25 via-[#3B82F6]/15 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)` }}
      />

      {/* Center Deep Indigo Accent */}
      <div
        className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#6366F1]/10 to-transparent blur-3xl pointer-events-none transition-transform duration-700 ease-out will-change-transform"
        style={{
          transform: `translate(-50%, -50%) translate3d(${mouse.x * 30}px, ${mouse.y * 30}px, 0)`,
        }}
      />

      {/* Bottom-Right Soft Peach Burst */}
      <div
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#FFD8C2] via-[#FFEBE0]/70 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * -18}px, ${mouse.y * -18}px, 0)` }}
      />

      {/* Bottom-Left Amber Gold Spark Accent */}
      <div
        className="absolute -bottom-28 -left-28 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#F59E0B]/20 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * 22}px, ${mouse.y * 22}px, 0)` }}
      />

      {/* 5. Inset Tech Accents & Abstract Geometry (replaces outer corner text badges) */}
      {/* Top-Right Floating Glass Ring */}
      <div
        className="hidden lg:block absolute top-12 right-12 w-28 h-28 rounded-full border-[10px] border-white/50 shadow-2xl backdrop-blur-xs pointer-events-none animate-pulse opacity-70 transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * 10}px, ${mouse.y * 10}px, 0)` }}
      />

      {/* Top-Left Geometric Tech Circle */}
      <div
        className="hidden lg:flex absolute top-12 left-12 items-center justify-center w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-lg pointer-events-none text-[#0055FE] transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * -10}px, ${mouse.y * -10}px, 0)` }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>

      {/* Bottom-Left Ambient Glow Ring */}
      <div className="hidden lg:block absolute bottom-12 left-12 w-20 h-20 rounded-full border-4 border-dashed border-orange-500/25 pointer-events-none animate-[spin_20s_linear_infinite]" />

      {/* Dot Matrix Patterns safely inset in corners */}
      <div
        className="hidden lg:grid absolute bottom-8 right-8 z-0 grid-cols-5 gap-2.5 opacity-30 pointer-events-none transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * 6}px, ${mouse.y * 6}px, 0)` }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        ))}
      </div>
      <div
        className="hidden lg:grid absolute top-8 left-28 z-0 grid-cols-4 gap-2 opacity-25 pointer-events-none transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate3d(${mouse.x * -6}px, ${mouse.y * -6}px, 0)` }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" />
        ))}
      </div>

      {/* ─── Main Container Card ─── */}
      <div className="relative z-10 w-full max-w-[1140px] my-auto rounded-2xl sm:rounded-[28px] overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.14)] border border-slate-100 grid grid-cols-1 lg:grid-cols-2">
        {/* ─── Hero Section: HIDDEN ON MOBILE (only visible on lg+) ─── */}
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

          {/* Top Brand Header (Matching the uploaded image reference - Larger & Shifted Down) */}
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

            {/* 1. Header & Typography (Stacked 3 lines with highlighted 3rd word - Shifted lower down) */}
            <h1 className="mt-6 xl:mt-8 text-3xl xl:text-[2.25rem] font-black leading-[1.1] tracking-tight">
              Your <br />
              skills, <br />
              <span className="text-[#FF5E14]">rewritten.</span>
            </h1>
            <p className="mt-2.5 text-xs xl:text-sm text-white/85 leading-relaxed max-w-sm font-medium">
              Live mentor sessions, hands-on projects, and a learning path that actually ends with career advancement.
            </p>
          </div>

          {/* 2. Middle Stacked Feature Cards (Matching reference card stack) */}
          <div className="relative z-10 my-4 space-y-3">
            {/* Card 1: Course Progress */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/80 flex items-center gap-4 text-slate-800 transition-transform hover:scale-[1.01]">
              <div className="text-2xl xl:text-3xl font-black text-[#FF5E14] shrink-0 w-14 text-center">
                92%
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  Advanced React Patterns
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  3 lessons left before you finish the arc.
                </p>
              </div>
            </div>

            {/* Card 2: Day Streak */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/80 flex items-center gap-4 text-slate-800 transition-transform hover:scale-[1.01]">
              <div className="text-2xl xl:text-3xl font-black text-[#FF5E14] shrink-0 w-14 text-center">
                7
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  Day streak
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep it up — most learners drop off by day 4.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Bottom Social Proof Bar (Avatar Stack + Count) */}
          <div className="relative z-10 flex items-center gap-3 pt-1">
            {/* Avatar Stack */}
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
            {/* Social Text */}
            <p className="text-xs text-white/90 font-medium">
              <strong className="text-white font-bold">12,400</strong> learners started a course this week
            </p>
          </div>
        </section>

        {/* ─── Form Section: FULL WIDTH ON MOBILE ─── */}
        <section className="bg-white px-5 py-6 sm:px-8 sm:py-8 lg:p-10 flex flex-col justify-center relative">
          <div className="w-full max-w-[440px] mx-auto">
            {/* Logo Badge & Header (Enlarged Logo) */}
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
                Welcome back!
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Log in to continue your learning journey
              </p>
            </div>

            {showTwoFactor && tempToken ? (
              <div className="mt-5">
                <TwoFactorLogin
                  tempToken={tempToken}
                  email={twoFactorEmail}
                  rememberMe={rememberMe}
                  onComplete={handleTwoFactorComplete}
                  onCancel={handleCancelTwoFactor}
                />
              </div>
            ) : (
              <form onSubmit={handleSignIn} className="mt-5 space-y-3.5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
                      <IconMail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      required
                      className="auth-input w-full h-9 bg-transparent px-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
                      <IconLock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium py-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#0052CC] accent-[#0052CC] focus:ring-0 cursor-pointer"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-semibold text-[#0052CC] hover:underline transition-colors py-1 shrink-0 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Log In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 mt-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF5E14] via-[#D83A00] to-[#0A47BF] shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Logging in..." : "Log In"}
                </button>
              </form>
            )}

            {/* Footer Link */}
            <p className="text-center mt-5 text-xs text-slate-500 font-medium">
              <Link
                href="/catalogue"
                className="text-[#0052CC] font-bold hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Browse Course Catalogue</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </p>

            {/* Demo Accounts (dev only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Quick Dev Fill
                </p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:justify-center">
                  {devAccounts.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.pw);
                        toast.info(`Filled ${d.label} credentials`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:border-[#0052CC] hover:text-[#0052CC] active:scale-95 transition-all"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}