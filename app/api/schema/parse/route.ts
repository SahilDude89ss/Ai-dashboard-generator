import { NextRequest, NextResponse } from "next/server";
import { parseSqlDump } from "@/lib/db/parse-sql-dump";
import { z } from "zod";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 413 });
  }

  const dialect = (formData.get("dialect") ?? "postgresql") as "postgresql" | "mysql" | "sqlite";

  try {
    const content = await file.text();
    const schema = parseSqlDump(content, dialect);

    if (schema.tables.length === 0) {
      return NextResponse.json(
        { error: "No CREATE TABLE statements found in this file." },
        { status: 422 }
      );
    }

    return NextResponse.json({ schema });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not parse this file. Ensure it's a valid SQL dump." },
      { status: 422 }
    );
  }
}
