"use client";

import { useState } from "react";
import { Code, Edit2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ExecutedQuery } from "@/types";
import { StreamingIndicator } from "../chat/StreamingIndicator";
import { ErrorResult } from "./ErrorResult";
import { NumberResult } from "./NumberResult";
import { TableResult } from "./TableResult";
import { ChartResult } from "./ChartResult";

interface Props {
  query: ExecutedQuery;
  onSqlEdit?: (sql: string) => void;
  onRetry?: () => void;
}

export function ResultRenderer({ query, onSqlEdit, onRetry }: Props) {
  const [sqlExpanded, setSqlExpanded] = useState(false);

  const currentSql = query.editedSql ?? query.sql;

  function renderStatusBadge() {
    switch (query.status) {
      case "running":
        return (
          <span className="flex items-center gap-1 text-muted2 text-xs">
            <Loader2 size={12} className="animate-spin" />
            running
          </span>
        );
      case "success":
        return (
          <span className="flex items-center gap-1 text-a2 text-xs">
            <CheckCircle2 size={12} />
            success
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-a3 text-xs">
            <XCircle size={12} />
            error
          </span>
        );
      default:
        return null;
    }
  }

  function renderResult() {
    if (query.status === "running") {
      return <StreamingIndicator label="Executing query…" />;
    }

    if (query.status === "error") {
      return (
        <ErrorResult
          error={query.error ?? "An unknown error occurred"}
          onRetry={onRetry}
        />
      );
    }

    if (query.status === "success" && query.result) {
      const { viz, result } = query;

      if (viz.type === "number") {
        return <NumberResult result={result} title={query.title} />;
      }

      if (viz.type === "table") {
        return <TableResult result={result} />;
      }

      if (["line", "bar", "bar_h", "donut"].includes(viz.type)) {
        const chart = <ChartResult result={result} viz={viz} />;
        if (chart) return chart;
        return <TableResult result={result} />;
      }

      return <TableResult result={result} />;
    }

    return null;
  }

  return (
    <div className="bg-s1 border border-DEFAULT rounded-card p-4 animate-fadeUp flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-text text-sm font-medium truncate">{query.title}</p>
        {renderStatusBadge()}
      </div>

      {/* Result */}
      {renderResult()}

      {/* SQL section */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setSqlExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted2 hover:text-text bg-s2 rounded px-2 py-1 transition-colors"
        >
          <Code size={11} />
          SQL
        </button>
        {onSqlEdit && (
          <button
            onClick={() => onSqlEdit(currentSql)}
            className="flex items-center gap-1 text-xs text-muted2 hover:text-text bg-s2 rounded px-2 py-1 transition-colors"
          >
            <Edit2 size={11} />
            Edit
          </button>
        )}
      </div>

      {sqlExpanded && (
        <pre className="mt-2 text-xs font-mono text-muted2 bg-s2 rounded p-2 overflow-x-auto whitespace-pre-wrap">
          {currentSql}
        </pre>
      )}
    </div>
  );
}
