import type { ReactNode } from "react";

export interface StudentTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface StudentTableProps<T> {
  columns: StudentTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: string;
  emptyMessage?: string;
}

// Generic data table with typed columns and empty state
export default function StudentTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = "No data found.",
  emptyMessage,
}: StudentTableProps<T>) {
  const message = emptyMessage ?? emptyText;

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-195">
          <thead className="bg-card-hover">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  {message}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  className="transition-colors hover:bg-card-hover/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-3 text-sm text-foreground ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
