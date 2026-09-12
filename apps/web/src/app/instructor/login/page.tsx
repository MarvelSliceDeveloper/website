"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconLock,
  IconChalkboard,
  IconAlertTriangle,
  IconArrowRight,
  IconFileCheck,
  IconVideo,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import TwoFactorLogin from "@/components/TwoFactorLogin";
import type { LoginInput } from "@lms/config";

function InstructorLoginContent() {
  usePageTitle("Instructor Portal - Login");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Read ?redirect= from query string without breaking Suspense
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect && redirect.startsWith("/instructor")) {
        setRedirectUrl(redirect);
      }
    }
  }, []);

  // Mouse-driven parallax effect for background layers
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    let raf = 0;
    let latest: { x: number; y: number } | null = null;
    const handleMouseMove = (e: MouseEvent) => {
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
    setRoleError(null);
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const result = await api.post<{
        user?: {
          role?: string;
          mustChangePassword?: boolean;
          onboardingComplete?: boolean;
        };
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

      const role = result?.user?.role;

      // Restrict access: STRICTLY INSTRUCTOR ONLY (no student, admin, or super admin)
      if (role !== "INSTRUCTOR") {
        // Invalidate the session cookie immediately so no session persists here
        try {
          await api.post("/api/auth/logout");
        } catch {
          /* ignore */
        }

        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          setRoleError(
            "Administrator account detected. This portal is strictly for Instructors only. Please sign in via the main login page.",
          );
        } else {
          setRoleError(
            "Access restricted: This portal is strictly for Instructors only. Students and other users must sign in via the main login page.",
          );
        }
        toast.error("Access denied: Instructor accounts only.");
        return;
      }

      toast.success("Signed in to Instructor Portal");

      if (result?.user?.mustChangePassword) {
        router.push("/set-password");
        return;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      if (result?.user?.onboardingComplete) {
        router.push("/instructor/dashboard");
      } else {
        router.push("/instructor/onboarding");
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Login failed. Please verify your instructor credentials.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorComplete = async (result: {
    token: string;
    user: {
      role?: string;
      mustChangePassword?: boolean;
      onboardingComplete?: boolean;
    };
  }) => {
    const role = result?.user?.role;

    // Restrict access: STRICTLY INSTRUCTOR ONLY (no student, admin, or super admin)
    if (role !== "INSTRUCTOR") {
      try {
        await api.post("/api/auth/logout");
      } catch {
        /* ignore */
      }

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        setRoleError(
          "Administrator account detected. This portal is strictly for Instructors only. Please sign in via the main login page.",
        );
      } else {
        setRoleError(
          "Access restricted: This portal is strictly for Instructors only. Students and other users must sign in via the main login page.",
        );
      }
      toast.error("Access denied: Instructor accounts only.");
      setShowTwoFactor(false);
      setTempToken(null);
      return;
    }

    toast.success("Signed in to Instructor Portal");

    if (result?.user?.mustChangePassword) {
      router.push("/set-password");
      return;
    }

    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    if (result?.user?.onboardingComplete) {
      router.push("/instructor/dashboard");
    } else {
      router.push("/instructor/onboarding");
    }
  };

  const handleCancelTwoFactor = () => {
    setShowTwoFactor(false);
    setTempToken(null);
    setTwoFactorEmail("");
  };

  return (
    <div className="min-h-dvh bg-[#EEF2F7] relative flex items-center justify-center px-3 py-4 sm:p-6 lg:p-8 overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Geometric Grid Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-50 transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(to right, #CBD5E1 1px, transparent 1px),
            linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)
          `,
          backgroundSize: "3rem 3rem",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 100%)",
          transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0)`,
        }}
      />

      {/* Micro Dot Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundImage: "radial-gradient(#0055FE 1px, transparent 1px)",
          backgroundSize: "1.5rem 1.5rem",
          transform: `translate3d(${mouse.x * 14}px, ${mouse.y * 14}px, 0)`,
        }}
      />

      {/* Dynamic Ambient Glow Orbs */}
      <div
        className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#FF5E14]/30 via-[#FF8A48]/20 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `translate3d(${mouse.x * -25}px, ${mouse.y * -25}px, 0)`,
        }}
      />
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0055FE]/25 via-[#3B82F6]/15 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)`,
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#FFD8C2] via-[#FFEBE0]/70 to-transparent blur-3xl pointer-events-none transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `translate3d(${mouse.x * -18}px, ${mouse.y * -18}px, 0)`,
        }}
      />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-[1140px] my-auto rounded-2xl sm:rounded-[28px] overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.14)] border border-slate-100 grid grid-cols-1 lg:grid-cols-2">
        {/* ─── Hero Section (Desktop Only) ─── */}
        <section className="hidden lg:flex relative bg-gradient-to-br from-[#0B1528] via-[#0F2347] to-[#0038A8] p-8 xl:p-10 flex-col justify-between overflow-hidden text-white lg:min-h-[520px]">
          {/* Subtle Radial Grid */}
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(#FFFFFF 1.5px, transparent 1.5px)",
              backgroundSize: "1.25rem 1.25rem",
            }}
          />

          {/* Ambient Glows */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#FF5E14]/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#0055FE]/40 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 pt-2">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-2xl bg-white shadow-2xl shadow-black/30 border border-white/90 flex items-center justify-center p-2 shrink-0 transition-transform hover:scale-105">
                <Image
                  src="/images/Marvel_logo.png"
                  alt="Marvel Slice Logo"
                  width={80}
                  height={80}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-3xl xl:text-4xl font-black text-white tracking-tight">
                  <span className="text-[#175cdd]">Marvel</span> <span className="text-[#f59e0b]">Slice</span>
                </span>
                <span className="block text-[11px] font-bold tracking-widest uppercase text-orange-300 mt-0.5">
                  Instructor & Faculty Portal
                </span>
              </div>
            </div>

            <h1 className="mt-6 xl:mt-7 text-3xl xl:text-[2.25rem] font-black leading-[1.15] tracking-tight">
              Empower <br />
              minds, <br />
              <span className="text-[#FF5E14]">lead tomorrow.</span>
            </h1>
            <p className="mt-2.5 text-xs xl:text-sm text-white/80 leading-relaxed max-w-sm font-medium">
              Manage student cohorts, conduct live interactive sessions, evaluate
              assignments, and guide the next generation of engineers.
            </p>
          </div>

          {/* Feature Highlights for Instructors */}
          <div className="relative z-10 my-4 space-y-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/15 flex items-center gap-4 text-white transition-transform hover:scale-[1.01]">
              <div className="w-11 h-11 rounded-xl bg-orange-500/20 text-[#FF8A48] flex items-center justify-center shrink-0 border border-orange-500/30">
                <IconVideo className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">
                  Live Interactive Classrooms
                </h4>
                <p className="text-xs text-white/70 mt-0.5">
                  Host Microsoft Teams sessions with automatic attendance
                  sync.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/15 flex items-center gap-4 text-white transition-transform hover:scale-[1.01]">
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/30">
                <IconFileCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">
                  Evaluation & Cohort Analytics
                </h4>
                <p className="text-xs text-white/70 mt-0.5">
                  Review student assignments, grade quizzes, and deliver
                  impactful mentorship.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/70">
            <span className="flex items-center gap-2 font-medium">
              <IconChalkboard className="w-4 h-4 text-[#FF8A48]" />
              Dedicated Faculty Access
            </span>
            <Link
              href="/login"
              className="text-white/90 hover:text-white font-semibold underline underline-offset-4 transition-colors"
            >
              Student Portal &rarr;
            </Link>
          </div>
        </section>

        {/* ─── Form Section ─── */}
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-[#FF5E14] text-[11px] font-bold mt-3 uppercase tracking-wider">
                <IconChalkboard className="w-3.5 h-3.5" />
                Instructor Portal
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                Welcome, Educator!
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Log in with your instructor account to manage courses & batches
              </p>
            </div>

            {/* Role Guard Alert Banner (if student enters credentials here) */}
            {roleError && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-slate-800">
                <div className="flex items-start gap-2.5">
                  <IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-amber-950">{roleError}</p>
                    <div className="mt-2">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:underline"
                      >
                        <span>Go to Main Login</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <label
                    htmlFor="instructor-email"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Instructor Email Address
                  </label>
                  <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
                      <IconMail className="w-4 h-4" />
                    </div>
                    <input
                      id="instructor-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="instructor@marvelslice.com"
                      required
                      className="auth-input w-full h-9 bg-transparent px-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="instructor-password"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative group flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/60 focus-within:bg-white focus-within:border-[#FF5E14] focus-within:ring-2 focus-within:ring-[#FF5E14]/20 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF5E14] flex items-center justify-center shrink-0 transition-colors group-focus-within:bg-[#FF5E14] group-focus-within:text-white shadow-xs">
                      <IconLock className="w-4 h-4" />
                    </div>
                    <input
                      id="instructor-password"
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                  className="w-full h-11 mt-4 rounded-xl font-semibold text-sm text-white bg-[#FF5E15] shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Signing in..." : "Sign In to Instructor Portal"}
                </button>
              </form>
            )}

            {/* Link back to Student Login */}
            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Looking for student learning courses?{" "}
                <Link
                  href="/login"
                  className="text-[#0052CC] font-bold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <span>Student Login</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </p>
            </div>

            {/* Quick Fill in Dev */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Quick Dev Fill
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("instructor@lms.local");
                      setPassword("instructor123");
                      toast.info("Filled Instructor credentials");
                    }}
                    className="rounded-lg border border-orange-200 bg-orange-50/70 px-3 py-1.5 text-[11px] font-bold text-[#FF5E14] hover:bg-orange-100/70 active:scale-95 transition-all"
                  >
                    Fill Instructor (instructor@lms.local)
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function InstructorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#EEF2F7]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#FF5E14]" />
        </div>
      }
    >
      <InstructorLoginContent />
    </Suspense>
  );
}
