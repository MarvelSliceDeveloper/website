"use client";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
}

// Pagination controls with Previous/Next and page info
export default function PaginationBar({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Showing {from} to {to} of {totalItems} entries
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
          {page}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
