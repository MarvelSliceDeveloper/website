"use client";

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyState,
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const total = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === "string"
          ? (aVal as string).localeCompare(String(bVal))
          : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const renderCell = (row: T, col: DataTableColumn<T>, index: number) => {
    if (col.render) {
      return col.render((row as Record<string, unknown>)[col.key], row, index);
    }
    return String((row as Record<string, unknown>)[col.key] ?? "");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto min-w-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-xs font-medium uppercase text-muted"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5">
                      <div className="h-4 w-full max-w-32 animate-pulse bg-border" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-10 text-center text-sm text-muted">
          {emptyState ?? "No data"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto min-w-[600px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-xs font-medium uppercase text-muted ${col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable &&
                      sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <IconChevronUp size={14} className="text-muted" />
                      ) : (
                        <IconChevronDown size={14} className="text-muted" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={i}
                className={`${i % 2 === 1 ? "bg-[#f9fafb]" : ""} hover:bg-primary/[0.02] transition-colors`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2.5 text-sm text-foreground"
                  >
                    {renderCell(row, col, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden divide-y divide-border/50">
        {sorted.map((row, i) => (
          <div key={i} className="p-3 space-y-1.5">
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-start justify-between gap-2"
              >
                <span className="text-xs font-medium uppercase text-muted shrink-0 min-w-[80px]">
                  {col.label}
                </span>
                <span className="text-sm text-foreground text-right">
                  {renderCell(row, col, i)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <p className="text-xs text-muted">
            Showing {startItem} to {endItem} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
