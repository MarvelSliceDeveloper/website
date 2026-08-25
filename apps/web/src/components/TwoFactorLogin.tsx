"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IconShield, IconArrowLeft, IconRefresh } from "@tabler/icons-react";

interface TwoFactorLoginProps {
  tempToken: string;
  email: string;
  rememberMe?: boolean;
  onComplete: (result: { token: string; user: any }) => void;
  onCancel: () => void;
}

export default function TwoFactorLogin({
  tempToken,
  email,
  rememberMe = false,
  onComplete,
  onCancel,
}: TwoFactorLoginProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackupCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.post<{ token: string; user: any }>(
        "/api/auth/2fa/challenge",
        { tempToken, code: trimmed, rememberMe },
      );
      toast.success("Verified successfully");
      onComplete(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setCode("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCodeChange(value: string) {
    const sanitized = useBackupCode
      ? value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)
      : value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);
    setError(null);
  }

  return (
    <div
      className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8"
      style={{
        animation: "login-card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl bg-card/80 p-1 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-border/60">
          <div className="rounded-[14px] bg-card px-8 py-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconArrowLeft size={16} />
                Back
              </button>

              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconShield size={28} />
                </div>

                <div className="text-center">
                  <h2 className="text-[20px] font-bold text-foreground">
                    {useBackupCode
                      ? "Enter a backup code"
                      : "Verify your identity"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {useBackupCode
                      ? "Use one of your recovery codes"
                      : `Enter the code from your authenticator app`}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground/60">
                    {email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode={useBackupCode ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={useBackupCode ? "Backup code" : "000000"}
                  className={`w-full rounded-xl border bg-muted/5 text-center text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-border-hover ${
                    useBackupCode
                      ? "px-4 py-3.5 text-base tracking-normal border-border"
                      : "px-4 py-4 text-[28px] font-mono tracking-[0.3em] border-border focus:border-primary"
                  }`}
                />

                {error && (
                  <p className="text-center text-sm text-red-500">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !code}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconRefresh className="animate-spin" size={16} />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setCode("");
                    setError(null);
                  }}
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  {useBackupCode
                    ? "Use authenticator app instead"
                    : "Use a backup code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
