import { useState, useMemo, useEffect } from 'react';
import Pagination from '../Pagination';

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  filterFn,
  emptyTitle,
  emptyDescription,
  emptyAction,
  headerRowClass,
  headerCellClass,
  onRowClick,
  rowKey = 'id',
  isLoading,
  variant = 'table',
}) {
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [activeSearch, pageSize, data]);

  const filtered = useMemo(() => {
    const rows = data || [];
    const q = activeSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (filterFn) return filterFn(row, q);
      return columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val ?? '').toLowerCase().includes(q);
      });
    });
  }, [data, activeSearch, filterFn, columns]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const applySearch = () => {
    setPage(1);
    setActiveSearch(search.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-admin-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        {emptyTitle && <h3 className="text-sm font-semibold text-neutral-700 mb-1">{emptyTitle}</h3>}
        {emptyDescription && <p className="text-xs text-neutral-400 max-w-[200px] w-full">{emptyDescription}</p>}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  const renderSearchBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-admin-100 w-full min-w-0">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-1/2 min-w-0">
        <div className="relative flex-1 min-w-[160px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 h-9 border border-admin-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={applySearch} className="px-4 py-1.5 h-9 bg-admin-600 text-white text-sm font-medium rounded-lg hover:bg-admin-700 transition-colors">
            Search
          </button>
          {activeSearch && (
            <button onClick={clearSearch} className="px-3 py-1.5 h-9 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCell = (row, col, index) =>
    col.cell ? col.cell(row, index) : col.accessor ? row[col.accessor] : null;

  const renderNoResults = () =>
    filtered.length === 0 && activeSearch ? (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="text-sm text-neutral-400">No results match your search.</p>
        <button onClick={clearSearch} className="mt-2 text-xs font-semibold text-neutral-600 hover:text-neutral-700 transition-colors">
          Clear search
        </button>
      </div>
    ) : null;

  if (variant === 'cards') {
    return (
      <div className="bg-white rounded-xl border border-admin-200 shadow-sm overflow-hidden w-full max-w-full min-w-0">
        {searchable && renderSearchBar()}
        <div className="divide-y divide-admin-100">
          {paginated.map((row, rowIndex) => (
            <div
              key={`${row[rowKey]}-${rowIndex}`}
              onClick={() => onRowClick?.(row)}
              className="px-5 py-4 flex items-center gap-4 hover:bg-neutral-50/80 transition-colors cursor-pointer"
            >
              {columns.map((col, i) => (
                <div key={i} className={`${i === 0 ? 'flex-1 min-w-0' : 'shrink-0'} ${col.className || ''}`}>
                  {renderCell(row, col, (page - 1) * pageSize + rowIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
        {renderNoResults()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-admin-200 shadow-sm overflow-hidden w-full max-w-full min-w-0">
      {searchable && renderSearchBar()}

      <div className="admin-table-scroll w-full max-w-full overflow-x-auto">
        <table className="admin-table min-w-[640px] w-full">
          <thead>
            <tr className={`border-b border-admin-100 ${headerRowClass || 'bg-brand-blue'}`}>
              {columns.map((col, i) => (
                <th key={i} className={`text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap ${headerCellClass || 'text-white'} ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, rowIndex) => (
              <tr
                key={`${row[rowKey]}-${rowIndex}`}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-100 last:border-0 transition-colors ${rowIndex % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'} ${onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-blue-50/40'}`}
              >
                {columns.map((col, i) => (
                  <td key={i} className={`px-4 py-3.5 text-sm align-middle text-neutral-700 ${col.className || ''}`}>
                    {renderCell(row, col, (page - 1) * pageSize + rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-admin-100 bg-white w-full min-w-0">
        <Pagination
          totalItems={filtered.length}
          itemsPerPage={pageSize}
          currentPage={page}
          onPageChange={setPage}
          onItemsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      {renderNoResults()}
    </div>
  );
}
