"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react";
import type { AssignmentStatusFilter, SortKey, SortDir } from "../types";

interface AssignmentFilterBarProps {
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

export function AssignmentFilterBar({
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
}: AssignmentFilterBarProps) {
  return (
    <Card className="border border-border/80 shadow-2xs">
      <CardContent className="p-5 space-y-3">
        {/* Row 1: Search + Dropdown Filters */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search */}
          <div className="lg:col-span-5">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search assignments by title, course, or batch..."
            />
          </div>

          {/* Course filter */}
          <div className="lg:col-span-3">
            <select
              value={courseFilter}
              onChange={(e) => onCourseFilterChange(e.target.value)}
              aria-label="Filter by course"
              className="h-[42px] w-full px-3 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
            >
              <option value="ALL">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Batch filter */}
          {batchOptions.length > 0 && (
            <div className="lg:col-span-2">
              <select
                value={batchFilter}
                onChange={(e) => onBatchFilterChange(e.target.value)}
                aria-label="Filter by batch"
                className="h-[42px] w-full px-3 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
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

          {/* Status filter */}
          <div
            className={
              batchOptions.length > 0 ? "lg:col-span-2" : "lg:col-span-4"
            }
          >
            <select
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as AssignmentStatusFilter)
              }
              aria-label="Filter by status"
              className="h-[42px] w-full px-3 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="DUE_SOON">Due Soon (7 days)</option>
              <option value="OVERDUE">Overdue</option>
              <option value="GRADED">All Graded</option>
            </select>
          </div>
        </div>

        {/* Row 2: Counts + Sort options */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconFilter size={14} className="text-muted" />
            <span>
              Showing{" "}
              <strong className="text-foreground">{filteredCount}</strong> of{" "}
              {totalCount} assignments
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-primary hover:underline font-semibold ml-2 cursor-pointer"
              >
                <IconX size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label
              htmlFor="instructor-sort-by"
              className="text-xs text-muted-foreground font-medium whitespace-nowrap"
            >
              Sort by
            </label>
            <select
              id="instructor-sort-by"
              value={sortKey}
              onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
              className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            >
              <option value="dueDate">Due Date</option>
              <option value="pending">Pending Review</option>
              <option value="submissions">Submissions</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={onToggleSortDir}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer"
              title={sortDir === "asc" ? "Ascending" : "Descending"}
              aria-label="Toggle sort direction"
            >
              {sortDir === "asc" ? (
                <IconSortAscending size={15} />
              ) : (
                <IconSortDescending size={15} />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
