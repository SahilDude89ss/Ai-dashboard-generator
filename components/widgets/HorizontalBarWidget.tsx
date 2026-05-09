"use client";
import { WidgetProps } from "@/types";
import { formatNumber } from "@/lib/utils/format";

export default function HorizontalBarWidget({ widget }: WidgetProps) {
  const { result, valueFormat } = widget;
  const rows = result?.rows ?? [];
  const cols = result?.columns ?? [];

  const labelCol = cols[0] ?? "label";
  const valCol = cols[1] ?? "value";

  const data = rows.map((r) => ({
    label: String(r[labelCol] ?? ""),
    value: Number(r[valCol]) || 0,
  }));

  if (!data.length) return <div className="text-muted text-sm">No data</div>;

  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span
            className="text-xs text-muted2 truncate shrink-0"
            style={{ width: 140, maxWidth: 140 }}
            title={item.label}
          >
            {item.label}
          </span>
          <div className="flex-1 h-2 bg-s3 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-text tabular-nums shrink-0 w-20 text-right">
            {formatNumber(item.value, valueFormat)}
          </span>
        </div>
      ))}
    </div>
  );
}
