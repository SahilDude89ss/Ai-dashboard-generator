export function formatNumber(
  value: number,
  format?: "currency" | "percent" | "number" | "duration"
): string {
  if (value === null || value === undefined || isNaN(value)) return "—";

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "duration":
      if (value < 60) return `${Math.round(value)}s`;
      if (value < 3600) return `${Math.round(value / 60)}m`;
      return `${(value / 3600).toFixed(1)}h`;
    case "number":
    default:
      if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function formatDelta(current: number, previous: number): string {
  if (!previous || previous === 0) return "";
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}
