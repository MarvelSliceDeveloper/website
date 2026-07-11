"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    setIsSubmitting(true);

    try {
      const result = await api.post<{
        user?: { role?: string };
      }>("/api/auth/login", {
        email: normalizedEmail,
        password,
      });

      toast.success("Signed in successfully");

      const role = result?.user?.role;

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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card/70 shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden border-r border-border/70 bg-gradient-to-br from-primary/20 via-card to-card p-10 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            LMS Portal
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground">
            Modern learning experience for students and admins
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Manage live sessions, track progress, and handle mentorship
            workflows from a single workspace.
          </p>
          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Demo accounts
            </p>
            {[
              "student@lms.local",
              "instructor@lms.local",
              "admin@lms.local",
            ].map((demoEmail) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => setEmail(demoEmail)}
                className="block w-full text-left panel px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <p className="text-xs text-muted">Click to fill email</p>
                <p className="text-sm font-semibold text-foreground">
                  {demoEmail}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
              Sign in
            </p>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Use your account credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="field"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IconEyeOff size={18} stroke={1.5} />
                  ) : (
                    <IconEye size={18} stroke={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-background/40 p-4 text-xs text-muted-foreground lg:hidden">
            <p className="font-semibold text-foreground">Demo Accounts</p>
            <p className="mt-2">student@lms.local</p>
            <p className="mt-1">instructor@lms.local</p>
            <p className="mt-1">admin@lms.local</p>
          </div>
        </section>
      </div>
    </div>
  );
}
