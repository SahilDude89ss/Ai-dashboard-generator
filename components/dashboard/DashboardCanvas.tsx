"use client";
import { useState, useCallback } from "react";
import { Dashboard, DbConnectionConfig, QueryResult } from "@/types";
import { WidgetCard } from "./WidgetCard";
import { useDashboardStore } from "@/store/dashboard";
import { SqlHighlight } from "@/components/sql/SqlHighlight";
import { Button } from "@/components/ui/Button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

interface DashboardCanvasProps {
  dashboard: Dashboard;
  connection?: DbConnectionConfig;
}

export function DashboardCanvas({ dashboard, connection }: DashboardCanvasProps) {
  const { updateWidgetSql, setWidgetResult, setWidgetError, updateWidget } = useDashboardStore();
  const [allQueriesOpen, setAllQueriesOpen] = useState(false);

  const runQuery = useCallback(
    async (widgetId: string) => {
      const widget = dashboard.widgets.find((w) => w.id === widgetId);
      if (!widget || !connection) return;

      updateWidget(widgetId, { status: "loading" });
      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: widget.sql, connection, maxRows: 500 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Query failed");
        setWidgetResult(widgetId, data as QueryResult);
      } catch (err) {
        setWidgetError(widgetId, err instanceof Error ? err.message : "Query failed");
      }
    },
    [dashboard.widgets, connection, updateWidget, setWidgetResult, setWidgetError]
  );

  const exportAllSql = useCallback(() => {
    const content = dashboard.widgets
      .map((w) => `-- Widget: ${w.title}\n-- Type: ${w.type}\n${w.sql}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dashboard.title.replace(/\s+/g, "_")}_queries.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dashboard]);

  return (
    <div>
      {/* Widget Grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {dashboard.widgets.map((widget, i) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            index={i}
            connection={connection}
            dialect={dashboard.dialect}
            schema={dashboard.schema}
            onSqlChange={updateWidgetSql}
            onRefresh={runQuery}
          />
        ))}
      </div>

      {/* All Queries Panel */}
      <div className="mt-8 border border-[rgba(255,255,255,0.06)] rounded-card overflow-hidden">
        <button
          onClick={() => setAllQueriesOpen(!allQueriesOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-s2 transition-colors"
        >
          <span className="text-sm font-semibold text-muted2">
            All Queries ({dashboard.widgets.length})
          </span>
          {allQueriesOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </button>

        {allQueriesOpen && (
          <div className="border-t border-[rgba(255,255,255,0.06)] p-5 space-y-6 bg-s1">
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={exportAllSql}>
                <Download size={12} />
                Export all as .sql
              </Button>
            </div>
            {dashboard.widgets.map((widget, i) => (
              <div key={widget.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{i + 1}.</span>
                  <span className="text-sm font-semibold text-text">{widget.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-s3 text-muted2 rounded font-mono">
                    {widget.type}
                  </span>
                </div>
                <SqlHighlight sql={widget.sql} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
