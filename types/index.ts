// ── Database ──────────────────────────────────────────────────────────────────

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
  referencesColumn?: string;
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

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
  truncated: boolean;
}

// ── Dashcraft ─────────────────────────────────────────────────────────────────

export type WidgetType =
  | "kpi"
  | "timeseries"
  | "bar"
  | "bar_horizontal"
  | "donut"
  | "table";

export type ValueFormat = "currency" | "percent" | "number" | "duration";
export type ColorScheme = "primary" | "success" | "warning" | "danger";

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  sql: string;
  gridSpan: 1 | 2 | 3 | 4;
  columns?: string[];
  valueFormat?: ValueFormat;
  colorScheme?: ColorScheme;
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
  onSqlChange: (sql: string) => void;
  onRefresh: () => void;
}

// ── QueryTalk ─────────────────────────────────────────────────────────────────

export type VizType = "table" | "number" | "line" | "bar" | "bar_h" | "donut";

export interface VizHint {
  type: VizType;
  x?: string;
  y?: string;
  label?: string;
  value?: string;
  horizontal?: boolean;
}

export interface ExecutedQuery {
  id: string;
  sql: string;
  title: string;
  viz: VizHint;
  status: "pending" | "running" | "success" | "error";
  result?: QueryResult;
  error?: string;
  executionMs?: number;
  isEdited: boolean;
  editedSql?: string;
}

export interface ClarificationRequest {
  question: string;
  options?: string[];
  context: string;
}

export interface UserTurn {
  id: string;
  role: "user";
  content: string;
  timestamp: Date;
}

export interface AssistantTurn {
  id: string;
  role: "assistant";
  status: "planning" | "executing" | "complete" | "error" | "clarifying";
  thinking?: string;
  queries: ExecutedQuery[];
  clarification?: ClarificationRequest;
  explanation?: string;
  timestamp: Date;
  durationMs?: number;
}

export type Turn = UserTurn | AssistantTurn;

export interface SummarizedTurn {
  turnId: string;
  userQuestion: string;
  intent: string;
  resultSummary: string;
  filtersApplied: string[];
}

export interface ActiveFilter {
  dimension: string;
  value: string;
  sqlFragment: string;
  establishedAtTurn: string;
}

export interface LastQueryContext {
  sql: string;
  title: string;
  whereClause: string;
  resultShape: {
    columns: string[];
    rowCount: number;
    numericColumns: string[];
    dateColumns: string[];
  };
}

export interface ConversationContext {
  recentTurns: SummarizedTurn[];
  activeFilters: ActiveFilter[];
  lastQuery: LastQueryContext | null;
  clarificationCount: number;
  usesSonnet: boolean;
}

export interface Session {
  id: string;
  title: string;
  connection: DbConnectionConfig;
  schema: DbSchema;
  turns: Turn[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}
