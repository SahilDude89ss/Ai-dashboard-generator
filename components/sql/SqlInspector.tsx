"use client";
import { useState, useCallback } from "react";
import { Widget, DbConnectionConfig, DbDialect, DbSchema } from "@/types";
import { SqlHighlight } from "./SqlHighlight";
import { SqlEditor } from "./SqlEditor";
import { Button } from "@/components/ui/Button";
import { Copy, Play, Check, Clock } from "lucide-react";
import { toast } from "sonner";

interface SqlInspectorProps {
  widget: Widget;
  connection?: DbConnectionConfig;
  dialect?: DbDialect;
  schema?: DbSchema;
  onSqlChange: (sql: string) => void;
  onRun: () => void;
}

export function SqlInspector({ widget, connection, dialect, schema, onSqlChange, onRun }: SqlInspectorProps) {
  const [tab, setTab] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(widget.sql);
      setCopied(true);
      toast.success("SQL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [widget.sql]);

  return (
    <div className="border-t border-[rgba(255,255,255,0.06)] mt-3 pt-3 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("view")}
            className={`px-3 py-1 rounded-input text-xs font-semibold transition-colors ${
              tab === "view" ? "bg-s3 text-text" : "text-muted hover:text-muted2"
            }`}
          >
            View
          </button>
          <button
            onClick={() => setTab("edit")}
            className={`px-3 py-1 rounded-input text-xs font-semibold transition-colors ${
              tab === "edit" ? "bg-s3 text-text" : "text-muted hover:text-muted2"
            }`}
          >
            Edit
          </button>
        </div>

        <div className="flex items-center gap-2">
          {widget.result?.executionMs !== undefined && (
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Clock size={10} />
              {widget.result.executionMs}ms
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check size={12} className="text-a2" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          {connection && (
            <Button variant="primary" size="sm" onClick={onRun}>
              <Play size={12} />
              Run
            </Button>
          )}
        </div>
      </div>

      {tab === "view" ? (
        <SqlHighlight sql={widget.sql} />
      ) : (
        <SqlEditor
          value={widget.sql}
          onChange={onSqlChange}
          onRun={connection ? onRun : undefined}
          dialect={dialect}
          schema={schema}
        />
      )}
    </div>
  );
}
