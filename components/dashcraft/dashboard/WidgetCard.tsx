"use client";
import { useState } from "react";
import { Widget, DbConnectionConfig, DbDialect, DbSchema } from "@/types";
import { WIDGET_REGISTRY } from "@/components/dashcraft/widgets";
import { SqlInspector } from "@/components/sql/SqlInspector";
import { Spinner } from "@/components/ui/Spinner";
import { Code2, RefreshCw } from "lucide-react";

const COLOR_ACCENTS: Record<string, string> = {
  primary: "bg-accent",
  success: "bg-a2",
  warning: "bg-a4",
  danger: "bg-a3",
};

interface WidgetCardProps {
  widget: Widget;
  index: number;
  connection?: DbConnectionConfig;
  dialect?: DbDialect;
  schema?: DbSchema;
  onSqlChange: (id: string, sql: string) => void;
  onRefresh: (id: string) => void;
}

export function WidgetCard({ widget, index, connection, dialect, schema, onSqlChange, onRefresh }: WidgetCardProps) {
  const [sqlOpen, setSqlOpen] = useState(false);

  const WidgetComponent = WIDGET_REGISTRY[widget.type];
  const accentClass = COLOR_ACCENTS[widget.colorScheme ?? "primary"] ?? "bg-accent";

  return (
    <div
      className="bg-s1 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] rounded-card transition-all duration-200 overflow-hidden flex flex-col"
      style={{
        gridColumn: `span ${widget.gridSpan}`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Accent bar */}
      <div className={`h-0.5 w-full ${accentClass} shrink-0`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
              {widget.title}
            </h3>
            {widget.description && (
              <p className="text-xs text-muted truncate">{widget.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {connection && (
              <button
                onClick={() => onRefresh(widget.id)}
                disabled={widget.status === "loading"}
                className="p-1.5 rounded-input text-muted hover:text-muted2 hover:bg-s2 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={12} className={widget.status === "loading" ? "animate-spin" : ""} />
              </button>
            )}
            <button
              onClick={() => setSqlOpen(!sqlOpen)}
              className={`p-1.5 rounded-input transition-colors ${
                sqlOpen ? "bg-accent/20 text-accent" : "text-muted hover:text-muted2 hover:bg-s2"
              }`}
              title="Toggle SQL"
            >
              <Code2 size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {widget.status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-s1/80 z-10 rounded-input">
              <Spinner size="md" />
            </div>
          )}
          {widget.status === "error" && (
            <div className="text-xs text-a3 bg-a3/10 border border-a3/20 rounded-input px-3 py-2">
              {widget.error ?? "Query failed"}
            </div>
          )}
          {(widget.status === "success" || widget.status === "idle") && WidgetComponent && (
            <WidgetComponent
              widget={widget}
              onSqlChange={(sql) => onSqlChange(widget.id, sql)}
              onRefresh={() => onRefresh(widget.id)}
            />
          )}
          {widget.status === "idle" && !widget.result && (
            <div className="text-xs text-muted">Connect a database to run this query.</div>
          )}
        </div>

        {/* Timestamp */}
        {widget.lastExecutedAt && (
          <div className="mt-2 text-[10px] text-muted text-right">
            Updated {new Date(widget.lastExecutedAt).toLocaleTimeString()}
          </div>
        )}

        {/* SQL Inspector */}
        {sqlOpen && (
          <SqlInspector
            widget={widget}
            connection={connection}
            dialect={dialect}
            schema={schema}
            onSqlChange={(sql) => onSqlChange(widget.id, sql)}
            onRun={() => onRefresh(widget.id)}
          />
        )}
      </div>
    </div>
  );
}
