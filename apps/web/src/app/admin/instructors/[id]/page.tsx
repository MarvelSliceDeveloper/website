"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import {
  IconUser,
  IconMail,
  IconStar,
  IconStarFilled,
  IconHistory,
  IconVideo,
  IconBook,
  IconFileSpreadsheet,
  IconMessage,
  IconChartBar,
  IconEdit,
  IconCheck,
  IconX,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";

type InstructorProfile = {
  id: string;
  userId: string;
  bio: string | null;
  designation: string | null;
  qualification: string | null;
  experienceYears: number | null;
  skills: string[] | null;
  currentlyEmployed: boolean;
  companyName: string | null;
  availableTime: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  languages: string[] | null;
  socialLinks: Record<string, string> | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankAccountHolderName: string | null;
  upiId: string | null;
  joiningDate: string | null;
  status: string;
  rejectionReason: string | null;
  rating: number;
  totalStudents: number;
  completedSessions: number;
  createdAt: string;
};

type InstructorDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  instructorOnboardingComplete: boolean;
  createdAt: string;
  instructorProfile: InstructorProfile;
  activeBatchCount: number;
  liveSessionCount: number;
  completedSessionCount: number;
};

type LoginEntry = {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  loginAt: string;
  logoutAt: string | null;
};

type SessionEntry = {
  id: string;
  title: string;
  scheduledAt: string;
  scheduledEndAt: string;
  endedAt: string | null;
  batch: { id: string; name: string } | null;
  course: { id: string; title: string } | null;
  _count: { attendance: number };
};

type AssignmentEntry = {
  id: string;
  title: string;
  course: { id: string; title: string } | null;
  batch: { id: string; name: string } | null;
  module: { id: string; title: string } | null;
  _count: { submissions: number };
  gradedCount: number;
};

type MentorshipEntry = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string } | null;
};

type PerformanceData = {
  totalSessions: number;
  completedSessions: number;
  totalBatches: number;
  activeBatches: number;
  totalAssignments: number;
  gradedSubmissions: number;
  totalStudents: number;
  totalStudentsEnrolled: number;
  avgRating: number;
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  APPROVED: "bg-success/15 text-success border-success/25",
  REJECTED: "bg-danger/15 text-danger border-danger/25",
  ACTIVE: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  INACTIVE: "bg-muted/15 text-muted-foreground border-muted/25",
};

const ticketStatusStyles: Record<string, string> = {
  OPEN: "bg-blue-500/15 text-blue-600",
  ASSIGNED: "bg-amber-500/15 text-amber-600",
  SCHEDULED: "bg-purple-500/15 text-purple-600",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-muted/15 text-muted-foreground",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(rating) ? (
          <IconStarFilled key={star} size={14} className="text-amber-500" />
        ) : (
          <IconStar key={star} size={14} className="text-muted" />
        ),
      )}
      <span className="ml-1 text-xs text-muted-foreground">({rating.toFixed(1)})</span>
    </div>
  );
}

