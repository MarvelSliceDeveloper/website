import { useMemo } from 'react';

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [totalPages, currentPage]);

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between w-full gap-x-4 gap-y-2 flex-wrap">
      <div className="text-sm text-neutral-600 font-sans">
        {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalItems.toLocaleString()}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-sm font-medium text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed hover:text-black transition-colors"
        >
          &lt; Back
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-neutral-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                p === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-neutral-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="text-sm font-medium text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed hover:text-black transition-colors"
        >
          Next &gt;
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-neutral-600 whitespace-nowrap">Result per page</span>
        <div className="relative min-w-[80px]">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="w-full h-8 pl-2.5 pr-7 rounded border border-gray-200 bg-white text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
          </select>
        </div>
      </div>
    </div>
  );
}
