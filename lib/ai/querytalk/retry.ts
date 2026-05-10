import Anthropic from "@anthropic-ai/sdk";
import { DbSchema, VizHint } from "@/types";
import { VizHintSchema } from "@/lib/schema/types";
import { buildRetrySystemPrompt } from "./prompts";
import { compressSchema } from "@/lib/db/compress";

export interface RetryResult {
  sql: string;
  viz: VizHint;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function retrySqlError(
  originalSql: string,
  errorMessage: string,
  title: string,
  schema: DbSchema,
  dialect: string
): Promise<RetryResult> {
  const compressedSchema = compressSchema(schema);
  const systemPrompt = buildRetrySystemPrompt(dialect);

  const userContent = `Schema:
${compressedSchema}

You generated this SQL for "${title}":
${originalSql}

Error: ${errorMessage}

Fix ONLY the SQL syntax/semantic error. Return JSON: {"sql": "<corrected SELECT ...>", "viz": {"type": "<table|number|line|bar|bar_h|donut>", "x": "...", "y": "...", "label": "...", "value": "...", "horizontal": false}}

Keep the same viz type as implied by the original query. Return ONLY valid JSON, no markdown.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Retry returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.sql !== "string" || !obj.sql.trim()) {
    throw new Error("Retry response missing sql field");
  }

  const viz = VizHintSchema.parse(obj.viz ?? { type: "table" });

  return { sql: obj.sql, viz };
}
