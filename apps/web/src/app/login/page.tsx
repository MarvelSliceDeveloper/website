"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import TwoFactorLogin from "@/components/TwoFactorLogin";
import type { LoginInput } from "@lms/config";

// ── Palette ─────────────────────────────────────────────────────────────
// Deep Indigo (#312E81 panel / #4338CA interactive) as the primary brand
// color, with a single warm Amber (#F59E0B) accent reserved for the hero
// graphic's focal points (play button, progress, badge) — the one place
// the design "spends" its boldness — so it reads as deliberate, not
// decorative overload.

// ── Floating Shape (ambient decoration for left panel) ─────────────────────

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

// ── Hero Graphic ─────────────────────────────────────────────────────────
// A course-dashboard mockup with a stacked-card depth effect (a second card
// offset behind the main one, suggesting a library of courses rather than a
// single flat screen) plus a floating "progress" chip and completion badge.

function HeroGraphic() {
  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-[440px] pt-4"
      style={{ animation: "login-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both" }}
    >
      {/* Soft glow behind the scene */}
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-2xl" />

      <svg
        viewBox="0 0 440 270"
        className="relative h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* back card (depth layer — offset + dimmer, no shadow of its own) */}
        <rect x="44" y="34" width="368" height="204" rx="14" fill="white" fillOpacity="0.22" />

        {/* main card */}
        <g filter="url(#cardShadow)">
          <rect x="20" y="20" width="380" height="216" rx="14" fill="white" />
        </g>
        {/* title bar */}
        <rect x="20" y="20" width="380" height="30" rx="14" fill="#312E81" fillOpacity="0.06" />
        <circle cx="38" cy="35" r="4" fill="#312E81" fillOpacity="0.2" />
        <circle cx="52" cy="35" r="4" fill="#312E81" fillOpacity="0.2" />
        <circle cx="66" cy="35" r="4" fill="#312E81" fillOpacity="0.2" />
        <rect x="150" y="29" width="130" height="12" rx="6" fill="#312E81" fillOpacity="0.08" />

        {/* video / lesson player pane */}
        <rect x="36" y="62" width="206" height="124" rx="8" fill="#312E81" />
        <circle cx="139" cy="124" r="21" fill="#F59E0B" />
        <path d="M132 113 L151 124 L132 135 Z" fill="#312E81" />
        {/* progress bar under player */}
        <rect x="36" y="198" width="206" height="6" rx="3" fill="#312E81" fillOpacity="0.08" />
        <rect x="36" y="198" width="126" height="6" rx="3" fill="#F59E0B" />
        <rect x="36" y="212" width="86" height="8" rx="4" fill="#312E81" fillOpacity="0.1" />

        {/* lesson list panel */}
        <g>
          <rect x="252" y="62" width="148" height="150" rx="8" fill="#312E81" fillOpacity="0.035" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(266, ${78 + i * 33})`}>
              <circle
                cx="8"
                cy="8"
                r="8"
                fill={i < 2 ? "#312E81" : "white"}
                stroke={i < 2 ? "none" : "#312E81"}
                strokeOpacity={i < 2 ? 0 : 0.18}
                strokeWidth="1.5"
              />
              {i < 2 && (
                <path d="M4.5 8 L7 10.5 L11.5 5.5" stroke="#F59E0B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              <rect x="22" y="3" width="96" height="6" rx="3" fill="#312E81" fillOpacity={i < 2 ? 0.28 : 0.13} />
              <rect x="22" y="13" width="62" height="5" rx="2.5" fill="#312E81" fillOpacity="0.08" />
            </g>
          ))}
        </g>

        {/* filter/shadow defs */}
        <defs>
          <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0f0a3d" floodOpacity="0.25" />
          </filter>
        </defs>
      </svg>

      {/* floating progress chip */}
      <div
        className="absolute -left-3 top-6 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg shadow-black/10"
        style={{ animation: "login-float 9s ease-in-out 1s infinite" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span className="text-xs font-bold text-blue-900">92% complete</span>
      </div>

      {/* floating completion badge */}
      <div
        className="absolute -right-2 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg shadow-black/10"
        style={{ animation: "login-float 8s ease-in-out 0.3s infinite" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <circle cx="12" cy="12" r="12" fill="#F59E0B" fillOpacity="0.12" />
          <path d="M7 12 L10.3 15.3 L17 8.6" stroke="#F59E0B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

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

  const handleTwoFactorComplete = (result: { token: string; user: any }) => {
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

  return (
    <div className="login-page flex min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-background to-background">
      {/* ─── LEFT: Hero Panel (hidden on mobile/tablet, preserved lg:flex breakpoint) ─── */}
      <section
        className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2551d9] to-[#3b82f6] px-12 lg:flex lg:w-[55%]"
      >
        {/* Dotted grid overlay — was diagonal stripes */}
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
                  width={64}
                  height={64}
                  priority
                  loading="eager"
                  className="h-18 w-auto object-contain"
                />
              </div>
              <span className="text-4xl font-extrabold tracking-tight text-white">
                Marvel Slice
              </span>
            </div>
          </div>

          {/* Headline + Tagline */}
          <div
            className="mt-14 max-w-lg"
            style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" }}
          >
            <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">
              Master New Skills
              <br />
              With Expert Mentors
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              Live sessions, structured courses, and hands-on projects — everything
              you need to advance your career in one place.
            </p>
          </div>

          {/* Hero graphic */}
          <HeroGraphic />
        </div>
      </section>

      {/* ─── RIGHT: Login Form ─── */}
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
              {/* Logo + Heading */}
              <div
                className="flex flex-col items-center text-center"
                style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
              >
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    width={56}
                    height={56}
                    priority
                    loading="eager"
                    className="h-14 w-auto object-contain"
                  />
                  <span className="text-2xl font-extrabold tracking-tight">
                    <span className="text-primary">Marvel</span>{" "}
                    <span className="text-primary/80">Slice</span>
                  </span>
                </div>

                <h2 className="mt-5 text-[22px] font-bold text-foreground">
                  Welcome back!
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log in to continue your learning journey
                </p>
              </div>

              {showTwoFactor && tempToken ? (
                <div
                  className="mt-7"
                  style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both" }}
                >
                  <TwoFactorLogin
                    tempToken={tempToken}
                    email={twoFactorEmail}
                    rememberMe={rememberMe}
                    onComplete={handleTwoFactorComplete}
                    onCancel={handleCancelTwoFactor}
                  />
                </div>
              ) : (
                <form
                  onSubmit={handleSignIn}
                  className="mt-7 space-y-4"
                  style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" }}
                >
                  {/* Email */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />

                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-11 w-full rounded-md border border-input bg-white px-3 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/10 hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff size={18} stroke={1.5} /> : <IconEye size={18} stroke={1.5} />}
                    </button>
                  </div>

                  {/* Remember / Forgot */}
                  <div className="flex items-center justify-between text-[13px]">
                    <label className="flex cursor-pointer select-none items-center gap-1.5 text-muted transition-colors hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-blue-600"
                      />
                      Remember Me
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Log In */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {/* Shimmer overlay sits on its own layer so it never washes out the label text */}
                    {!isSubmitting && (
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
                      {isSubmitting ? "Logging in..." : "Log In"}
                    </span>
                  </button>
                </form>
              )}

              {/* Catalogue Link */}
              <div
                className="mt-4 text-center"
                style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both" }}
              >
                <Link href="/catalogue" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
                  Browse our course packages
                </Link>
              </div>

              {/* Footer Links */}
              <div
                className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both" }}
              >
                <Link href="/pages/about" className="transition-colors hover:text-foreground">About Us</Link>
                <span>·</span>
                <Link href="/pages/terms" className="transition-colors hover:text-foreground">Terms &amp; Conditions</Link>
                <span>·</span>
                <Link href="/pages/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
              </div>

              {/* Demo Accounts (dev only) */}
              {process.env.NODE_ENV === "development" && (
                <div
                  className="mt-6 rounded-md border border-dashed border-border bg-muted/20 p-4"
                  style={{ animation: "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both" }}
                >
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Demo Accounts (dev only)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Student", email: "student@lms.local", pw: "student123" },
                      { label: "Instructor", email: "instructor@lms.local", pw: "instructor123" },
                      { label: "Admin", email: "admin@lms.local", pw: "admin123" },
                      { label: "Super Admin", email: "superadmin@lms.local", pw: "superadmin123" },
                    ].map((d) => (
                      <button
                        key={d.email}
                        type="button"
                        onClick={() => {
                          setEmail(d.email);
                          setPassword(d.pw);
                          toast.info(`Filled ${d.label} credentials`);
                        }}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:border-blue-600 hover:text-blue-600 active:scale-95"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}