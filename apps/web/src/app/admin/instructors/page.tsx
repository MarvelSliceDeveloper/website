"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  IconUsers,
  IconPlus,
  IconCheck,
  IconX,
  IconStar,
  IconEye,
  IconEdit,
  IconMail,
} from "@tabler/icons-react";

interface Instructor {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
  designation: string | null;
  experience: number | null;
  currentCompany: string | null;
  activeBatches: number;
  totalStudents: number;
  rating: number | null;
  createdAt: string | null;
}

type ApiRawItem = {
  id: string;
  name: string;
  email: string;
  instructorProfile: {
    designation: string | null;
    experienceYears: number | null;
    companyName: string | null;
    totalStudents: number;
    rating: number | null;
    status: string;
    createdAt: string;
  } | null;
  activeBatchCount: number;
  totalStudents: number;
};

type ApiResponse = {
  items: ApiRawItem[];
  total: number;
  page: number;
  limit: number;
};

type InstructorProfileDetail = {
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
  instructorProfile: InstructorProfileDetail;
  activeBatchCount: number;
  liveSessionCount: number;
  completedSessionCount: number;
  totalStudents: number;
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  },
  APPROVED: {
    label: "Approved",
    classes: "bg-success/15 text-success border-success/25",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-danger/15 text-danger border-danger/25",
  },
  ACTIVE: {
    label: "Active",
    classes: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  },
  INACTIVE: {
    label: "Inactive",
    classes: "bg-muted/15 text-muted-foreground border-muted/25",
  },
};

