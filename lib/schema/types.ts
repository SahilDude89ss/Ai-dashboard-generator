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

export const WidgetTypeSchema = z.enum([
  "kpi",
  "timeseries",
  "bar",
  "bar_horizontal",
  "donut",
  "pie",
  "table",
  "number_trend",
]);

export const WidgetSpecSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  type: WidgetTypeSchema,
  title: z.string().max(60),
  description: z.string().optional(),
  sql: z.string().min(10),
  gridSpan: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  gridRow: z.number().optional(),
  columns: z.array(z.string()).optional(),
  valueFormat: z.enum(["currency", "percent", "number", "duration"]).optional(),
  colorScheme: z.enum(["primary", "success", "warning", "danger"]).optional(),
});

export const QueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.unknown())),
  rowCount: z.number(),
  executionMs: z.number(),
});
