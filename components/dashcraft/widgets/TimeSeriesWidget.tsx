"use client";
import { WidgetProps } from "@/types";
import { formatNumber } from "@/lib/utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

function formatXLabel(val: string): string {
  try {
    const d = parseISO(val);
    return format(d, "MMM yy");
  } catch {
    return String(val).slice(0, 7);
  }
}

export default function TimeSeriesWidget({ widget }: WidgetProps) {
  const { result } = widget;
  const rows = result?.rows ?? [];
  const cols = result?.columns ?? [];

  const dateCol = cols[0] ?? "date";
  const valCol = cols[1] ?? "value";

  const data = rows.map((r) => ({
    date: String(r[dateCol] ?? ""),
    value: Number(r[valCol]) || 0,
  }));

  if (!data.length) return <div className="text-muted text-sm">No data</div>;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`ts-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c6cfc" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7c6cfc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXLabel}
            tick={{ fill: "#5d5d7d", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatNumber(v, "number")}
            tick={{ fill: "#5d5d7d", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: "#0e0f1a", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#8e8eae" }}
            itemStyle={{ color: "#eeeeff" }}
            labelFormatter={formatXLabel}
            formatter={(v: number) => [formatNumber(v, widget.valueFormat), valCol]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#7c6cfc"
            strokeWidth={2}
            fill={`url(#ts-${widget.id})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
