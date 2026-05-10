"use client";
import { WidgetProps } from "@/types";
import { formatNumber } from "@/lib/utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function BarWidget({ widget }: WidgetProps) {
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

  const rotateLabels = data.length > 6;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: rotateLabels ? 24 : 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5d5d7d", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={rotateLabels ? -45 : 0}
            textAnchor={rotateLabels ? "end" : "middle"}
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
            formatter={(v: number) => [formatNumber(v, valueFormat), valCol]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#7c6cfc" : `rgba(124,108,252,${0.7 - i * 0.06})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
