import React from "react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Shorter header and rows, for tables embedded in a page section. Off by default. */
  compact?: boolean;
}

function Table<T extends object>({
  columns,
  data,
  loading = false,
  actions,
  onRowClick,
  compact = false,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-pneutral-200 rounded-xl font-open-sans">
      <table className="min-w-full text-sm bg-white">
        
        {/* Table Head */}
        <thead className={`text-label-l4 text-pneutral-50 bg-secondary-600 ${compact ? "h-10" : "h-13.5"} sticky top-0 z-10`}>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`${compact ? "px-3 py-2 text-xs" : "px-4 py-3"} text-left font-semibold whitespace-nowrap`}
              >
                {col.header}
              </th>
            ))}

            {actions && (
              <th className={`${compact ? "px-3 py-2 text-xs" : "px-4 py-3"} text-left font-semibold`}>Actions</th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-6"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-6 text-neutral-500 "
              >
                No Data Found
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t border-neutral-200 hover:bg-neutral-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={`${compact ? "px-3 py-2 h-11 text-sm" : "px-4 py-3 h-14 text-label-l4"} whitespace-nowrap font-normal`}>
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}

                {actions && (
                  <td
                    className={compact ? "px-3 py-2" : "px-4 py-3"}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;