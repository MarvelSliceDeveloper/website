"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconBook,
  IconSearch,
  IconEdit,
  IconPhoto,
  IconUpload,
  IconArchive,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

type Course = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string | null;
  thumbnailUrl: string | null;
  updatedAt: string;
  _count: { modules: number; batches: number };
};

type CourseListResponse = {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
};

type ChecklistItem = { item: string; passed: boolean };

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

export default function AdminCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading courses...</p>
        </div>
      }
    >
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [purging, setPurging] = useState<string | null>(null);
  const [recovering, setRecovering] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const data = await api.get<CourseListResponse>(
        "/api/admin/courses",
        params,
      );
      setCourses(data.courses);
      setTotal(data.total);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => setStatusFilter(statusParam));
  }, [statusParam]);

  useEffect(() => {
    Promise.resolve().then(() => fetchCourses());
  }, [statusFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Archive "${title}"? Students will lose access.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/admin/courses/${id}`);
      toast.success("Course archived");
      fetchCourses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const result = await api.post<{
        published: boolean;
        checklist: ChecklistItem[];
      }>(`/api/admin/courses/${id}/publish`);
      if (!result.published) {
        const failedItems = result.checklist
          .filter((c: ChecklistItem) => !c.passed)
          .map((c: ChecklistItem) => `• ${c.item}`)
          .join("\n");
        toast.error(`Cannot publish. Fix these:\n${failedItems}`);
        return;
      }
      toast.success("Course published");
      fetchCourses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.post(`/api/admin/courses/${id}/unpublish`);
      toast.success("Course unpublished");
      fetchCourses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRecover = async (id: string) => {
    setRecovering(id);
    try {
      await api.post(`/api/admin/courses/${id}/recover`);
      toast.success("Course recovered to draft");
      fetchCourses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRecovering(null);
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Permanently delete "${title}"? This will remove all associated modules, batches, enrollments, and data. This cannot be undone.`,
      )
    )
      return;
    setPurging(id);
    try {
      await api.delete(`/api/admin/courses/${id}/permanent`);
      toast.success("Course permanently deleted");
      fetchCourses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPurging(null);
    }
  };

  const columns: DataTableColumn<Course>[] = [
    {
      key: "title",
      label: "Course",
      render: (_, course) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center overflow-hidden">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt=""
                width={56}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <IconBook size={20} stroke={1.5} className="text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/courses/${course.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary-hover transition-colors truncate block"
            >
              {course.title}
            </Link>
            {course.category && (
              <p className="text-xs text-muted truncate">{course.category}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, course) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[course.status]}`}
        >
          {course.status}
        </span>
      ),
    },
    {
      key: "_count.modules",
      label: "Modules",
      render: (_, course) => (
        <span className="text-sm text-muted-foreground">
          {course._count.modules}
        </span>
      ),
    },
    {
      key: "_count.batches",
      label: "Batches",
      render: (_, course) => (
        <span className="text-sm text-muted-foreground">
          {course._count.batches}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (_, course) => (
        <span className="text-xs text-muted">
          {new Date(course.updatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, course) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/courses/${course.id}`}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit course"
          >
            <IconEdit size={14} />
          </Link>
          {course.status === "DRAFT" && (
            <button
              onClick={() => handlePublish(course.id)}
              className="rounded-md border border-success/20 p-1.5 text-success hover:bg-success/10 transition-colors"
              title="Publish course"
            >
              <IconUpload size={14} />
            </button>
          )}
          {course.status === "PUBLISHED" && (
            <button
              onClick={() => handleUnpublish(course.id)}
              className="rounded-md border border-warning/20 p-1.5 text-warning hover:bg-warning/10 transition-colors"
              title="Unpublish course"
            >
              <IconPhoto size={14} />
            </button>
          )}
          {course.status !== "ARCHIVED" && (
            <button
              onClick={() => handleDelete(course.id, course.title)}
              disabled={deleting === course.id}
              className="rounded-md border border-danger/20 p-1.5 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              title="Archive course"
            >
              {deleting === course.id ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
              ) : (
                <IconArchive size={14} />
              )}
            </button>
          )}
          {course.status === "ARCHIVED" && (
            <>
              <button
                onClick={() => handleRecover(course.id)}
                disabled={recovering === course.id}
                className="rounded-md border border-success/20 p-1.5 text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                title="Recover course"
              >
                {recovering === course.id ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-success border-t-transparent" />
                ) : (
                  <IconRefresh size={14} />
                )}
              </button>
              <button
                onClick={() => handlePermanentDelete(course.id, course.title)}
                disabled={purging === course.id}
                className="rounded-md border border-danger/20 p-1.5 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                title="Delete permanently"
              >
                {purging === course.id ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
                ) : (
                  <IconTrash size={14} />
                )}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Course Management"
        description={`${total} course${total !== 1 ? "s" : ""} total`}
        action={
          <Link href="/admin/courses/new" className="btn-primary">
            + Add Course
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={handleSearch}
          className="flex-1 min-w-[200px] flex items-center gap-2 max-w-sm"
        >
          <div className="relative flex-1">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="field field-search w-full"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Search"
          >
            <IconSearch size={16} />
          </button>
        </form>

        <div className="flex gap-1.5">
          {["", "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-primary/15 text-primary-hover border border-primary/25"
                  : "text-muted-foreground hover:bg-card-hover border border-transparent"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : courses.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconBook}
          title="No courses yet"
          description="Add your first course to get started."
          action={
            <Link
              href="/admin/courses/new"
              className="btn-primary mt-4 inline-flex"
            >
              + Add Course
            </Link>
          }
        />
      ) : (
        <DataTable columns={columns} data={courses} />
      )}
    </div>
  );
}
