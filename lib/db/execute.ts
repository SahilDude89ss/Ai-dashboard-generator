import { DbConnectionConfig, QueryResult } from "@/types";
import { createConnection } from "./connect";

const DANGEROUS_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|REPLACE|LOAD|CALL|EXEC)\b/i;

function stripComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function isSafeQuery(sql: string): boolean {
  const stripped = stripComments(sql);
  return !DANGEROUS_KEYWORDS.test(stripped);
}

export async function executeQuery(
  sql: string,
  config: DbConnectionConfig,
  maxRows = 500
): Promise<QueryResult> {
  if (!isSafeQuery(sql)) {
    throw new Error("Only SELECT statements are allowed.");
  }

  const safeSql = `SELECT * FROM (${sql}) AS __q LIMIT ${Math.min(maxRows, 2000)}`;
  const client = await createConnection(config);
  const startMs = Date.now();

  try {
    const result = await Promise.race([
      client.query(safeSql),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timed out after 30 seconds.")), 30000)
      ),
    ]);

    const executionMs = Date.now() - startMs;
    const rows = result.rows;
    const columns = result.fields?.map((f) => f.name) ?? (rows.length > 0 ? Object.keys(rows[0]) : []);

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionMs,
    };
  } finally {
    await client.close();
  }
}
