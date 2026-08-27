"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import type { SetPasswordInput } from "@lms/config";

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

export default function SetPasswordPage() {
  usePageTitle("Set Password");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    api
      .get<{ user: { role: string; mustChangePassword: boolean } }>(
        "/api/auth/me",
      )
      .then((res) => {
        if (!res?.user) {
          router.replace("/login");
          return;
        }
        if (!res.user.mustChangePassword) {
          const role = res.user.role;
          if (role === "ADMIN" || role === "SUPER_ADMIN")
            router.replace("/admin/dashboard");
          else if (role === "INSTRUCTOR")
            router.replace("/instructor/onboarding");
          else router.replace("/student");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const passwordChecks = {
    min: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  const allPassed =
    passwordChecks.min &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.digit &&
    passwordChecks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post<{ message: string; user: { role: string } }>(
        "/api/auth/me/set-password",
        {
          newPassword,
        } satisfies SetPasswordInput,
      );

      toast.success(res.message || "Password set successfully!");

      const role = res.user?.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN")
        router.push("/admin/dashboard");
      else if (role === "INSTRUCTOR") router.push("/instructor/onboarding");
      else router.push("/student");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to set password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="login-page flex min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-background to-background">
      {/* ─── LEFT: Hero Panel ─── */}
      <section
        className="relative hidden w-full flex-col overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2551d9] to-[#3b82f6] px-12 lg:flex lg:w-[55%]"
      >
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
              Set Your Password
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              Your account was created with a temporary password. Please set a new
              password to continue.
            </p>
          </div>

          {/* Illustration */}
          <div
            className="relative mx-auto mt-10 w-full max-w-[440px] pt-4"
            style={{ animation: "login-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both" }}
          >
            {/* Soft glow behind the scene */}
            <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-2xl" />
            <div
              className="relative"
              style={{ animation: "login-float 9s ease-in-out 0.5s infinite" }}
            >
              <Image
                src="/images/login-hero.svg"
                alt="Set password illustration"
                width={440}
                height={270}
                unoptimized
                priority
                className="relative h-auto w-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div
            className="mt-10 grid max-w-lg grid-cols-3 gap-4"
            style={{ animation: "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both" }}
          >
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <IconShieldCheck size={20} stroke={2} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">Secure</span>
              <span className="text-[11px] font-medium text-white/70">
                Encrypted
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <IconLock size={20} stroke={2} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">Private</span>
              <span className="text-[11px] font-medium text-white/70">
                Your data
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <IconShieldCheck size={20} stroke={2} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">Quick</span>
              <span className="text-[11px] font-medium text-white/70">
                1-minute
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RIGHT: Form ─── */}
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
                <div className="flex items-center gap-2.5 lg:hidden">
                  <Image
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    width={56} height={56} className="h-14 w-auto object-contain"
                  />
                  <span className="text-2xl font-extrabold tracking-tight">
                    <span className="text-primary">Marvel</span>{" "}
                    <span className="text-primary/80">Slice</span>
                  </span>
                </div>

                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 lg:mt-0">
                  <IconLock size={22} stroke={1.5} className="text-blue-600" />
                </div>
                <h2 className="text-[22px] font-bold text-foreground">
                  Set Your Password
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a strong password for your account
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-4"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
                }}
              >
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
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/10 hover:text-foreground"
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

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />

                {/* Password requirements */}
                <div className="space-y-1.5 rounded-xl border border-border bg-muted/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Requirements
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${passwordChecks.min ? "bg-success" : "bg-muted/30"}`}
                    />
                    <span
                      className={`text-xs ${passwordChecks.min ? "text-success" : "text-muted-foreground"}`}
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${passwordChecks.upper ? "bg-success" : "bg-muted/30"}`}
                    />
                    <span
                      className={`text-xs ${passwordChecks.upper ? "text-success" : "text-muted-foreground"}`}
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${passwordChecks.lower ? "bg-success" : "bg-muted/30"}`}
                    />
                    <span
                      className={`text-xs ${passwordChecks.lower ? "text-success" : "text-muted-foreground"}`}
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${passwordChecks.digit ? "bg-success" : "bg-muted/30"}`}
                    />
                    <span
                      className={`text-xs ${passwordChecks.digit ? "text-success" : "text-muted-foreground"}`}
                    >
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${passwordChecks.match ? "bg-success" : "bg-muted/30"}`}
                    />
                    <span
                      className={`text-xs ${passwordChecks.match ? "text-success" : "text-muted-foreground"}`}
                    >
                      Passwords match
                    </span>
                  </div>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                {/* Terms agreement */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    I agree to the{" "}
                    <a
                      href="/pages/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="/pages/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!allPassed || !agreed || loading}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "Setting password..." : "Set Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