const statusFilters = [
  "ALL",
  "PENDING",
  "APPROVED",
  "ACTIVE",
  "INACTIVE",
] as const;

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr || Number.isNaN(new Date(dateStr).getTime())) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitialsColor(name: string) {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-amber-500/15 text-amber-600",
    "bg-emerald-500/15 text-emerald-600",
    "bg-blue-500/15 text-blue-600",
    "bg-purple-500/15 text-purple-600",
    "bg-rose-500/15 text-rose-600",
    "bg-cyan-500/15 text-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <IconStar
          key={star}
          size={12}
          className={
            star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-muted"
          }
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export default function AdminInstructorsPage() {
  usePageTitle("Instructors");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [viewInstructor, setViewInstructor] = useState<InstructorDetail | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "professional" | "contact"
  >("overview");

  // List query keyed on filter/search/page; includes `search` in the key so
  // typing in the box refetches (the original effect missed search changes
  // while on page 1).
  const instructorsQuery = useApiQuery<ApiResponse>(
    ["admin", "instructors", statusFilter, search.trim() || "all", page],
    "/api/admin/instructors",
    {
      page: String(page),
      limit: String(pageSize),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  );

  const instructors: Instructor[] = (instructorsQuery.data?.items ?? []).map(
    (item) => {
      const p = item.instructorProfile;
      return {
        id: item.id,
        name: item.name,
        email: item.email,
        status: (p?.status ?? "PENDING") as Instructor["status"],
        designation: p?.designation ?? null,
        experience: p?.experienceYears ?? null,
        currentCompany: p?.companyName ?? null,
        activeBatches: item.activeBatchCount ?? 0,
        totalStudents: item.totalStudents ?? 0,
        rating: p?.rating ?? null,
        createdAt: p?.createdAt ?? null,
      };
    },
  );
  const total = instructorsQuery.data?.total ?? 0;
  const loading = instructorsQuery.isPending;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const verifyMutation = useMutation({
    mutationFn: (instructorId: string) =>
      api.put(`/api/admin/instructors/${instructorId}/verify`),
    onSuccess: () => {
      toast.success("Instructor verified successfully");
      void instructorsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleVerify = (instructorId: string) => {
    verifyMutation.mutate(instructorId);
  };

  const openDetail = async (instructorId: string) => {
    setDetailLoading(true);
    setActiveTab("overview");
    try {
      const data = await api.get<InstructorDetail>(
        `/api/admin/instructors/${instructorId}`,
      );
      setViewInstructor(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: DataTableColumn<Instructor>[] = [
    {
      key: "name",
      label: "Name",
      render: (_, instructor) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold ${getInitialsColor(instructor.name)}`}
          >
            {instructor.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">
            {instructor.name}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "status",
      label: "Status",
      render: (_, instructor) => {
        const cfg = statusConfig[instructor.status] ?? {
          label: instructor.status,
          classes: "bg-muted/15 text-muted-foreground border-muted/25",
        };
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}
          >
            {instructor.status === "APPROVED" && <IconCheck size={10} />}
            {instructor.status === "REJECTED" && <IconX size={10} />}
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "designation",
      label: "Designation",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground">
          {instructor.designation || "—"}
        </span>
      ),
    },
    {
      key: "experience",
      label: "Experience",
      render: (_, instructor) => (
        <span className="text-sm text-foreground">
          {instructor.experience ? `${instructor.experience} yrs` : "—"}
        </span>
      ),
    },
    {
      key: "currentCompany",
      label: "Current Company",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground">
          {instructor.currentCompany || "—"}
        </span>
      ),
    },
    {
      key: "activeBatches",
      label: "Active Batches",
      render: (_, instructor) => (
        <span className="text-sm font-medium text-foreground">
          {instructor.activeBatches}
        </span>
      ),
    },
    {
      key: "totalStudents",
      label: "Students",
      render: (_, instructor) => (
        <span className="text-sm font-medium text-foreground">
          {instructor.totalStudents}
        </span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (_, instructor) =>
        instructor.rating ? (
          <StarRating rating={instructor.rating} />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (_, instructor) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(instructor.createdAt)}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, instructor) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openDetail(instructor.id)}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="View instructor"
          >
            <IconEye size={14} />
          </button>
          <a
            href={`/admin/instructors/${instructor.id}/edit`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit instructor"
          >
            <IconEdit size={14} />
          </a>
          {instructor.status === "PENDING" && (
            <button
              onClick={() => handleVerify(instructor.id)}
              className="rounded-md border border-success/20 p-1.5 text-success hover:bg-success/10 transition-colors"
              title="Verify instructor"
            >
              <IconCheck size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Instructors"
        description={`${total} instructor${total !== 1 ? "s" : ""} registered`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Instructors", href: "/admin/instructors" },
        ]}
        action={
          <Link
            href="/admin/instructors/new"
            className="btn-primary text-sm shadow-md flex items-center gap-1.5"
          >
            <IconPlus size={16} /> Add Instructor{" "}
          </Link>
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? s === "ALL"
                    ? "bg-primary/15 text-primary border-primary/25"
                    : `${statusConfig[s].classes}`
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              {s === "ALL" ? "All" : statusConfig[s].label}
            </button>
          ))}
        </div>

        <div className="max-w-sm w-full sm:w-64">
          <SearchInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={instructors}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconUsers}
            title="No instructors found"
            description={
              search || statusFilter !== "ALL"
                ? "Try adjusting your filters."
                : "No instructors have been added yet."
            }
          />
        }
      />

      {viewInstructor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewInstructor(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${viewInstructor.name}'s profile`}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                    {viewInstructor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground truncate">
                      {viewInstructor.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          statusConfig[
                            viewInstructor.instructorProfile?.status ??
                              "PENDING"
                          ]?.classes ??
                          "bg-muted/15 text-muted-foreground border-muted/25"
                        }`}
                      >
                        {viewInstructor.instructorProfile?.status ?? "PENDING"}
                      </span>
                      {viewInstructor.instructorProfile && (
                        <StarRating
                          rating={viewInstructor.instructorProfile.rating}
                        />
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <IconMail size={14} />
                      <span className="truncate">{viewInstructor.email}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewInstructor(null)}
                  className="text-muted hover:text-foreground"
                  aria-label="Close instructor profile"
                >
                  <IconX size={20} stroke={1.5} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <p className="py-10 text-center text-sm text-muted animate-pulse">
                  Loading instructor details...
                </p>
              ) : (
                <>
                  <div className="border-b border-border px-5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                          activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab("professional")}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                          activeTab === "professional"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Professional Info
                      </button>
                      <button
                        onClick={() => setActiveTab("contact")}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                          activeTab === "contact"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Contact &amp; Payment
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {activeTab === "overview" && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-lg border border-border bg-card-hover/40 p-3">
                            <p className="text-[11px] text-muted">
                              Active Batches
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-foreground">
                              {viewInstructor.activeBatchCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-card-hover/40 p-3">
                            <p className="text-[11px] text-muted">
                              Live Sessions
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-foreground">
                              {viewInstructor.liveSessionCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-card-hover/40 p-3">
                            <p className="text-[11px] text-muted">
                              Completed Sessions
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-foreground">
                              {viewInstructor.completedSessionCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-card-hover/40 p-3">
                            <p className="text-[11px] text-muted">Students</p>
                            <p className="mt-0.5 text-lg font-bold text-foreground">
                              {viewInstructor.totalStudents}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card-hover/30 p-4 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                            Summary
                          </h4>
                          <FieldRow
                            label="Designation"
                            value={
                              viewInstructor.instructorProfile?.designation
                            }
                          />
                          <FieldRow
                            label="Bio"
                            value={viewInstructor.instructorProfile?.bio}
                          />
                          <FieldRow
                            label="Experience"
                            value={
                              viewInstructor.instructorProfile?.experienceYears
                                ? `${viewInstructor.instructorProfile.experienceYears} years`
                                : null
                            }
                          />
                          <FieldRow
                            label="Joined"
                            value={
                              viewInstructor.instructorProfile?.joiningDate
                                ? new Date(
                                    viewInstructor.instructorProfile
                                      .joiningDate,
                                  ).toLocaleDateString("en-IN")
                                : null
                            }
                          />
                          <FieldRow label="Languages">
                            {Array.isArray(
                              viewInstructor.instructorProfile?.languages,
                            ) &&
                            viewInstructor.instructorProfile!.languages.length >
                              0 ? (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {viewInstructor.instructorProfile!.languages.map(
                                  (l) => (
                                    <span
                                      key={l}
                                      className="inline-flex rounded bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                                    >
                                      {l}
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </FieldRow>
                        </div>
                      </>
                    )}
                    {activeTab === "professional" && (
                      <div className="rounded-xl border border-border bg-card-hover/30 p-4 space-y-3">
                        <FieldRow
                          label="Bio"
                          value={viewInstructor.instructorProfile?.bio}
                        />
                        <FieldRow
                          label="Qualification"
                          value={
                            viewInstructor.instructorProfile?.qualification
                          }
                        />
                        <FieldRow
                          label="Experience"
                          value={
                            viewInstructor.instructorProfile?.experienceYears
                              ? `${viewInstructor.instructorProfile.experienceYears} years`
                              : null
                          }
                        />
                        <FieldRow label="Skills">
                          {Array.isArray(
                            viewInstructor.instructorProfile?.skills,
                          ) &&
                          viewInstructor.instructorProfile!.skills.length >
                            0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {viewInstructor.instructorProfile!.skills.map(
                                (s) => (
                                  <span
                                    key={s}
                                    className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                                  >
                                    {s}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </FieldRow>
                        <FieldRow label="Languages">
                          {Array.isArray(
                            viewInstructor.instructorProfile?.languages,
                          ) &&
                          viewInstructor.instructorProfile!.languages.length >
                            0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {viewInstructor.instructorProfile!.languages.map(
                                (l) => (
                                  <span
                                    key={l}
                                    className="inline-flex rounded bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                                  >
                                    {l}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </FieldRow>
                        <FieldRow
                          label="Currently Employed"
                          value={
                            viewInstructor.instructorProfile?.currentlyEmployed
                              ? "Yes"
                              : "No"
                          }
                        />
                        <FieldRow
                          label="Company"
                          value={viewInstructor.instructorProfile?.companyName}
                        />
                        <FieldRow
                          label="Available Time"
                          value={
                            viewInstructor.instructorProfile?.availableTime
                          }
                        />
                      </div>
                    )}
                    {activeTab === "contact" && (
                      <div className="rounded-xl border border-border bg-card-hover/30 p-4 space-y-3">
                        <FieldRow
                          label="Phone"
                          value={viewInstructor.instructorProfile?.phone}
                        />
                        <FieldRow
                          label="Address"
                          value={viewInstructor.instructorProfile?.address}
                        />
                        <FieldRow
                          label="City"
                          value={viewInstructor.instructorProfile?.city}
                        />
                        <FieldRow
                          label="State"
                          value={viewInstructor.instructorProfile?.state}
                        />
                        <FieldRow
                          label="Country"
                          value={viewInstructor.instructorProfile?.country}
                        />
                        <FieldRow label="Social Links">
                          {viewInstructor.instructorProfile?.socialLinks &&
                          typeof viewInstructor.instructorProfile
                            .socialLinks === "object" ? (
                            <div className="flex flex-wrap gap-2 justify-end">
                              {viewInstructor.instructorProfile.socialLinks
                                .linkedin && (
                                <a
                                  href={
                                    viewInstructor.instructorProfile.socialLinks
                                      .linkedin
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {viewInstructor.instructorProfile.socialLinks
                                .github && (
                                <a
                                  href={
                                    viewInstructor.instructorProfile.socialLinks
                                      .github
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {viewInstructor.instructorProfile.socialLinks
                                .portfolio && (
                                <a
                                  href={
                                    viewInstructor.instructorProfile.socialLinks
                                      .portfolio
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  Portfolio
                                </a>
                              )}
                              {Object.keys(
                                viewInstructor.instructorProfile.socialLinks,
                              ).length === 0 && "—"}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </FieldRow>
                        <FieldRow label="Bank">
                          {viewInstructor.instructorProfile?.bankName ? (
                            <div className="text-sm text-foreground">
                              <p>{viewInstructor.instructorProfile.bankName}</p>
                              <p className="text-xs text-muted-foreground">
                                {viewInstructor.instructorProfile
                                  .bankAccountHolderName &&
                                  `${viewInstructor.instructorProfile.bankAccountHolderName} · `}
                                {viewInstructor.instructorProfile
                                  .bankAccountNumber
                                  ? `xxxx${viewInstructor.instructorProfile.bankAccountNumber.slice(-4)}`
                                  : ""}
                              </p>
                              {viewInstructor.instructorProfile
                                .bankIfscCode && (
                                <p className="text-xs text-muted-foreground">
                                  IFSC:{" "}
                                  {
                                    viewInstructor.instructorProfile
                                      .bankIfscCode
                                  }
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </FieldRow>
                        <FieldRow
                          label="UPI ID"
                          value={viewInstructor.instructorProfile?.upiId}
                        />
                        <FieldRow
                          label="Joining Date"
                          value={
                            viewInstructor.instructorProfile?.joiningDate
                              ? new Date(
                                  viewInstructor.instructorProfile.joiningDate,
                                ).toLocaleDateString("en-IN")
                              : null
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <a
                href={`/admin/instructors/${viewInstructor.id}/edit`}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconEdit size={15} />
                Edit Instructor
              </a>
              <button
                onClick={() => setViewInstructor(null)}
                className="btn-primary text-sm"
              >
                Close
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
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-32">
        {label}
      </span>
      <div className="text-sm text-foreground text-right flex-1">
        {children ??
          (value ? (
            <span>{value}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ))}
      </div>
    </div>
  );
}
