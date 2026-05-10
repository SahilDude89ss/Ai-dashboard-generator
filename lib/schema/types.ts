import { z } from "zod";

export const DbDialectSchema = z.enum(["postgresql", "mysql", "sqlite"]);

export const DbConnectionConfigSchema = z.object({
  dialect: DbDialectSchema,
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1),
  user: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().optional(),
});

export const ColumnDefSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  isPrimaryKey: z.boolean(),
  isForeignKey: z.boolean(),
  referencesTable: z.string().optional(),
  referencesColumn: z.string().optional(),
});

export const TableDefSchema = z.object({
  name: z.string(),
  columns: z.array(ColumnDefSchema),
  rowEstimate: z.number().optional(),
});

export const DbSchemaSchema = z.object({
  dialect: DbDialectSchema,
  tables: z.array(TableDefSchema),
  sourceType: z.enum(["live", "dump"]),
  connectedAt: z.coerce.date(),
});

export const QueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.unknown())),
  rowCount: z.number(),
  executionMs: z.number(),
  truncated: z.boolean().default(false),
});

export const WidgetTypeSchema = z.enum([
  "kpi",
  "timeseries",
  "bar",
  "bar_horizontal",
  "donut",
  "table",
]);

export const ValueFormatSchema = z.enum(["currency", "percent", "number", "duration"]);
export const ColorSchemeSchema = z.enum(["primary", "success", "warning", "danger"]);

export const WidgetSpecSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  type: WidgetTypeSchema,
  title: z.string().max(60),
  description: z.string().optional(),
  sql: z.string().min(10),
  gridSpan: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  columns: z.array(z.string()).optional(),
  valueFormat: ValueFormatSchema.optional(),
  colorScheme: ColorSchemeSchema.optional(),
});

// QueryTalk schemas
export const VizTypeSchema = z.enum(["table", "number", "line", "bar", "bar_h", "donut"]);

export const VizHintSchema = z.object({
  type: VizTypeSchema,
  x: z.string().optional(),
  y: z.string().optional(),
  label: z.string().optional(),
  value: z.string().optional(),
  horizontal: z.boolean().optional(),
});

export const PlanResultSchema = z.object({
  intent: z.enum(["query", "clarify", "explain"]),
  thinking: z.string(),
  queries: z.array(z.object({
    id: z.string(),
    sql: z.string(),
    title: z.string(),
    viz: VizHintSchema,
  })).default([]),
  clarification: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    context: z.string(),
  }).optional(),
  explanation: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  userMessage: z.string().min(1).max(2000),
  context: z.object({
    recentTurns: z.array(z.any()),
    activeFilters: z.array(z.any()),
    lastQuery: z.any().nullable(),
    clarificationCount: z.number(),
    usesSonnet: z.boolean(),
  }),
  schema: DbSchemaSchema,
  connection: DbConnectionConfigSchema,
  dialect: DbDialectSchema,
});
