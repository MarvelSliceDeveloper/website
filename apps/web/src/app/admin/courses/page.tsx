"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage, withLoadingToast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import {
  IconBook,
  IconEdit,
  IconPhoto,
  IconUpload,
  IconArchive,
  IconPlus,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import { FilterTabs } from "@/components/shared/FilterTabs";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminWorkflowGuide } from "@/components/admin/AdminWorkflowGuide";
import PublishChecklistModal, {
  type PublishChecklistItem,
  extractPublishChecklist,
} from "@/components/admin/PublishChecklistModal";

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

type ChecklistItem = PublishChecklistItem;

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
  const [failedChecklist, setFailedChecklist] =
    useState<PublishChecklistItem[] | null>(null);
  const confirmDelete = useConfirmDialog();
  const queryClient = useQueryClient();
  const refreshCatalogue = () =>
    queryClient.invalidateQueries({ queryKey: ["catalogue"] });

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
      void refreshCatalogue();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (id: string, title: string) => {
    if (
      !(await confirmDelete({
        title: "Archive Course",
        message: `Archive "${title}"? Students will lose access.`,
      }))
    )
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
      error: (err: unknown) => {
        const checklist = extractPublishChecklist(err);
        if (checklist) {
          setFailedChecklist(checklist);
          const unmet = checklist.filter((c) => !c.passed).length;
          return `Cannot publish: ${unmet} requirement${unmet === 1 ? "" : "s"} unmet`;
        }
        return getErrorMessage(err);
      },
    }).then(() => {
      void coursesQuery.refetch();
      void refreshCatalogue();
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
      void refreshCatalogue();
    });
  };

  const columns: DataTableColumn<Course>[] = [
    {
      key: "title",
      label: "Course",
      render: (_, course) => (
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-16 shrink-0 rounded-xl bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
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
              href={`/admin/courses/${course.slug || course.id}`}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
            >
              {course.title}
            </Link>
            {course.category && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{course.category}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, course) => (
        <Badge
          variant={
            course.status === "PUBLISHED"
              ? "success"
              : course.status === "DRAFT"
                ? "warning"
                : "secondary"
          }
          size="sm"
          dot
        >
          {course.status}
        </Badge>
      ),
    },
    {
      key: "_count.modules",
      label: "Modules",
      render: (_, course) => (
        <span className="text-sm font-semibold text-foreground">
          {course._count.modules}
        </span>
      ),
    },
    {
      key: "_count.batches",
      label: "Batches",
      render: (_, course) => (
        <span className="text-sm font-semibold text-foreground">
          {course._count.batches}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (_, course) => (
        <span className="text-xs text-muted-foreground">
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
        <div className="flex items-center justify-center gap-1.5">
          <Link
            href={`/admin/courses/${course.slug || course.id}`}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-all duration-150 shadow-2xs hover:border-border-hover"
            title="Edit course"
          >
            <IconEdit size={16} />
          </Link>
          {course.status === "DRAFT" && (
            <button
              onClick={() => handlePublish(course.id)}
              className="rounded-xl border border-success/30 p-2 text-success hover:bg-success/10 transition-all duration-150 shadow-2xs"
              title="Publish course"
            >
              <IconUpload size={16} />
            </button>
          )}
          {course.status === "PUBLISHED" && (
            <button
              onClick={() => handleUnpublish(course.id)}
              className="rounded-xl border border-warning/30 p-2 text-warning hover:bg-warning/10 transition-all duration-150 shadow-2xs"
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
              className="rounded-xl border border-danger/30 p-2 text-danger hover:bg-danger/10 transition-all duration-150 disabled:opacity-50 shadow-2xs"
              title="Archive course"
            >
              {deleteMutation.isPending &&
              deleteMutation.variables === course.id ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-danger border-t-transparent inline-block" />
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
        breadcrumbs={[{ label: "Courses", href: "/admin/courses" }]}
        action={
          <Link href="/admin/courses/new">
            <Button leftIcon={<IconPlus size={16} />}>
              Add Course
            </Button>
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
            <Link href="/admin/courses/new" className="mt-4 inline-flex">
              <Button leftIcon={<IconPlus size={16} />}>Add Course</Button>
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
      <PublishChecklistModal
        checklist={failedChecklist}
        onClose={() => setFailedChecklist(null)}
      />
    </div>
  );
}

