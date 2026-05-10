import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DbSchemaSchema } from "@/lib/schema/types";
import { compressSchema } from "@/lib/db/compress";
import { z } from "zod";

const StartersRequestSchema = z.object({
  schema: DbSchemaSchema,
  dialect: z.enum(["postgresql", "mysql", "sqlite"]),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = StartersRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { schema, dialect } = parsed.data;
  const compressedSchema = compressSchema(schema);

  const dialectLabel =
    dialect === "postgresql" ? "PostgreSQL" : dialect === "mysql" ? "MySQL" : "SQLite";

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0,
      system: `You are a data analyst assistant. Given a ${dialectLabel} database schema, generate starter questions a data analyst might ask. Return ONLY a valid JSON array of strings — no markdown, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Schema:\n${compressedSchema}\n\nGenerate 6 short, diverse analytical questions a data analyst might ask about this database. Return JSON array of strings.`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    let starters: string[];
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      starters = parsed.filter((s): s is string => typeof s === "string");
    } catch {
      starters = [];
    }

    return NextResponse.json({ starters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate starters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
