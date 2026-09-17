"use client";

import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import {
  IconChevronUp,
  IconChevronDown,
  IconFilter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
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
  showSerialNumber?: boolean;
  serialNumberLabel?: string;
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
  showSerialNumber = false,
  serialNumberLabel = "#",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [internalPage, setInternalPage] = useState(1);

  const isControlled = typeof onPageChange === "function";
  const activePage = isControlled ? page : internalPage;

  const total = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endItem = Math.min(activePage * pageSize, total);

  // When not server-controlled, reset to page 1 whenever the data changes
  // (e.g. a filter/search re-fetches the list).
  useEffect(() => {
    if (!isControlled) setInternalPage(1);
  }, [data, isControlled]);

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

  // Client-side slice when the parent does not drive pagination itself.
  const displayed = isControlled
    ? sorted
    : sorted.slice((activePage - 1) * pageSize, activePage * pageSize);

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

  const serialOffset = (activePage - 1) * pageSize;

  const renderTableHeader = () => (
    <thead>
      <tr className="border-b border-border text-left bg-muted/15">
        {showSerialNumber && (
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
            {serialNumberLabel}
          </th>
        )}
        {columns.map((col) => (
          <th
            key={col.key}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
              col.sortable
                ? "cursor-pointer select-none hover:text-primary transition-colors"
                : ""
            }`}
            onClick={() => col.sortable && handleSort(col.key)}
          >
            <span className="inline-flex items-center gap-1.5">
              {col.label}
              {col.sortable &&
                sortKey === col.key &&
                (sortDir === "asc" ? (
                  <IconChevronUp size={14} className="text-primary" />
                ) : (
                  <IconChevronDown size={14} className="text-primary" />
                ))}
              {col.filterable && (
                <IconFilter
                  size={13}
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                />
              )}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableBody = (rows: T[]) => (
    <tbody className="divide-y divide-border/50">
      {rows.map((row, i) => (
        <tr
          key={i}
          className="hover:bg-primary/[0.03] transition-colors"
        >
          {showSerialNumber && (
            <td className="px-4 py-3.5 text-sm text-muted-foreground w-12 font-medium">
              {serialOffset + i + 1}
            </td>
          )}
          {columns.map((col) => (
            <td key={col.key} className="px-4 py-3.5 text-sm text-foreground">
              {renderCell(row, col, i)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-w-[600px]">
          <table className="w-full">
            {renderTableHeader()}
            <tbody className="divide-y divide-border/40">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {showSerialNumber && (
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-6 animate-pulse rounded bg-muted/20" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-muted/20" />
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
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          {emptyState ?? "No records found"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto min-w-[600px]">
        <table className="w-full">
          {renderTableHeader()}
          {renderTableBody(displayed)}
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden divide-y divide-border/50">
        {displayed.map((row, i) => (
          <div key={i} className="p-4 space-y-2">
            {showSerialNumber && (
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  {serialNumberLabel}
                </span>
                <span className="text-sm font-medium text-foreground text-right">
                  {serialOffset + i + 1}
                </span>
              </div>
            )}
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-start justify-between gap-2"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 min-w-[80px]">
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 bg-muted/5">
          <p className="text-xs font-medium text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                isControlled
                  ? onPageChange(activePage - 1)
                  : setInternalPage((p) => Math.max(1, p - 1))
              }
              disabled={activePage <= 1}
            >
              Previous
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-1">
              Page {activePage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                isControlled
                  ? onPageChange(activePage + 1)
                  : setInternalPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={activePage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

