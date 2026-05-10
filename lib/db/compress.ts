import { DbSchema, TableDef, ColumnDef } from "@/types";

const TYPE_MAP: Record<string, string> = {
  "CHARACTER VARYING": "VARCHAR",
  "CHARACTER": "CHAR",
  "TIMESTAMP WITHOUT TIME ZONE": "TS",
  "TIMESTAMP WITH TIME ZONE": "TS",
  "TIMESTAMP": "TS",
  "INTEGER": "INT",
  "BIGINT": "INT",
  "SMALLINT": "INT",
  "NUMERIC": "DECIMAL",
  "DOUBLE PRECISION": "FLOAT",
  "BOOLEAN": "BOOL",
  "TEXT": "TEXT",
  "VARCHAR": "VARCHAR",
  "DECIMAL": "DECIMAL",
  "FLOAT": "FLOAT",
  "INT": "INT",
  "BOOL": "BOOL",
  "DATE": "DATE",
  "JSON": "JSON",
  "JSONB": "JSON",
};

function normalizeType(raw: string): string {
  const upper = raw.toUpperCase().split("(")[0].trim();
  return TYPE_MAP[upper] ?? upper;
}

function formatRowEstimate(n: number): string {
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M rows`;
  if (n >= 1_000) return `~${Math.round(n / 1000)}K rows`;
  return `~${n} rows`;
}

function compressColumn(col: ColumnDef): string {
  const type = normalizeType(col.type);
  let annotation = "";
  if (col.isPrimaryKey) annotation += " PK";
  if (col.isForeignKey && col.referencesTable) {
    annotation += `→${col.referencesTable}`;
  }
  return `${col.name} ${type}${annotation}`;
}

function compressTable(table: TableDef): string {
  const cols = table.columns.map(compressColumn).join(", ");
  const rowPart = table.rowEstimate != null ? ` [${formatRowEstimate(table.rowEstimate)}]` : "";
  return `${table.name}(${cols})${rowPart}`;
}

export function compressSchema(schema: DbSchema): string {
  return schema.tables.map(compressTable).join("\n");
}
