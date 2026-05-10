"use client";
import { WidgetProps } from "@/types";
import { formatNumber } from "@/lib/utils/format";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function getFirstNumericValue(rows: Record<string, unknown>[], columns: string[]): number | null {
  if (!rows.length) return null;
  const row = rows[0];
  for (const col of columns) {
    const val = row[col];
    if (typeof val === "number") return val;
    if (typeof val === "string" && !isNaN(parseFloat(val))) return parseFloat(val);
  }
  return null;
}

export default function KpiWidget({ widget }: WidgetProps) {
  const { result, valueFormat } = widget;
  const rows = result?.rows ?? [];
  const columns = result?.columns ?? [];

  const value = getFirstNumericValue(rows, columns);
  const prevValue = rows.length > 1 ? getFirstNumericValue([rows[1]], columns) : null;

  let delta: number | null = null;
  if (value !== null && prevValue !== null && prevValue !== 0) {
    delta = ((value - prevValue) / Math.abs(prevValue)) * 100;
  }

  const sparklineData =
    rows.length > 2
      ? rows.slice(0, 12).map((r) => ({ v: Number(Object.values(r)[1] ?? Object.values(r)[0]) || 0 }))
      : null;

  return (
    <div className="flex flex-col h-full">
      {value !== null ? (
        <>
          <div className="text-3xl font-black tabular-nums text-text mb-1">
            {formatNumber(value, valueFormat)}
          </div>

          {delta !== null && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold mb-3 ${
                delta >= 0 ? "text-a2" : "text-a3"
              }`}
            >
              {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)}% vs last period
            </div>
          )}

          {sparklineData && (
            <div className="mt-auto h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c6cfc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c6cfc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#7c6cfc"
                    strokeWidth={1.5}
                    fill={`url(#spark-${widget.id})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-muted text-sm">No data</div>
      )}
    </div>
  );
}
