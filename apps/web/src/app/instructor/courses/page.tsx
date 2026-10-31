"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { IconBook, IconChevronRight } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";

type Course = {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status?: string | null;
  category?: string | null;
  _count: { modules: number; batches: number };
};

const statusVariant: Record<
  string,
  { variant: "success" | "warning" | "secondary"; label: string }
> = {
  PUBLISHED: { variant: "success", label: "Published" },
  DRAFT: { variant: "warning", label: "Draft" },
  ARCHIVED: { variant: "secondary", label: "Archived" },
};

const statusOrder = ["PUBLISHED", "DRAFT", "ARCHIVED"];

function statusLabel(status: string) {
  return (
    statusVariant[status]?.label ??
    status.charAt(0) + status.slice(1).toLowerCase()
  );
}

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function InstructorCoursesPage() {
  usePageTitle("Courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetches courses from the instructor-specific endpoint.
  // /api/instructor/courses returns unique courses from the instructor's assigned batches.
  useEffect(() => {
    Promise.all([api.get<Course[]>("/api/instructor/courses").catch(() => [])])
      .then(([coursesRes]) => {
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const course of courses) {
      const key = course.status ?? "UNKNOWN";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [courses]);

  const statusTabs = useMemo(() => {
    const keys = Object.keys(statusCounts).sort((a, b) => {
      const ai = statusOrder.indexOf(a);
      const bi = statusOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return ["ALL", ...keys];
  }, [statusCounts]);

  const searchedCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesStatus =
        statusFilter === "ALL" || (course.status ?? "UNKNOWN") === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        course.title.toLowerCase().includes(term) ||
        (course.category ?? "").toLowerCase().includes(term) ||
        stripHtml(course.description).toLowerCase().includes(term)
      );
    });
  }, [courses, search, statusFilter]);

  const columns: DataTableColumn<Course>[] = [
    {
      key: "title",
      label: "Course",
      render: (_, course) => (
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/10">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt=""
                width={64}
                height={44}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <IconBook size={20} stroke={1.5} className="text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/instructor/courses/${course.id}`}
              className="block truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              {course.title}
            </Link>
            {stripHtml(course.description) && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {stripHtml(course.description)}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_, course) => (
        <span className="text-sm text-muted-foreground">
          {course.category || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, course) => {
        const key = course.status ?? "UNKNOWN";
        const cfg = statusVariant[key] ?? {
          variant: "secondary" as const,
          label: statusLabel(key),
        };
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "_count.batches",
      label: "Batches",
      render: (_, course) => (
        <span className="text-sm font-semibold text-foreground">
          {course._count?.batches ?? 0}
        </span>
      ),
    },
    {
      key: "_count.modules",
      label: "Modules",
      render: (_, course) => (
        <span className="text-sm font-semibold text-foreground">
          {course._count?.modules ?? 0}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, course) => (
        <Link
          href={`/instructor/courses/${course.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs transition-all duration-150 hover:bg-card-hover hover:text-foreground hover:border-border-hover"
          title="Open course"
        >
          Open
          <IconChevronRight size={14} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Courses"
        breadcrumbs={[{ label: "Courses", href: "/instructor/courses" }]}
        role="Instructor"
        description={
          loading
            ? "Courses assigned to your batches."
            : `${courses.length} course${courses.length === 1 ? "" : "s"} assigned to your batches.`
        }
      />

      <DataTable
        columns={columns}
        data={searchedCourses}
        loading={loading}
        pageSize={10}
        headerVariant="blue"
        toolbar={
          <>
            <div className="flex items-center gap-2">
              <label
                htmlFor="course-status-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </label>
              <select
                id="course-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                {statusTabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tab === "ALL"
                      ? `All (${courses.length})`
                      : `${statusLabel(tab)} (${statusCounts[tab] ?? 0})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full max-w-xs">
              <SearchInput
                placeholder="Search course or category..."
                value={search}
                onChange={setSearch}
              />
            </div>
          </>
        }
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconBook}
            title={
              search.trim() || statusFilter !== "ALL"
                ? "No matching courses"
                : "No courses assigned"
            }
            description={
              search.trim() || statusFilter !== "ALL"
                ? "No courses match your filters. Try a different keyword or status."
                : "You haven't been assigned to any courses yet. Please ask your LMS Admin to add you to a batch."
            }
          />
        }
      />
    </div>
  );
}