export default function InstructorDetailPage() {
  usePageTitle("Instructor Details");
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<
    "overview" | "login-history" | "sessions" | "courses-batches" | "assignments" | "mentorship" | "performance"
  >("overview");

  // Login history
  const [loginPage, setLoginPage] = useState(1);

  // Sessions
  const [sessionPage, setSessionPage] = useState(1);

  // Assignments
  const [assignmentPage, setAssignmentPage] = useState(1);

  // Mentorship
  const [mentorshipPage, setMentorshipPage] = useState(1);

  // Rejection reason dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const instructorQuery = useApiQuery<InstructorDetail>(
    ["admin", "instructors", id],
    `/api/admin/instructors/${id}`,
  );
  const instructor = instructorQuery.data ?? null;
  const loading = instructorQuery.isPending;

  const meQuery = useApiQuery<{ user: { role: string } }>(
    ["auth", "me"],
    "/api/auth/me",
  );
  const currentUserRole = meQuery.data?.user?.role ?? null;

  // Paginated section queries — enabled only while their tab is active so
  // each tab fetches on first open and stays cached for later revisits.
  const loginHistoryQuery = useApiQuery<PaginatedResponse<LoginEntry>>(
    ["admin", "instructors", id, "login-history", loginPage],
    `/api/admin/instructors/${id}/login-history`,
    { page: String(loginPage), limit: "20" },
    { enabled: activeTab === "login-history" },
  );
  const loginLogs = loginHistoryQuery.data?.items ?? [];
  const loginTotal = loginHistoryQuery.data?.total ?? 0;
  const loginLoading = loginHistoryQuery.isPending;

  const sessionsQuery = useApiQuery<PaginatedResponse<SessionEntry>>(
    ["admin", "instructors", id, "sessions", sessionPage],
    `/api/admin/instructors/${id}/sessions`,
    { page: String(sessionPage), limit: "20" },
    { enabled: activeTab === "sessions" },
  );
  const sessions = sessionsQuery.data?.items ?? [];
  const sessionTotal = sessionsQuery.data?.total ?? 0;
  const sessionLoading = sessionsQuery.isPending;

  const assignmentsQuery = useApiQuery<PaginatedResponse<AssignmentEntry>>(
    ["admin", "instructors", id, "assignments", assignmentPage],
    `/api/admin/instructors/${id}/assignments`,
    { page: String(assignmentPage), limit: "20" },
    { enabled: activeTab === "assignments" },
  );
  const assignments = assignmentsQuery.data?.items ?? [];
  const assignmentTotal = assignmentsQuery.data?.total ?? 0;
  const assignmentLoading = assignmentsQuery.isPending;

  const mentorshipsQuery = useApiQuery<PaginatedResponse<MentorshipEntry>>(
    ["admin", "instructors", id, "mentorship", mentorshipPage],
    `/api/admin/instructors/${id}/mentorship`,
    { page: String(mentorshipPage), limit: "20" },
    { enabled: activeTab === "mentorship" },
  );
  const mentorships = mentorshipsQuery.data?.items ?? [];
  const mentorshipTotal = mentorshipsQuery.data?.total ?? 0;
  const mentorshipLoading = mentorshipsQuery.isPending;

  const performanceQuery = useApiQuery<PerformanceData>(
    ["admin", "instructors", id, "performance"],
    `/api/admin/instructors/${id}/performance`,
    undefined,
    { enabled: activeTab === "performance" },
  );
  const performance = performanceQuery.data ?? null;
  const performanceLoading = performanceQuery.isPending;

  const verifyMutation = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: "approve" | "reject";
      reason?: string;
    }) =>
      api.put(`/api/admin/instructors/${id}/verify`, {
        action,
        ...(reason ? { rejectionReason: reason } : {}),
      }),
    onSuccess: (_res, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Instructor approved"
          : "Instructor rejected",
      );
      setShowRejectDialog(false);
      setRejectionReason("");
      void instructorQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleVerify = (action: "approve" | "reject", reason?: string) => {
    verifyMutation.mutate({ action, reason });
  };

  const profile = instructor?.instructorProfile;
  const initials = instructor?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: IconUser },
    { key: "login-history" as const, label: "Login History", icon: IconHistory },
    { key: "sessions" as const, label: "Live Sessions & Attendance", icon: IconVideo },
    { key: "courses-batches" as const, label: "Courses & Batches", icon: IconBook },
    { key: "assignments" as const, label: "Assignment Activity", icon: IconFileSpreadsheet },
    { key: "mentorship" as const, label: "Mentorship Log", icon: IconMessage },
    { key: "performance" as const, label: "Performance", icon: IconChartBar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading instructor...</p>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">
          Instructor not found
        </p>
        <Link href="/admin/instructors" className="btn-primary mt-4 inline-flex">
          Back to Instructors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={instructor.name}
        breadcrumbs={[
          { label: "Instructors", href: "/admin/instructors" },
          { label: instructor.name, href: `/admin/instructors/${id}` },
        ]}
        action={
          <div className="flex gap-2">
            {currentUserRole === "SUPER_ADMIN" && profile?.status === "PENDING" && (
              <>
                <button
                  onClick={() => handleVerify("approve")}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <IconCheck size={14} /> Verify
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="btn-danger text-sm flex items-center gap-1.5"
                >
                  <IconX size={14} /> Reject
                </button>
              </>
            )}
            <Link
              href={`/admin/instructors/${id}/edit`}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <IconEdit size={14} /> Edit
            </Link>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header card */}
          <div className="glass-card p-6 border border-border/80">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={instructor.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    {instructor.name}
                  </h2>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[profile?.status || "PENDING"]}`}
                  >
                    {profile?.status || "PENDING"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IconMail size={14} />
                    {instructor.email}
                  </span>
                  {profile?.designation && (
                    <span>{profile.designation}</span>
                  )}
                </div>
                {profile && (
                  <div className="mt-2">
                    <StarRating rating={profile.rating} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two-column field grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="glass-card p-5 border border-border/80 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Professional Info</h3>
              <FieldRow label="Bio" value={profile?.bio} />
              <FieldRow label="Qualification" value={profile?.qualification} />
              <FieldRow label="Experience" value={profile?.experienceYears ? `${profile.experienceYears} years` : null} />
              <FieldRow label="Skills">
                {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.map((s) => (
                      <span key={s} className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </FieldRow>
              <FieldRow label="Languages">
                {Array.isArray(profile?.languages) && profile.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.languages.map((l) => (
                      <span key={l} className="inline-flex rounded bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        {l}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </FieldRow>
              <FieldRow label="Currently Employed" value={profile?.currentlyEmployed ? "Yes" : "No"} />
              <FieldRow label="Company" value={profile?.companyName} />
              <FieldRow label="Available Time" value={profile?.availableTime} />
            </div>

            {/* Right column */}
            <div className="glass-card p-5 border border-border/80 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Contact & Payment</h3>
              <FieldRow label="Phone" value={profile?.phone} />
              <FieldRow label="Address" value={profile?.address} />
              <FieldRow label="City" value={profile?.city} />
              <FieldRow label="State" value={profile?.state} />
              <FieldRow label="Country" value={profile?.country} />
              <FieldRow label="Social Links">
                {profile?.socialLinks && typeof profile.socialLinks === "object" ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.socialLinks.linkedin && (
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {profile.socialLinks.github && (
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        GitHub
                      </a>
                    )}
                    {profile.socialLinks.portfolio && (
                      <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Portfolio
                      </a>
                    )}
                    {Object.keys(profile.socialLinks).length === 0 && "—"}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </FieldRow>
              <FieldRow label="Bank">
                {profile?.bankName ? (
                  <div className="text-sm text-foreground">
                    <p>{profile.bankName}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.bankAccountHolderName && `${profile.bankAccountHolderName} · `}
                      {profile.bankAccountNumber
                        ? `xxxx${profile.bankAccountNumber.slice(-4)}`
                        : ""}
                    </p>
                    {profile.bankIfscCode && (
                      <p className="text-xs text-muted-foreground">IFSC: {profile.bankIfscCode}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </FieldRow>
              <FieldRow label="UPI ID" value={profile?.upiId} />
              <FieldRow label="Joining Date" value={profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString("en-IN") : null} />
            </div>
          </div>
        </div>
      )}

      {/* ── Login History Tab ── */}
      {activeTab === "login-history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loginTotal} login{loginTotal !== 1 ? "s" : ""} recorded
            </p>
            <button onClick={() => void loginHistoryQuery.refetch()} className="btn-secondary text-xs flex items-center gap-1.5">
              <IconRefresh size={14} /> Refresh
            </button>
          </div>
          <div className="glass-card p-5 border border-border/80">
            {loginLoading ? (
              <div className="py-12 text-center text-sm text-muted animate-pulse">Loading...</div>
            ) : loginLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No login history found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                      <th className="py-2.5 pr-3">IP</th>
                      <th className="py-2.5 pr-3">Device</th>
                      <th className="py-2.5 pr-3">User Agent</th>
                      <th className="py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loginLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-card-hover transition-colors">
                        <td className="py-3 pr-3 font-mono text-[10px] text-muted">{log.ip || "—"}</td>
                        <td className="py-3 pr-3 text-muted-foreground text-[10px]">{log.deviceInfo || "—"}</td>
                        <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate text-[10px]">{log.userAgent || "—"}</td>
                        <td className="py-3 text-muted whitespace-nowrap">
                          {new Date(log.loginAt).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {loginTotal > 20 && (
            <PaginationControls page={loginPage} total={loginTotal} limit={20} onPageChange={setLoginPage} />
          )}
        </div>
      )}

      {/* ── Live Sessions Tab ── */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{sessionTotal} session{sessionTotal !== 1 ? "s" : ""}</p>
          <div className="glass-card p-5 border border-border/80">
            {sessionLoading ? (
              <div className="py-12 text-center text-sm text-muted animate-pulse">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No sessions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                      <th className="py-2.5 pr-3">Session Title</th>
                      <th className="py-2.5 pr-3">Batch</th>
                      <th className="py-2.5 pr-3">Course</th>
                      <th className="py-2.5 pr-3">Date</th>
                      <th className="py-2.5 pr-3">Duration</th>
                      <th className="py-2.5">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sessions.map((s) => {
                      const start = new Date(s.scheduledAt);
                      const end = s.endedAt ? new Date(s.endedAt) : s.scheduledEndAt ? new Date(s.scheduledEndAt) : null;
                      const duration = end
                        ? `${Math.round((end.getTime() - start.getTime()) / 60000)} min`
                        : "—";
                      return (
                        <tr key={s.id} className="hover:bg-card-hover transition-colors">
                          <td className="py-3 pr-3 font-medium text-foreground">{s.title}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{s.batch?.name || "—"}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{s.course?.title || "—"}</td>
                          <td className="py-3 pr-3 text-muted whitespace-nowrap">{start.toLocaleDateString("en-IN")}</td>
                          <td className="py-3 pr-3 text-muted">{duration}</td>
                          <td className="py-3 text-muted">{s._count.attendance}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {sessionTotal > 20 && (
            <PaginationControls page={sessionPage} total={sessionTotal} limit={20} onPageChange={setSessionPage} />
          )}
        </div>
      )}

      {/* ── Courses & Batches Tab ── */}
      {activeTab === "courses-batches" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Active Batches" value={instructor.activeBatchCount} icon={IconBook} variant="blue" />
            <StatCard label="Total Sessions" value={instructor.liveSessionCount} icon={IconVideo} variant="green" />
            <StatCard label="Completed Sessions" value={instructor.completedSessionCount} icon={IconCheck} variant="purple" />
          </div>
          <p className="text-sm text-muted-foreground">
            Courses and batches assigned to this instructor are managed from the Batches section.
          </p>
          <Link href={`/admin/batches?instructorId=${id}`} className="btn-secondary text-sm inline-flex items-center gap-1.5">
            <IconEye size={14} /> View Assigned Batches
          </Link>
        </div>
      )}

      {/* ── Assignment Activity Tab ── */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{assignmentTotal} assignment{assignmentTotal !== 1 ? "s" : ""}</p>
          <div className="glass-card p-5 border border-border/80">
            {assignmentLoading ? (
              <div className="py-12 text-center text-sm text-muted animate-pulse">Loading...</div>
            ) : assignments.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No assignments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                      <th className="py-2.5 pr-3">Assignment</th>
                      <th className="py-2.5 pr-3">Course</th>
                      <th className="py-2.5 pr-3">Batch</th>
                      <th className="py-2.5 pr-3">Total Submissions</th>
                      <th className="py-2.5 pr-3">Graded</th>
                      <th className="py-2.5">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {assignments.map((a) => {
                      const pending = a._count.submissions - a.gradedCount;
                      return (
                        <tr key={a.id} className="hover:bg-card-hover transition-colors">
                          <td className="py-3 pr-3 font-medium text-foreground">{a.title}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{a.course?.title || "—"}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{a.batch?.name || "—"}</td>
                          <td className="py-3 pr-3 text-muted">{a._count.submissions}</td>
                          <td className="py-3 pr-3 text-success font-medium">{a.gradedCount}</td>
                          <td className="py-3 text-amber-600 font-medium">{pending}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {assignmentTotal > 20 && (
            <PaginationControls page={assignmentPage} total={assignmentTotal} limit={20} onPageChange={setAssignmentPage} />
          )}
        </div>
      )}

      {/* ── Mentorship Log Tab ── */}
      {activeTab === "mentorship" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{mentorshipTotal} ticket{mentorshipTotal !== 1 ? "s" : ""}</p>
          <div className="glass-card p-5 border border-border/80">
            {mentorshipLoading ? (
              <div className="py-12 text-center text-sm text-muted animate-pulse">Loading...</div>
            ) : mentorships.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No mentorship tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                      <th className="py-2.5 pr-3">Student</th>
                      <th className="py-2.5 pr-3">Topic</th>
                      <th className="py-2.5 pr-3">Course</th>
                      <th className="py-2.5 pr-3">Status</th>
                      <th className="py-2.5 pr-3">Created</th>
                      <th className="py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {mentorships.map((m) => (
                      <tr key={m.id} className="hover:bg-card-hover transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {m.student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{m.student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground max-w-[160px] truncate">{m.title}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{m.course?.title || "—"}</td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${ticketStatusStyles[m.status] || "bg-muted/15 text-muted"}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-muted whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/mentorship/${m.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {mentorshipTotal > 20 && (
            <PaginationControls page={mentorshipPage} total={mentorshipTotal} limit={20} onPageChange={setMentorshipPage} />
          )}
        </div>
      )}

      {/* ── Performance Tab ── */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {performanceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="h-10 w-10 animate-pulse bg-border rounded-xl" />
                  <div className="h-3 w-24 animate-pulse bg-border mt-3 rounded" />
                  <div className="h-7 w-16 animate-pulse bg-border mt-2 rounded" />
                </div>
              ))}
            </div>
          ) : performance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Sessions" value={performance.totalSessions} icon={IconVideo} variant="blue" />
                <StatCard label="Completed Sessions" value={performance.completedSessions} icon={IconCheck} variant="green" />
                <StatCard label="Total Batches" value={performance.totalBatches} icon={IconBook} variant="purple" />
                <StatCard label="Active Batches" value={performance.activeBatches} icon={IconBook} variant="orange" />
                <StatCard label="Total Assignments" value={performance.totalAssignments} icon={IconFileSpreadsheet} variant="red" />
                <StatCard label="Graded Submissions" value={performance.gradedSubmissions} icon={IconCheck} variant="green" />
                <StatCard label="Students Enrolled" value={performance.totalStudentsEnrolled} icon={IconUser} variant="blue" />
                <StatCard label="Average Rating" value={performance.avgRating.toFixed(1)} icon={IconStarFilled} variant="orange" />
              </div>

              <div className="glass-card p-5 border border-border/80">
                <h3 className="text-sm font-semibold text-foreground mb-4">Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Session Completion Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {performance.totalSessions > 0
                        ? `${Math.round((performance.completedSessions / performance.totalSessions) * 100)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Grading Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {performance.totalAssignments > 0
                        ? `${Math.round((performance.gradedSubmissions / performance.totalAssignments) * 100)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Students per Batch (avg)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {performance.activeBatches > 0
                        ? Math.round(performance.totalStudentsEnrolled / performance.activeBatches)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Could not load performance data.
            </div>
          )}
        </div>
      )}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground">Reject Instructor</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide a reason the instructor will see on their onboarding page.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 resize-none"
              placeholder="Explain why the profile was rejected..."
            />
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowRejectDialog(false); setRejectionReason(""); }}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify("reject", rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="btn-danger text-sm px-4 py-2 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-32">{label}</span>
      <div className="text-sm text-foreground text-right flex-1">
        {children ?? (value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>)}
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn-secondary py-1.5 px-3 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="btn-secondary py-1.5 px-3 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
