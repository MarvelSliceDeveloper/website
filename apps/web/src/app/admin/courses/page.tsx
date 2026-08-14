"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import {
  IconBook,
  IconEdit,
  IconPhoto,
  IconUpload,
  IconArchive,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import { FilterTabs } from "@/components/shared/FilterTabs";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminWorkflowGuide } from "@/components/admin/AdminWorkflowGuide";

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
  usePageTitle("Courses");
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

  const PAGE_SIZE = 10;
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const confirmDelete = useConfirmDialog();

  // List query keyed on the active filter/search/page so any change refetches.
  const coursesQuery = useApiQuery<CourseListResponse>(
    ["admin", "courses", statusFilter || "all", search || "all", page],
    "/api/admin/courses",
    {
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    },
  );
  const courses = coursesQuery.data?.courses ?? [];
  const total = coursesQuery.data?.total ?? 0;
  const loading = coursesQuery.isPending;

  useEffect(() => {
    Promise.resolve().then(() => setStatusFilter(statusParam));
  }, [statusParam]);

  // Reset to page 1 whenever the filter or search term changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/courses/${id}`),
    onSuccess: () => {
      toast.success("Course archived");
      void coursesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (id: string, title: string) => {
    if (!(await confirmDelete({ title: "Archive Course", message: `Archive "${title}"? Students will lose access.` })))
      return;
    deleteMutation.mutate(id);
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{
        published: boolean;
        checklist: ChecklistItem[];
      }>(`/api/admin/courses/${id}/publish`),
  });

  const handlePublish = (id: string) => {
    void withLoadingToast(publishMutation.mutateAsync(id), {
      loading: "Publishing course...",
      success: (r) => {
        if (!r.published) {
          const failedItems = (r.checklist ?? [])
            .filter((c: ChecklistItem) => !c.passed)
            .map((c: ChecklistItem) => `• ${c.item}`)
            .join("\n");
          return {
            message: `Cannot publish. Fix these:\n${failedItems}`,
            type: "error",
          };
        }
        return "Course published";
      },
    }).then(() => {
      void coursesQuery.refetch();
    });
  };

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/courses/${id}/unpublish`),
  });

  const handleUnpublish = (id: string) => {
    void withLoadingToast(unpublishMutation.mutateAsync(id), {
      loading: "Unpublishing course...",
      success: () => "Course unpublished",
    }).then(() => {
      void coursesQuery.refetch();
    });
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
              href={`/admin/courses/${course.slug || course.id}`}
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
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/admin/courses/${course.slug || course.id}`}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit course"
          >
            <IconEdit size={16} />
          </Link>
          {course.status === "DRAFT" && (
            <button
              onClick={() => handlePublish(course.id)}
              className="rounded-md border border-success/20 p-2 text-success hover:bg-success/10 transition-colors"
              title="Publish course"
            >
              <IconUpload size={16} />
            </button>
          )}
          {course.status === "PUBLISHED" && (
            <button
              onClick={() => handleUnpublish(course.id)}
              className="rounded-md border border-warning/20 p-2 text-warning hover:bg-warning/10 transition-colors"
              title="Unpublish course"
            >
              <IconPhoto size={16} />
            </button>
          )}
          {course.status !== "ARCHIVED" && (
            <button
              onClick={() => handleDelete(course.id, course.title)}
              disabled={
                deleteMutation.isPending &&
                deleteMutation.variables === course.id
              }
              className="rounded-md border border-danger/20 p-2 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              title="Archive course"
            >
              {deleteMutation.isPending &&
              deleteMutation.variables === course.id ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
              ) : (
                <IconArchive size={16} />
              )}
            </button>
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
        breadcrumbs={[
          { label: "Courses", href: "/admin/courses" },
        ]}
        action={
          <Link href="/admin/courses/new" className="btn-primary">
            + Add Course
          </Link>
        }
      />

      <AdminWorkflowGuide activeStep={1} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { value: "", label: "All" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
        />

        <div className="min-w-[200px] max-w-sm">
          <SearchInput
            placeholder="Search courses..."
            value={search}
            onChange={setSearch}
          />
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
        <DataTable
          columns={columns}
          data={courses}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
