"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconSchool,
  IconBooks,
  IconStar,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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

// ── Feature Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm ring-1 ring-white/20"
      style={{
        animation: `login-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
        {icon}
      </div>
      <span className="text-lg font-extrabold text-white">{value}</span>
      <span className="text-[11px] font-medium text-white/70">{label}</span>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const result = await api.post<{
        user?: { role?: string; mustChangePassword?: boolean };
      }>("/api/auth/login", {
        email: normalizedEmail,
        password,
      });

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
        router.push("/instructor/dashboard");
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

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* ─── LEFT: Hero Panel (hidden on mobile/tablet) ─── */}
      <section className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] px-12 lg:flex lg:w-[55%]">
        {/* Diagonal stripe texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
          }}
        />

        {/* Floating ambient shapes */}
        <FloatingShape
          className="h-16 w-16 top-[12%] right-[18%]"
          delay={0}
          duration={10}
        />
        <FloatingShape
          className="h-10 w-10 bottom-[28%] left-[8%]"
          delay={2}
          duration={12}
        />
        <FloatingShape
          className="h-6 w-6 top-[55%] right-[8%]"
          delay={4}
          duration={9}
        />
        <FloatingShape
          className="h-12 w-12 top-[8%] left-[30%]"
          delay={1}
          duration={11}
        />
        <FloatingShape
          className="h-8 w-8 bottom-[15%] right-[30%]"
          delay={3}
          duration={13}
        />

        {/* Top: Logo + Brand */}
        <div
          className="relative z-10 pt-14"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
              <img
                src="/images/logo.svg"
                alt="Marvel Slice"
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Marvel Slice
            </span>
          </div>
        </div>

        {/* Middle: Headline + Tagline */}
        <div
          className="relative z-10 mt-20 max-w-lg"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
          }}
        >
          <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">
            Master New Skills
            <br />
            With Expert Mentors
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            Join 10M+ learners advancing their careers with world-class courses,
            live sessions, and hands-on projects.
          </p>
        </div>

        {/* Bottom: Feature Stats */}
        <div
          className="relative z-8 mt-23 grid grid-cols-3 gap-4 pb-14 max-w-lg"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
          }}
        >
          <StatCard
            icon={<IconSchool size={20} stroke={2} className="text-white" />}
            value="10M+"
            label="Learners"
            delay={0.5}
          />
          <StatCard
            icon={<IconBooks size={20} stroke={2} className="text-white" />}
            value="500+"
            label="Courses"
            delay={0.6}
          />
          <StatCard
            icon={<IconStar size={20} stroke={2} className="text-white" />}
            value="4.8"
            label="Rating"
            delay={0.7}
          />
        </div>
      </section>

      {/* ─── RIGHT: Login Form ─── */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div
          className="w-full max-w-[420px]"
          style={{
            animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          {/* Glass wrapper */}
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
              {/* Logo (mobile only — on desktop the left panel has it) */}
              <div
                className="flex items-center justify-center gap-2.5 lg:hidden"
                style={{ animation: "logo-pulse 4s ease-in-out infinite" }}
              >
                <img
                  src="/images/logo.svg"
                  alt="Marvel Slice"
                  className="h-11 w-auto object-contain"
                />
                <span className="text-2xl font-extrabold tracking-tight">
                  <span className="text-primary">Marvel</span>{" "}
                  <span className="text-primary/80">Slice</span>
                </span>
              </div>

              {/* Heading */}
              <div
                className="mt-6 text-center lg:mt-0"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both",
                }}
              >
                <h2 className="text-[22px] font-bold text-foreground">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log in to continue your learning journey
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSignIn}
                className="mt-7 space-y-4"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
                }}
              >
                {/* Email */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                  />

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 pr-11 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-all duration-200 hover:bg-muted/10 hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <IconEyeOff size={18} stroke={1.5} />
                    ) : (
                      <IconEye size={18} stroke={1.5} />
                    )}
                  </button>
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between text-[13px]">
                  <label className="flex cursor-pointer select-none items-center gap-1.5 text-muted transition-colors hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Log In */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-hover py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:from-primary-hover hover:to-primary hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span
                    className="relative z-10"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                      backgroundSize: "200% 100%",
                      animation: isSubmitting
                        ? "none"
                        : "shimmer-sweep 3s ease-in-out infinite",
                    }}
                  >
                    {isSubmitting ? "Logging in..." : "Log In"}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div
                className="mt-5 flex items-center gap-3"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both",
                }}
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-medium text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* SSO Button */}
              <button
                type="button"
                className="mt-4 w-full rounded-xl border-2 border-primary/30 bg-primary/10 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:border-primary hover:bg-primary/15 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
                }}
              >
                Single Sign On
              </button>

              {/* Catalogue Link */}
              <div
                className="mt-4 text-center"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both",
                }}
              >
                <a
                  href="/catalogue"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  Browse our course packages
                </a>
              </div>

              {/* Demo Accounts */}
              {process.env.NODE_ENV === "development" && (
                <div
                  className="mt-6 rounded-xl border border-dashed border-border bg-muted/5 p-4"
                  style={{
                    animation:
                      "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
                  }}
                >
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Demo Accounts (dev only)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "Student",
                        email: "student@lms.local",
                        pw: "student123",
                      },
                      {
                        label: "Instructor",
                        email: "instructor@lms.local",
                        pw: "instructor123",
                      },
                      {
                        label: "Admin",
                        email: "admin@lms.local",
                        pw: "admin123",
                      },
                      {
                        label: "Super Admin",
                        email: "superadmin@lms.local",
                        pw: "superadmin123",
                      },
                    ].map((d) => (
                      <button
                        key={d.email}
                        type="button"
                        onClick={() => {
                          setEmail(d.email);
                          setPassword(d.pw);
                          toast.info(`Filled ${d.label} credentials`);
                        }}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted shadow-sm transition-all duration-200 hover:border-primary-hover hover:text-primary hover:shadow-md hover:-translate-y-0.5 active:scale-95"
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