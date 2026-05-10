"use client";
import { useState } from "react";
import { WidgetProps } from "@/types";
import { formatNumber } from "@/lib/utils/format";
import { ChevronUp, ChevronDown } from "lucide-react";

function isNumeric(val: unknown): boolean {
  return typeof val === "number" || (typeof val === "string" && !isNaN(parseFloat(val)) && val.trim() !== "");
}

function formatCell(val: unknown, valueFormat?: string): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number" || (typeof val === "string" && isNumeric(val))) {
    const n = Number(val);
    if (valueFormat === "currency" || valueFormat === "percent" || valueFormat === "duration") {
      return formatNumber(n, valueFormat as "currency" | "percent" | "duration");
    }
    if (Math.abs(n) >= 1000) return formatNumber(n, "number");
    return n % 1 === 0 ? n.toString() : n.toFixed(2);
  }
  if (val instanceof Date) return val.toLocaleDateString();
  return String(val);
}

export default function TableWidget({ widget }: WidgetProps) {
  const { result, columns: displayCols, valueFormat } = widget;
  const rows = result?.rows ?? [];
  const cols = result?.columns ?? [];

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sortedRows = sortCol
    ? [...rows].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) return sortDir === "asc" ? an - bn : bn - an;
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      })
    : rows;

  if (!rows.length) return <div className="text-muted text-sm">No data</div>;

  const headers = displayCols ?? cols;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-full">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            {cols.map((col, i) => {
              const label = headers[i] ?? col;
              const isNum = rows.some((r) => isNumeric(r[col]));
              return (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-muted2 transition-colors ${isNum ? "text-right" : "text-left"}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortCol === col && (
                      sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[rgba(255,255,255,0.03)] hover:bg-s2 transition-colors"
            >
              {cols.map((col) => {
                const val = row[col];
                const isNum = isNumeric(val);
                return (
                  <td
                    key={col}
                    className={`px-3 py-2 text-xs text-text ${isNum ? "text-right tabular-nums" : "text-left"}`}
                  >
                    {formatCell(val, isNum ? valueFormat : undefined)}
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
