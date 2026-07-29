"use client";

import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconCheck,
  IconChalkboardTeacher,
  IconCircleX,
  IconClockHour4,
  IconExternalLink,
  IconPhoto,
  IconRefresh,
  IconSchool,
  IconShield,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type InstructorProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  instructorProfile: {
    bio?: string;
    designation?: string;
    qualification?: string;
    experienceYears?: number;
    skills?: string[];
    currentlyEmployed?: boolean;
    companyName?: string;
    availableTime?: string;
    languages?: string[];
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    photoUrl?: string;
    resumeUrl?: string;
    socialLinks?: Record<string, string>;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountHolderName?: string;
    upiId?: string;
    status?: string;
  } | null;
};

export default function ApprovalsPage() {
  usePageTitle("Approvals");
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewUser, setReviewUser] = useState<InstructorProfile | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPending = useCallback(() => {
    setLoading(true);
    api
      .get<{ users: PendingUser[] }>("/api/admin/users/pending")
      .then((res) => {
        setUsers(res.users ?? []);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const openReview = async (userId: string) => {
    setReviewLoading(true);
    setReviewUser(null);
    setShowRejectInput(false);
    setRejectionReason("");
    try {
      const data = await api.get<InstructorProfile>(
        `/api/admin/instructors/${userId}`,
      );
      setReviewUser(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const closeReview = () => {
    setReviewUser(null);
    setShowRejectInput(false);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!reviewUser) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/instructors/${reviewUser.id}/verify`, {
        action: "approve",
      });
      toast.success(`${reviewUser.name} approved successfully`);
      setUsers((prev) => prev.filter((u) => u.id !== reviewUser.id));
      closeReview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewUser) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/api/admin/instructors/${reviewUser.id}/verify`, {
        action: "reject",
        rejectionReason: rejectionReason.trim(),
      });
      toast.success(`${reviewUser.name} rejected`);
      setUsers((prev) => prev.filter((u) => u.id !== reviewUser.id));
      closeReview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return <IconChalkboardTeacher size={14} />;
      case "STUDENT":
        return <IconSchool size={14} />;
      default:
        return <IconShield size={14} />;
    }
  };

  const profile = reviewUser?.instructorProfile;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Instructor Approvals"
        description={`${users.length} pending approval${users.length !== 1 ? "s" : ""}`}
        breadcrumbs={[{ label: "Approvals", href: "/admin/approvals" }]}
        action={
          <button
            onClick={fetchPending}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <IconRefresh size={14} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <IconUserCheck size={40} stroke={1.2} />
          <p className="text-sm">No pending approvals</p>
          <p className="text-xs">
            All instructors have been reviewed and approved.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Registered
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={`border-b border-border/50 last:border-0 ${
                    i % 2 === 1 ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-sky-100 text-sky-700 rounded">
                      {roleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openReview(user.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 py-10 px-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-300">
            <div className="rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/10 px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <IconChalkboardTeacher size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Review Instructor Application
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reviewUser.name} &middot; {reviewUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeReview}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Modal body */}
              <div className="max-h-[65vh] overflow-y-auto p-8">
                {reviewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
                      <p className="text-sm text-muted-foreground">
                        Loading profile...
                      </p>
                    </div>
                  </div>
                ) : profile ? (
                  <div className="space-y-8">
                    {/* ── Profile Hero Card ── */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 p-6">
                      {profile.photoUrl ? (
                        <div className="shrink-0">
                          <img
                            src={profile.photoUrl}
                            alt="Profile"
                            className="h-28 w-28 rounded-2xl object-cover border-2 border-border shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-muted shadow-lg">
                          <IconPhoto size={36} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h3 className="text-xl font-bold text-foreground">
                          {reviewUser.name}
                        </h3>
                        {profile.designation && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {profile.designation}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {reviewUser.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-500/20">
                            <IconClockHour4 size={12} />
                            Pending Review
                          </span>
                          {profile.experienceYears != null && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-500/20">
                              {profile.experienceYears} years exp.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Content Grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Professional Info */}
                      <div className="glass-card p-5 space-y-3 lg:col-span-2">
                        <Section title="Professional Info">
                          <Field label="Bio" value={profile.bio} longText />
                          <Field label="Designation" value={profile.designation} />
                          <Field label="Qualification" value={profile.qualification} />
                          <Field label="Experience" value={profile.experienceYears != null ? `${profile.experienceYears} years` : null} />
                          <Field label="Skills" value={Array.isArray(profile.skills) ? profile.skills.join(", ") : null} />
                          <Field label="Currently Employed" value={profile.currentlyEmployed != null ? (profile.currentlyEmployed ? "Yes" : "No") : null} />
                          <Field label="Company" value={profile.companyName} />
                          <Field label="Available Time" value={profile.availableTime} />
                          <Field label="Languages" value={Array.isArray(profile.languages) ? profile.languages.join(", ") : null} />
                        </Section>
                      </div>

                      {/* Contact Details */}
                      <div className="glass-card p-5 space-y-3">
                        <Section title="Contact Details">
                          <Field label="Phone" value={profile.phone} />
                          <Field label="LinkedIn" value={profile.socialLinks?.linkedin} isLink />
                          <Field label="GitHub" value={profile.socialLinks?.github} isLink />
                          <Field label="Portfolio" value={profile.socialLinks?.portfolio} isLink />
                          <Field label="Address" value={profile.address} fullWidth />
                          <Field label="City" value={profile.city} />
                          <Field label="State" value={profile.state} />
                          <Field label="Country" value={profile.country} />
                        </Section>
                      </div>

                      {/* Bank Information */}
                      <div className="glass-card p-5 space-y-3">
                        <Section title="Bank Information">
                          <Field label="Bank Name" value={profile.bankName} />
                          <Field label="Account Number" value={profile.bankAccountNumber} />
                          <Field label="IFSC Code" value={profile.bankIfscCode} />
                          <Field label="Account Holder" value={profile.bankAccountHolderName} />
                          <Field label="UPI ID" value={profile.upiId} />
                        </Section>

                        {/* Resume */}
                        {profile.resumeUrl && (
                          <div className="border-t border-border pt-3 mt-3">
                            <a
                              href={profile.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                              <IconExternalLink size={16} />
                              View Resume / CV
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <IconPhoto size={40} stroke={1.2} />
                    <p className="mt-3 text-sm">No profile details submitted.</p>
                  </div>
                )}
              </div>

              {/* Modal footer — actions */}
              <div className="border-t border-border bg-muted/10 px-8 py-5">
                {showRejectInput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground">
                        Rejection Reason <span className="text-danger">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-danger focus:ring-4 focus:ring-danger/20 transition-all"
                        placeholder="Explain why the application is being rejected..."
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectionReason(""); }}
                        className="btn-secondary text-sm px-5 py-2.5"
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/25 hover:bg-danger/90 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Review all details before making a decision
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={actionLoading || reviewLoading}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-danger/30 px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
                      >
                        <IconCircleX size={18} />
                        Reject
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading || reviewLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <IconCheck size={18} />
                            Approve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  isLink,
  fullWidth,
  longText,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
  fullWidth?: boolean;
  longText?: boolean;
}) {
  if (value == null || value === "") return null;
  const cls = fullWidth ? "sm:col-span-2" : "";
  return (
    <div className={cls}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLink ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
        >
          {value}
          <IconExternalLink size={11} className="text-muted" />
        </a>
      ) : (
        <p
          className={`text-sm text-foreground ${longText ? "whitespace-pre-wrap" : "truncate"}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
