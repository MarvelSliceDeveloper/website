"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconShield,
  IconCheck,
  IconX,
  IconCopy,
  IconRefresh,
  IconQrcode,
} from "@tabler/icons-react";

interface TwoFactorStatus {
  enabled: boolean;
  verifiedAt: string | null;
}

export default function SecuritySettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{
    secret: string;
    uri: string;
  } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [codesSaved, setCodesSaved] = useState(false);

  useEffect(() => {
    api
      .get<TwoFactorStatus>("/api/auth/2fa/status")
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSetup() {
    setSettingUp(true);
    try {
      const data = await api.post<{ secret: string; uri: string }>(
        "/api/auth/2fa/setup",
      );
      setSetupData(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSettingUp(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const data = await api.post<{ backupCodes: string[] }>(
        "/api/auth/2fa/verify",
        { code },
      );
      setBackupCodes(data.backupCodes);
      toast.success("Two-factor authentication enabled");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setDisabling(true);
    try {
      await api.post("/api/auth/2fa/disable", { password });
      setStatus({ enabled: false, verifiedAt: null });
      setSetupData(null);
      setBackupCodes(null);
      setCode("");
      setPassword("");
      setShowDisableConfirm(false);
      toast.success("Two-factor authentication disabled");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDisabling(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function handleCodesSaved() {
    setCodesSaved(true);
    setStatus({ enabled: true, verifiedAt: new Date().toISOString() });
    setSetupData(null);
    setBackupCodes(null);
    setCode("");
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-card-hover/60" />
        ))}
      </div>
    );
  }

  if (backupCodes && !codesSaved) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <IconShield size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Backup Codes</p>
            <p className="text-sm text-muted-foreground">
              Save these codes in a safe place. You can use them to log in if
              you lose access to your authenticator app.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <IconShield size={18} />
              <span className="text-sm font-semibold">
                One-time backup codes
              </span>
            </div>
            <p className="text-xs text-amber-700/80">
              Each code can be used only once. Keep them somewhere secure.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-amber-600/10 px-3.5 py-2.5 font-mono text-sm text-amber-800"
                >
                  <span>{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="shrink-0 rounded p-1 text-amber-600 transition-colors hover:bg-amber-600/20"
                  >
                    <IconCopy size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(backupCodes.join("\n"))}
              className="flex items-center gap-2 text-xs font-medium text-amber-700 transition-colors hover:text-amber-800"
            >
              <IconCopy size={14} />
              Copy all codes
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleCodesSaved}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <IconCheck size={16} />
              I've saved my backup codes
            </button>
          </div>
        </div>
      </>
    );
  }

  if (setupData) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconQrcode size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Set up authenticator app
            </p>
            <p className="text-sm text-muted-foreground">
              Scan the QR code with your authenticator app (Google
              Authenticator, Authy, etc.)
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-center">
            <div className="rounded-xl border border-border bg-white p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`}
                alt="QR Code for 2FA setup"
                className="h-[200px] w-[200px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Or enter this secret key manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-muted/5 px-3.5 py-2.5 font-mono text-sm text-foreground select-all">
                {setupData.secret}
              </code>
              <button
                onClick={() => copyToClipboard(setupData.secret)}
                className="shrink-0 rounded-lg border border-border p-2.5 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Verify the code
            </p>
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code from your authenticator app:
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-40 rounded-lg border border-border bg-background px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.25em] text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {verifying ? (
                  <IconRefresh className="animate-spin" size={16} />
                ) : (
                  <IconCheck size={16} />
                )}
                <span>{verifying ? "Verifying..." : "Verify & Enable"}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              onClick={() => {
                setSetupData(null);
                setCode("");
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconX size={16} />
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  if (status?.enabled) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <IconShield size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-muted-foreground">
              Manage your 2FA settings.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            <IconCheck size={14} />
            Enabled
          </span>
        </div>

        <div className="p-6 space-y-5">
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <IconShield size={18} />
              <span className="text-sm font-semibold">
                Two-Factor Authentication is enabled
              </span>
            </div>
            {status.verifiedAt && (
              <p className="text-xs text-muted-foreground">
                Verified on{" "}
                {new Date(status.verifiedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {!showDisableConfirm ? (
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/5"
            >
              <IconX size={16} />
              Disable 2FA
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-4">
              <p className="text-sm font-medium text-red-700">
                Disable Two-Factor Authentication
              </p>
              <p className="text-xs text-red-600/80">
                Enter your password to confirm:
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full max-w-xs rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-500/10 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDisable}
                  disabled={disabling || !password}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {disabling ? (
                    <IconRefresh className="animate-spin" size={16} />
                  ) : (
                    <IconX size={16} />
                  )}
                  <span>{disabling ? "Disabling..." : "Confirm Disable"}</span>
                </button>
                <button
                  onClick={() => {
                    setShowDisableConfirm(false);
                    setPassword("");
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <IconShield size={20} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            Two-Factor Authentication
          </p>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="glass-card p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Protect your account
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Two-factor authentication adds an extra layer of security to your
            account by requiring a one-time code from your authenticator app in
            addition to your password.
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <IconCheck size={14} className="text-emerald-500 shrink-0" />
              Use any authenticator app (Google Authenticator, Authy, etc.)
            </li>
            <li className="flex items-center gap-2">
              <IconCheck size={14} className="text-emerald-500 shrink-0" />
              Receive one-time codes even without internet
            </li>
            <li className="flex items-center gap-2">
              <IconCheck size={14} className="text-emerald-500 shrink-0" />
              Backup codes provided for account recovery
            </li>
          </ul>
        </div>

        <button
          onClick={handleSetup}
          disabled={settingUp}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {settingUp ? (
            <IconRefresh className="animate-spin" size={16} />
          ) : (
            <IconShield size={16} />
          )}
          <span>{settingUp ? "Setting up..." : "Enable 2FA"}</span>
        </button>
      </div>
    </>
  );
}
