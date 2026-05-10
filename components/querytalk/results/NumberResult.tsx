"use client";

import { QueryResult } from "@/types";

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function NumberResult({
  result,
  title,
}: {
  result: QueryResult;
  title?: string;
}) {
  const firstRow = result.rows[0];
  const numericColumn = firstRow
    ? result.columns.find((col) => typeof firstRow[col] === "number")
    : undefined;

  const rawValue =
    numericColumn && firstRow ? firstRow[numericColumn] : undefined;
  const value = typeof rawValue === "number" ? rawValue : null;

  return (
    <div className="flex flex-col items-start gap-1 py-2">
      {title && <p className="text-muted2 text-xs uppercase tracking-wide">{title}</p>}
      <p className="text-4xl font-bold text-text font-syne">
        {value !== null ? formatNumber(value) : "—"}
      </p>
      {numericColumn && (
        <p className="text-muted text-sm">{numericColumn}</p>
      )}
    </div>
  );
}
