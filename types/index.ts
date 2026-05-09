export type DbDialect = "postgresql" | "mysql" | "sqlite";

export interface DbConnectionConfig {
  dialect: DbDialect;
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
  rowEstimate?: number;
}

export interface DbSchema {
  dialect: DbDialect;
  tables: TableDef[];
  sourceType: "live" | "dump";
  connectedAt: Date;
}

export type WidgetType =
  | "kpi"
  | "timeseries"
  | "bar"
  | "bar_horizontal"
  | "donut"
  | "pie"
  | "table"
  | "number_trend";

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  sql: string;
  gridSpan: 1 | 2 | 3 | 4;
  gridRow?: number;
  columns?: string[];
  valueFormat?: "currency" | "percent" | "number" | "duration";
  colorScheme?: "primary" | "success" | "warning" | "danger";
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
}

export interface Widget extends WidgetSpec {
  status: "idle" | "loading" | "success" | "error";
  result?: QueryResult;
  error?: string;
  lastExecutedAt?: Date;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  schema: DbSchema;
  connection?: DbConnectionConfig;
  widgets: Widget[];
  prompt: string;
  dialect: DbDialect;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntry {
  id: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

export interface WidgetProps {
  widget: Widget;
  onSqlChange: (newSql: string) => void;
  onRefresh: () => void;
}
