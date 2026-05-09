import { NextRequest, NextResponse } from "next/server";
import { DbConnectionConfigSchema } from "@/lib/schema/types";
import { executeQuery } from "@/lib/db/execute";
import { z } from "zod";

const QueryRequestSchema = z.object({
  sql: z.string().min(1),
  connection: DbConnectionConfigSchema,
  maxRows: z.number().int().min(1).max(2000).default(500),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = QueryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  const { sql, connection, maxRows } = parsed.data;

  try {
    const result = await executeQuery(sql, connection, maxRows);
    const truncated = result.rowCount >= maxRows;
    return NextResponse.json({ ...result, truncated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    if (message.includes("timed out")) {
      return NextResponse.json({ error: "Query timed out after 30 seconds." }, { status: 504 });
    }
    if (message.includes("Only SELECT")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
