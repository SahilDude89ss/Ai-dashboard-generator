import { DbDialect } from "@/types";

const dialectRules: Record<DbDialect, string> = {
  postgresql: `- Use DATE_TRUNC('month', timestamp_col) for time bucketing
- Use NOW() - INTERVAL '30 days' for date filtering
- Use ROUND(value::numeric, 2) for rounding
- Use NULLIF(denominator, 0) to avoid division by zero
- Use EXTRACT(EPOCH FROM duration_col) for durations in seconds
- String concatenation: ||
- Boolean: TRUE/FALSE`,

  mysql: `- Use DATE_FORMAT(timestamp_col, '%Y-%m') for time bucketing
- Use NOW() - INTERVAL 30 DAY for date filtering
- Use ROUND(value, 2) for rounding
- Use IFNULL(value, 0) for null handling
- String concatenation: CONCAT()
- Boolean: 1/0 or TRUE/FALSE`,

  sqlite: `- Use strftime('%Y-%m', timestamp_col) for time bucketing
- Use datetime('now', '-30 days') for date filtering
- Use ROUND(value, 2) for rounding
- Use COALESCE(value, 0) for null handling
- No native boolean type — use 1/0
- No INTERVAL syntax — use datetime modifiers`,
};

export function buildSystemPrompt(dialect: DbDialect): string {
  return `You are an expert SQL dashboard architect with deep knowledge of ${dialect} SQL syntax.
Your job is to analyze a database schema and a user's plain-English request, then output a JSON array of dashboard widget specifications. Each widget must include a complete, production-ready SQL query.

## Output Format
Respond ONLY with a valid JSON array. No markdown fences, no explanation, no preamble.
Each element in the array must be an object with these exact fields:
- "id": unique snake_case identifier (e.g., "monthly_revenue", "top_customers")
- "type": one of: "kpi", "timeseries", "bar", "bar_horizontal", "donut", "table"
- "title": display title, maximum 5 words, title case
- "description": one sentence explaining what this widget shows
- "sql": complete, valid ${dialect} SQL query (see SQL rules below)
- "gridSpan": integer 1–4, representing column span in a 4-column grid
- "columns": array of column header strings (ONLY for type "table")
- "valueFormat": one of "currency", "percent", "number", "duration" (ONLY for type "kpi")
- "colorScheme": one of "primary", "success", "warning", "danger"

## Widget Type Rules
- **kpi**: Single-row aggregate query. SELECT one value with a meaningful alias. Example: SELECT SUM(total) AS value FROM orders WHERE ...
- **timeseries**: GROUP BY time bucket (month/week/day). Must return exactly 2 columns: a date/timestamp and a numeric value.
- **bar**: GROUP BY category. Returns label + value columns. ORDER BY value DESC LIMIT 10.
- **bar_horizontal**: Same as bar but used for ranked lists (top products, top customers, etc.)
- **donut**: GROUP BY categorical column. Returns label + count/sum. Max 8 segments.
- **table**: Multi-column SELECT. Must include LIMIT 20. Return 3–6 meaningful columns.

## SQL Rules for ${dialect}
${dialectRules[dialect]}

## Layout Rules
- 4 KPI widgets per row (each gridSpan: 1)
- Time series and tables should use gridSpan: 2 or 4
- Bar/donut charts use gridSpan: 1 or 2
- Aim for 6–8 widgets total
- Vary widget types — do not generate 6 KPIs

## Correctness Rules
- Only use tables and columns that exist in the provided schema
- Use exact table and column names (case-sensitive)
- All JOINs must reference columns that actually exist
- Use table aliases for clarity
- Add WHERE clauses to filter for recent data (last 30 or 365 days) where relevant
- Aggregate queries must not return multiple rows unintentionally
- Never use SELECT * — always name columns explicitly`;
}

export function buildUserMessage(schema: import("@/types").DbSchema, prompt: string, widgetCount = 7): string {
  const schemaDescription = schema.tables
    .map((t) => {
      const cols = t.columns
        .map((c) => {
          let desc = `  - ${c.name}: ${c.type}`;
          if (c.isPrimaryKey) desc += " [PK]";
          if (c.isForeignKey) desc += ` [FK→${c.referencesTable ?? "?"}]`;
          if (!c.nullable) desc += " NOT NULL";
          return desc;
        })
        .join("\n");
      const rowInfo = t.rowEstimate ? ` (~${t.rowEstimate.toLocaleString()} rows)` : "";
      return `Table: ${t.name}${rowInfo}\n${cols}`;
    })
    .join("\n\n");

  return `## Database Schema
${schemaDescription}

## User Request
${prompt}

## Instructions
Generate ${widgetCount} dashboard widgets. Return only the JSON array.`;
}
