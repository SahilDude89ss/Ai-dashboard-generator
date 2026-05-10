"use client";
import { WidgetProps } from "@/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#7c6cfc", "#00e8a2", "#38bdf8", "#fbbf24", "#ff5f7e", "#a78bfa", "#34d399", "#f87171"];

export default function DonutWidget({ widget }: WidgetProps) {
  const { result } = widget;
  const rows = result?.rows ?? [];
  const cols = result?.columns ?? [];

  const labelCol = cols[0] ?? "label";
  const valCol = cols[1] ?? "value";

  let data = rows.map((r) => ({
    name: String(r[labelCol] ?? ""),
    value: Number(r[valCol]) || 0,
  }));

  // Max 8 segments; group rest into "Other"
  if (data.length > 8) {
    const top = data.slice(0, 7);
    const otherVal = data.slice(7).reduce((s, d) => s + d.value, 0);
    data = [...top, { name: "Other", value: otherVal }];
  }

  if (!data.length) return <div className="text-muted text-sm">No data</div>;

  const total = data.reduce((s, d) => s + d.value, 0);
  const largest = data[0];

  return (
    <div className="h-44 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#0e0f1a", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v} (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, ""]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => {
              const pct = total > 0 ? (((entry.payload as { value: number }).value / total) * 100).toFixed(1) : "0";
              return (
                <span className="text-xs text-muted2">
                  {value} <span className="text-muted">{pct}%</span>
                </span>
              );
            }}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute pointer-events-none"
        style={{ top: "50%", left: "40%", transform: "translate(-50%, -50%)" }}
      >
        <p className="text-[10px] text-muted2 text-center leading-tight">{largest?.name}</p>
      </div>
    </div>
  );
}
