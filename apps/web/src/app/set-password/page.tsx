"use client";

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

export default function SetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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
            router.replace("/instructor/dashboard");
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
        },
      );

      toast.success(res.message || "Password set successfully!");

      const role = res.user?.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN")
        router.push("/admin/dashboard");
      else if (role === "INSTRUCTOR") router.push("/instructor/dashboard");
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
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Left panel */}
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
        <div
          className="relative z-10 mt-20 max-w-lg"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
          }}
        >
          <h1 className="text-[2.6rem] font-bold leading-[1.15] text-white">
            Set Your Password
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            Your account was created with a temporary password. Please set a new
            password to continue.
          </p>
        </div>
        <div
          className="relative z-10 mt-16 grid grid-cols-3 gap-4 pb-14 max-w-lg"
          style={{
            animation:
              "login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
          }}
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
      </section>

      {/* Right panel */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div
          className="w-full max-w-[420px]"
          style={{
            animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
            <div className="rounded-[14px] bg-card px-8 py-10">
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
                  <span className="text-blue-600">Marvel</span>{" "}
                  <span className="text-blue-500">Slice</span>
                </span>
              </div>

              <div
                className="mt-6 text-center lg:mt-0"
                style={{
                  animation:
                    "login-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both",
                }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15">
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

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-xl border border-border bg-muted/5 px-4 py-3.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover"
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

                <button
                  type="submit"
                  disabled={!allPassed || loading}
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
