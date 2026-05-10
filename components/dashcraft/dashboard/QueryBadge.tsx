"use client";
import { Widget } from "@/types";
import { BarChart2 } from "lucide-react";

interface QueryBadgeProps {
  widgets: Widget[];
  totalMs?: number;
  onDismiss: () => void;
}

export function QueryBadge({ widgets, totalMs, onDismiss }: QueryBadgeProps) {
  const done = widgets.filter((w) => w.status === "success").length;
  const errored = widgets.filter((w) => w.status === "error").length;

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card text-sm">
      <BarChart2 size={16} className="text-accent shrink-0" />
      <div className="flex items-center gap-3 flex-1">
        <span className="text-text font-semibold">{widgets.length} widgets generated</span>
        {done > 0 && <span className="text-a2 text-xs">{done} loaded</span>}
        {errored > 0 && <span className="text-a3 text-xs">{errored} failed</span>}
        {totalMs && <span className="text-muted text-xs">in {(totalMs / 1000).toFixed(1)}s</span>}
      </div>
      <button
        onClick={onDismiss}
        className="text-muted hover:text-muted2 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
