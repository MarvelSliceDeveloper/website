"use client";

import {
  IconSearch,
  IconX,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import type { AssignmentStatusFilter, SortKey, SortDir } from "../types";

interface FilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  courseFilter: string;
  onCourseFilterChange: (val: string) => void;
  courseOptions: string[];
  batchFilter: string;
  onBatchFilterChange: (val: string) => void;
  batchOptions: string[];
  statusFilter: AssignmentStatusFilter;
  onStatusFilterChange: (val: AssignmentStatusFilter) => void;
  sortKey: SortKey;
  onSortKeyChange: (val: SortKey) => void;
  sortDir: SortDir;
  onToggleSortDir: () => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const selectClasses =
  "h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground shadow-2xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function FilterToolbar({
  search,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  courseOptions,
  batchFilter,
  onBatchFilterChange,
  batchOptions,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortKeyChange,
  sortDir,
  onToggleSortDir,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
}: FilterToolbarProps) {
  return (
    <section
      aria-label="Assignment filters"
      className="rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-2xs"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
        <label className="relative lg:col-span-5">
          <span className="sr-only">Search assignments</span>
          <IconSearch
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search assignments by title, course, or batch..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-8 text-xs font-medium text-foreground shadow-2xs transition-all placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <IconX size={13} />
            </button>
          )}
        </label>

        <div className="lg:col-span-3">
          <label className="sr-only" htmlFor="assignment-course-filter">
            Filter by course
          </label>
          <select
            id="assignment-course-filter"
            value={courseFilter}
            onChange={(e) => onCourseFilterChange(e.target.value)}
            className={selectClasses}
          >
            <option value="ALL">All Courses</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {batchOptions.length > 0 && (
          <div className="lg:col-span-2">
            <label className="sr-only" htmlFor="assignment-batch-filter">
              Filter by batch
            </label>
            <select
              id="assignment-batch-filter"
              value={batchFilter}
              onChange={(e) => onBatchFilterChange(e.target.value)}
              className={selectClasses}
            >
              <option value="ALL">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          className={
            batchOptions.length > 0 ? "lg:col-span-2" : "lg:col-span-4"
          }
        >
          <label className="sr-only" htmlFor="assignment-status-filter">
            Filter by status
          </label>
          <select
            id="assignment-status-filter"
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as AssignmentStatusFilter)
            }
            className={selectClasses}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="DUE_SOON">Due Soon (7 days)</option>
            <option value="OVERDUE">Overdue</option>
            <option value="GRADED">All Graded</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        <p>
          Showing <strong className="text-foreground">{filteredCount}</strong>{" "}
          of {totalCount} assignments
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
            >
              <IconX size={12} /> Clear filters
            </button>
          )}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <label
            htmlFor="instructor-sort-by"
            className="whitespace-nowrap text-xs font-medium text-muted-foreground"
          >
            Sort by
          </label>
          <select
            id="instructor-sort-by"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="dueDate">Due Date</option>
            <option value="pending">Pending Review</option>
            <option value="submissions">Submissions</option>
            <option value="title">Title</option>
          </select>
          <button
            type="button"
            onClick={onToggleSortDir}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
            aria-label="Toggle sort direction"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-2xs transition-all hover:bg-muted/30 hover:text-foreground cursor-pointer"
          >
            {sortDir === "asc" ? (
              <IconSortAscending size={15} />
            ) : (
              <IconSortDescending size={15} />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
