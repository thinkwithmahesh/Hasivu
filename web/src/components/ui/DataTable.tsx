import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  className = '',
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className={`w-full overflow-x-auto rounded-lg border border-pm-neutral-200 bg-pm-surface-1 ${className}`}
      >
        <div className="p-8 flex justify-center text-pm-text-tertiary">Loading data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`w-full overflow-x-auto rounded-lg border border-pm-neutral-200 bg-pm-surface-1 ${className}`}
      >
        <div className="p-8 flex justify-center text-pm-text-tertiary">No records found.</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-lg border border-pm-neutral-200 bg-pm-surface-1 shadow-sm ${className}`}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-pm-surface-2/50 border-b border-pm-neutral-200">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-4 font-ui font-bold text-[12px] text-pm-text-secondary uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-pm-neutral-100">
          {data.map(item => (
            <tr key={keyExtractor(item)} className="hover:bg-pm-neutral-50/50 transition-colors">
              {columns.map((col, idx) => {
                const alignmentClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                return (
                  <td
                    key={idx}
                    className={`py-3 px-4 font-body text-[14px] text-pm-text-primary ${alignmentClass}`}
                  >
                    {col.cell ? col.cell(item) : String(item[col.accessorKey as keyof T] ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
