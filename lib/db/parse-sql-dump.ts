import { DbSchema, TableDef, ColumnDef } from "@/types";

type DbDialect = "postgresql" | "mysql" | "sqlite";

function unquote(name: string): string {
  return name.replace(/^[`"']|[`"']$/g, "");
}

function normalizeType(raw: string): string {
  return raw.trim().toUpperCase().split(/[\s(]/)[0];
}

function parseCreateTable(block: string): { name: string; columns: ColumnDef[] } | null {
  const headerMatch = block.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?\w+[`"']?)/i
  );
  if (!headerMatch) return null;

  const name = unquote(headerMatch[1]);
  const bodyMatch = block.match(/\(([\s\S][^;]*)\)/);
  if (!bodyMatch) return null;

  const body = bodyMatch[1];
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

  const columns: ColumnDef[] = [];

  for (const line of lines) {
    // Skip constraint/index lines
    if (/^(PRIMARY\s+KEY|UNIQUE(\s+KEY)?|KEY|INDEX|CONSTRAINT|CHECK)\b/i.test(line)) continue;
    if (/^[)]/i.test(line)) continue;

    // Column line: name type [constraints...]
    const colMatch = line.match(/^([`"']?\w+[`"']?)\s+([A-Za-z]+(?:\([^)]*\))?)/);
    if (!colMatch) continue;

    const colName = unquote(colMatch[1]);
    const colType = normalizeType(colMatch[2]);

    // Skip if colName looks like a keyword
    if (/^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|CHECK|FOREIGN)$/i.test(colName)) continue;

    const isPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(line);
    const nullable = !/\bNOT\s+NULL\b/i.test(line) && !isPrimaryKey;

    // Foreign key
    const fkMatch = line.match(/REFERENCES\s+([`"']?\w+[`"']?)/i);
    const referencesTable = fkMatch ? unquote(fkMatch[1]) : undefined;

    columns.push({
      name: colName,
      type: colType,
      nullable,
      isPrimaryKey,
      isForeignKey: !!referencesTable,
      referencesTable,
    });
  }

  return { name, columns };
}

export function parseSqlDump(content: string, dialect: DbDialect = "postgresql"): DbSchema {
  // Normalize line endings
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Extract CREATE TABLE blocks
  const createTablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?\w+[`"']?\s*\([\s\S][^;]*;/gi;
  const matches = text.match(createTablePattern) ?? [];

  const tables: TableDef[] = [];
  for (const block of matches) {
    const parsed = parseCreateTable(block);
    if (parsed && parsed.columns.length > 0) {
      tables.push({ name: parsed.name, columns: parsed.columns });
    }
  }

  // Estimate rows from INSERT statements
  const insertPattern = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?/gi;
  const insertCounts: Record<string, number> = {};
  let m: RegExpExecArray | null;
  while ((m = insertPattern.exec(text)) !== null) {
    const tname = m[1];
    insertCounts[tname] = (insertCounts[tname] ?? 0) + 1;
  }

  for (const table of tables) {
    if (insertCounts[table.name]) {
      table.rowEstimate = insertCounts[table.name];
    }
  }

  return {
    dialect,
    tables,
    sourceType: "dump",
    connectedAt: new Date(),
  };
}
