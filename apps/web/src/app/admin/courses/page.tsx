"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Course = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string | null;
  price: number;
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

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={
      <div className="glass-card p-12 text-center">
        <p className="text-muted animate-pulse">Loading courses...</p>
      </div>
    }>
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

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const data = await api.get<CourseListResponse>("/api/admin/courses", params);
      setCourses(data.courses);
      setTotal(data.total);
    } catch {
      // API not available — show empty state
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  useEffect(() => {
    fetchCourses();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Archive "${title}"? Students will lose access.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/admin/courses/${id}`);
      fetchCourses();
    } catch {
      alert("Failed to archive course");
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const result = await api.post<{ published: boolean; checklist: any[] }>(
        `/api/admin/courses/${id}/publish`
      );
      if (!result.published) {
        const failedItems = result.checklist
          .filter((c: any) => !c.passed)
          .map((c: any) => `• ${c.item}`)
          .join("\n");
        alert(`Cannot publish. Fix these:\n${failedItems}`);
        return;
      }
      fetchCourses();
    } catch (err: any) {
      // Handle 422 with checklist
      alert(err.message || "Failed to publish");
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.post(`/api/admin/courses/${id}/unpublish`);
      fetchCourses();
    } catch {
      alert("Failed to unpublish");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} course{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          + Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="field max-w-sm"
          />
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

      {/* Course Table */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-lg font-semibold text-foreground">No courses yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first course to get started.
          </p>
          <Link href="/admin/courses/new" className="btn-primary mt-4 inline-flex">
            + Create Course
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Course
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Modules
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Batches
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Price
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Updated
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="transition-colors hover:bg-card-hover/50"
                  >
                    {/* Course title + thumbnail */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-lg overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "📚"
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
                            <p className="text-xs text-muted truncate">
                              {course.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          statusStyles[course.status]
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    {/* Modules */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {course._count.modules}
                    </td>

                    {/* Batches */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {course._count.batches}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 text-sm font-medium text-foreground">
                      {course.price === 0 ? (
                        <span className="text-success">Free</span>
                      ) : (
                        `₹${course.price.toLocaleString()}`
                      )}
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-4 text-xs text-muted">
                      {new Date(course.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          Edit
                        </Link>

                        {course.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(course.id)}
                            className="text-xs font-medium text-success hover:text-success/80 transition-colors"
                          >
                            Publish
                          </button>
                        )}

                        {course.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleUnpublish(course.id)}
                            className="text-xs font-medium text-warning hover:text-warning/80 transition-colors"
                          >
                            Unpublish
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(course.id, course.title)}
                          disabled={deleting === course.id}
                          className="text-xs font-medium text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
                        >
                          {deleting === course.id ? "..." : "Archive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
