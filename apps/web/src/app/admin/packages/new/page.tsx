"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePageTitle } from "@/lib/use-page-title";
import { IconArrowLeft, IconPackage, IconX } from "@tabler/icons-react";
import {
  SUGGESTED_PACKAGE_NAMES,
  getRelatedCourseIds,
} from "@/lib/suggestions";
import type { PackagedCourse } from "@/lib/suggestions";
import Link from "next/link";

type Course = PackagedCourse;

export default function CreatePackagePage() {
  usePageTitle("New Package");
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFocused, setCourseFocused] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isInternship, setIsInternship] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [relatedCourseIds, setRelatedCourseIds] = useState<string[]>([]);

  // DB-backed package names (fall back to static suggestions)
  const packageNamesQuery = useApiQuery<{ packageNames: { name: string }[] }>(
    ["admin", "content", "package-names"],
    "/api/admin/content/package-names",
  );
  const dbPackageNames =
    packageNamesQuery.data?.packageNames.map((p) => p.name) ?? [];

  const coursesQuery = useApiQuery<{ courses: Course[] }>(
    ["admin", "packages", "courses"],
    "/api/admin/packages/courses",
  );
  const availableCourses = coursesQuery.data?.courses ?? [];
  const loadingCourses = coursesQuery.isPending;

  const packageNameOptions = dbPackageNames.length
    ? dbPackageNames
    : (SUGGESTED_PACKAGE_NAMES as readonly string[]);

  // When a package name is chosen, auto-select the related courses so the
  // admin gets a sensible starter set (they can still add/remove via the UI).
  useEffect(() => {
    const ids = name ? getRelatedCourseIds(name, availableCourses) : [];
    setRelatedCourseIds(ids);
    setSelectedCourseIds((prev) => {
      const union = new Set([...prev, ...ids]);
      if (prev.length === union.size) return prev;
      return [...union];
    });
  }, [name, availableCourses]);

  const addCourse = (courseId: string) => {
    if (!selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
  };

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      price?: number;
      courseIds: string[];
      isInternship: boolean;
    }) => api.post("/api/admin/packages", payload),
    onSuccess: () => {
      toast.success(
        isInternship
          ? "Internship package created successfully"
          : "Package created successfully",
      );
      router.push("/admin/packages");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (!isInternship && selectedCourseIds.length === 0) {
      toast.error("Select at least one course");
      return;
    }

    const priceNum = price ? parseInt(price, 10) * 100 : undefined;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      courseIds: selectedCourseIds,
      isInternship,
    });
  };

  const selectedCourses = availableCourses.filter((c) =>
    selectedCourseIds.includes(c.id),
  );
  const unselectedCourses = availableCourses.filter(
    (c) => !selectedCourseIds.includes(c.id),
  );

  // Type-to-filter suggestions shown below each input
  const filteredNameOptions = useMemo(() => {
    const q = name.trim().toLowerCase();
    const base = packageNameOptions as readonly string[];
    if (!q) return base.slice(0, 6);
    return base.filter((n) => n.toLowerCase().includes(q)).slice(0, 6);
  }, [name, packageNameOptions]);

  const filteredCourseOptions = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return unselectedCourses.slice(0, 6);
    return (
      unselectedCourses
        .filter((c) => c.title.toLowerCase().includes(q))
        // rank prefix matches first
        .sort((a, b) => {
          const aq = a.title.toLowerCase().startsWith(q) ? 0 : 1;
          const bq = b.title.toLowerCase().startsWith(q) ? 0 : 1;
          return aq - bq;
        })
        .slice(0, 6)
    );
  }, [courseSearch, unselectedCourses]);

  return (
    <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
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

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Basic Info */}
        <div className="w-full glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Package Details
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Name <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Type a package name…"
                className="field w-full"
                maxLength={100}
              />
              {nameFocused && filteredNameOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg">
                  {filteredNameOptions.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setName(n);
                        setNameFocused(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-card-hover"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Type freely — pick a suggestion below if it matches, or keep
              your own custom name.
            </p>
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

          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              id="isInternship"
              checked={isInternship}
              onChange={(e) => setIsInternship(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="isInternship" className="cursor-pointer">
              <span className="block text-sm font-medium text-foreground">
                Internship package
              </span>
              <span className="block text-xs text-muted-foreground">
                Used for intern applications (fee payment, no courses required)
              </span>
            </label>
          </div>
        </div>

        {/* Course Selection */}
        {!isInternship && (
          <div className="w-full glass-card p-6 space-y-4">
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
                    Courses matching this package were auto-selected below. You
                    can add more or remove any course.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onFocus={() => setCourseFocused(true)}
                      onBlur={() => setCourseFocused(false)}
                      placeholder="Type to search courses…"
                      className="field w-full"
                    />
                    {courseFocused && (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
                        {filteredCourseOptions.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            {unselectedCourses.length === 0
                              ? "All courses added"
                              : "No courses match"}
                          </p>
                        ) : (
                          filteredCourseOptions.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addCourse(course.id);
                                setCourseSearch("");
                              }}
                              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-card-hover"
                            >
                              {course.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
                            {relatedCourseIds.includes(course.id) && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Related
                              </span>
                            )}
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
        )}

        {/* Actions */}
        <div className="w-full flex items-center justify-end gap-2">
          <Link href="/admin/packages" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              (!isInternship && selectedCourseIds.length === 0)
            }
            className="btn-primary w-full text-sm flex items-center gap-1.5"
          >
            {createMutation.isPending ? (
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
