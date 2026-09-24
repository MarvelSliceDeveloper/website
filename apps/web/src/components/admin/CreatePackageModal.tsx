"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { FormModal } from "./FormModal";
import { IconX } from "@tabler/icons-react";

interface CreatePackageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CourseOption = {
  id: string;
  title: string;
};

export function CreatePackageModal({
  open,
  onClose,
  onSuccess,
}: CreatePackageModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isInternship, setIsInternship] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");

  const coursesQuery = useApiQuery<{ courses: CourseOption[] }>(
    ["admin", "packages", "courses"],
    "/api/admin/packages/courses",
    undefined,
    { enabled: open },
  );
  const availableCourses = useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data],
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    const unselected = availableCourses.filter(
      (c) => !selectedCourseIds.includes(c.id),
    );
    if (!q) return unselected.slice(0, 6);
    return unselected
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [courseSearch, availableCourses, selectedCourseIds]);

  const reset = () => {
    setName("");
    setDescription("");
    setPrice("");
    setIsInternship(false);
    setSelectedCourseIds([]);
    setCourseSearch("");
  };

  const handleClose = () => {
    reset();
    onClose();
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
      toast.success("Package created successfully");
      queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "packages"] });
      reset();
      onClose();
      onSuccess?.();
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
      courseIds: isInternship ? [] : selectedCourseIds,
      isInternship,
    });
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Add Package"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-package-form"
            disabled={createMutation.isPending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding..." : "Add Package"}
          </button>
        </>
      }
    >
      <form id="create-package-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="create-pkg-name" className="mb-1.5 block text-sm font-medium text-foreground">
            Name <span className="text-danger">*</span>
          </label>
          <input
            id="create-pkg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type a package name…"
            className="field w-full"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="create-pkg-desc" className="mb-1.5 block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="create-pkg-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's included in this package?"
            className="field w-full min-h-[80px]"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="create-pkg-price" className="mb-1.5 block text-sm font-medium text-foreground">
            Price (₹){" "}
            <span className="text-xs text-muted-foreground">
              — leave empty for free
            </span>
          </label>
          <input
            id="create-pkg-price"
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
            id="create-pkg-internship"
            checked={isInternship}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsInternship(checked);
              if (checked) {
                setSelectedCourseIds([]);
                setCourseSearch("");
              }
            }}
            className="h-4 w-4 accent-primary"
          />
          <label htmlFor="create-pkg-internship" className="cursor-pointer">
            <span className="block text-sm font-medium text-foreground">
              Internship package
            </span>
            <span className="block text-xs text-muted-foreground">
              Used for intern applications (no courses required)
            </span>
          </label>
        </div>
        {!isInternship && (
          <div className="space-y-2">
            <label htmlFor="create-pkg-course-search" className="block text-sm font-medium text-foreground">
              Courses <span className="text-danger">*</span>
            </label>
            <input
              id="create-pkg-course-search"
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Type to search courses…"
              className="field w-full"
            />
            {filteredCourses.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() =>
                      setSelectedCourseIds((prev) =>
                        prev.includes(course.id)
                          ? prev
                          : [...prev, course.id],
                      )
                    }
                    className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-card-hover"
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            )}
            {selectedCourseIds.length > 0 && (
              <div className="space-y-1.5">
                {selectedCourseIds.map((id) => {
                  const course = availableCourses.find((c) => c.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {course?.title ?? id}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCourseIds((prev) =>
                            prev.filter((cid) => cid !== id),
                          )
                        }
                        className="text-muted hover:text-danger transition-colors"
                        aria-label="Remove course"
                      >
                        <IconX size={16} stroke={1.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </FormModal>
  );
}
