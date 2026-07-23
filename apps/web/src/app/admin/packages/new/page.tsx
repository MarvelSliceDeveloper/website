"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePageTitle } from "@/lib/use-page-title";
import { IconArrowLeft, IconPackage, IconX } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
};

export default function CreatePackagePage() {
  usePageTitle("New Package");
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    api
      .get<{ courses: Course[] }>("/api/admin/packages/courses")
      .then((data) => setAvailableCourses(data.courses || []))
      .catch(() => setAvailableCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  const addCourse = (courseId: string) => {
    if (!selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (selectedCourseIds.length === 0) {
      toast.error("Select at least one course");
      return;
    }

    setLoading(true);
    try {
      const priceNum = price ? parseInt(price, 10) * 100 : undefined;
      await api.post("/api/admin/packages", {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        courseIds: selectedCourseIds,
      });
      toast.success("Package created successfully");
      router.push("/admin/packages");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedCourses = availableCourses.filter((c) =>
    selectedCourseIds.includes(c.id),
  );
  const unselectedCourses = availableCourses.filter(
    (c) => !selectedCourseIds.includes(c.id),
  );

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-3xl">
      <AdminPageHeader
        title="Add Package"
        description="Bundle courses together into a single package."
        breadcrumbs={[
          { label: "Packages", href: "/admin/packages" },
          { label: "Add", href: "/admin/packages/new" },
        ]}
        action={
          <Link
            href="/admin/packages"
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Package Details
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Backend Development"
              className="field w-full"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this package?"
              className="field w-full min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Price (₹){" "}
              <span className="text-xs text-muted-foreground">
                — leave empty for free
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 49999"
              className="field w-full"
            />
          </div>
        </div>

        {/* Course Selection */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Courses <span className="text-danger">*</span>
          </h2>

          {loadingCourses ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border"
                />
              ))}
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Select courses to add to this package
                </label>
                <Select onValueChange={addCourse}>
                  <SelectTrigger className="field w-full">
                    <SelectValue placeholder="-- Add a course --" />
                  </SelectTrigger>
                  <SelectContent>
                    {unselectedCourses.length === 0 ? (
                      <SelectItem value="none" disabled>
                        All courses added
                      </SelectItem>
                    ) : (
                      unselectedCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected courses ({selectedCourses.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedCourses.map((course, index) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {course.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="text-muted hover:text-danger transition-colors"
                        >
                          <IconX size={16} stroke={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCourses.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                  <IconPackage
                    size={32}
                    stroke={1.2}
                    className="mb-2 text-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    No courses selected yet
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Link href="/admin/packages" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || selectedCourseIds.length === 0}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                Adding...
              </>
            ) : (
              "Add Package"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
