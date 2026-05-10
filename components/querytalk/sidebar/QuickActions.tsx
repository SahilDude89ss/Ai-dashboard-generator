"use client";

import { ExternalLink, Download } from "lucide-react";
import { ExecutedQuery } from "@/types";

interface Props {
  queries: ExecutedQuery[];
  onExportToDashcraft: () => void;
}

function downloadCsv(query: ExecutedQuery) {
  if (!query.result) return;
  const { columns, rows } = query.result;
  const csv = [
    columns.join(","),
    ...rows.map((r) =>
      columns.map((c) => JSON.stringify(r[c] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${query.title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function QuickActions({ queries, onExportToDashcraft }: Props) {
  const firstSuccessful = queries.find(
    (q) => q.status === "success" && q.result
  );

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExportToDashcraft}
        disabled={queries.length === 0}
        className="flex items-center gap-1.5 text-xs bg-s2 hover:bg-s3 disabled:opacity-40 disabled:cursor-not-allowed text-muted2 hover:text-text rounded-btn px-3 py-1.5 transition-colors border border-DEFAULT"
      >
        <ExternalLink size={12} />
        Export to Dashcraft
      </button>

      <button
        onClick={() => firstSuccessful && downloadCsv(firstSuccessful)}
        disabled={!firstSuccessful}
        className="flex items-center gap-1.5 text-xs bg-s2 hover:bg-s3 disabled:opacity-40 disabled:cursor-not-allowed text-muted2 hover:text-text rounded-btn px-3 py-1.5 transition-colors border border-DEFAULT"
      >
        <Download size={12} />
        Download CSV
      </button>
    </div>
  );
}
