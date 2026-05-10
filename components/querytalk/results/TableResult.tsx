"use client";

import { QueryResult } from "@/types";
import { EmptyResult } from "./EmptyResult";

export function TableResult({ result }: { result: QueryResult }) {
  if (result.rows.length === 0) {
    return <EmptyResult />;
  }

  return (
    <div className="flex flex-col gap-2">
      {result.truncated && (
        <div className="self-start">
          <span className="text-xs bg-a4/20 text-a4 rounded-full px-2 py-0.5">
            Results truncated
          </span>
        </div>
      )}
      <div className="max-h-64 overflow-y-auto rounded-card border border-DEFAULT">
        <table className="w-full text-left">
          <thead className="bg-s2 sticky top-0">
            <tr>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-xs text-muted2 font-medium whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? "bg-s1" : "bg-s2/30"}
              >
                {result.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 text-sm text-text whitespace-nowrap max-w-[200px] truncate"
                  >
                    {row[col] != null ? String(row[col]) : ""}
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
