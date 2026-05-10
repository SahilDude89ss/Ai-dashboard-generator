"use client";

import { QueryResult, VizHint } from "@/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = ["#7c6cfc", "#00e8a2", "#ff5f7e", "#fbbf24", "#38bdf8"];

const tooltipStyle = {
  contentStyle: {
    background: "#141526",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    fontSize: 12,
  },
};

interface Props {
  result: QueryResult;
  viz: VizHint;
}

export function ChartResult({ result, viz }: Props) {
  const data = result.rows as Record<string, unknown>[];

  if (viz.type === "line" && viz.x && viz.y) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={viz.x}
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey={viz.y}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (viz.type === "bar" && viz.x && viz.y) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={viz.x}
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey={viz.y} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (viz.type === "bar_h" && viz.x && viz.y) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <YAxis
            dataKey={viz.x}
            type="category"
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <XAxis
            type="number"
            tick={{ fill: "#8e8eae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey={viz.y} fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (viz.type === "donut" && viz.label && viz.value) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            nameKey={viz.label}
            dataKey={viz.value}
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
