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
}

function Table<T extends object>({
  columns,
  data,
  loading = false,
  actions,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-neutral-200 rounded-xl">
      <table className="min-w-full text-sm">
        
        {/* Table Head */}
        <thead className="text-label-l3 font-semibold text-black bg-neutral-50 h-13.5">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}

            {actions && (
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
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
                className="border-t border-neutral-200 hover:bg-neutral-50"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-label-l3 h-14">
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}

                {actions && (
                  <td className="px-4 py-3">{actions(row)}</td>
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