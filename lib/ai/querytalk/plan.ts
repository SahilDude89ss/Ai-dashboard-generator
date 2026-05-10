import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { DbSchema, ConversationContext, ClarificationRequest, VizHint } from "@/types";
import { compressSchema } from "@/lib/db/compress";
import { selectRelevantTables } from "@/lib/db/relevance";
import { PlanResultSchema } from "@/lib/schema/types";
import { buildSystemPrompt } from "./prompts";
import { buildContextBlock } from "./context";

export interface PlanResult {
  intent: string;
  thinking: string;
  queries: Array<{ id: string; title: string; sql: string; viz: VizHint }>;
  clarification?: ClarificationRequest;
  explanation?: string;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function planQueries(
  question: string,
  schema: DbSchema,
  context: ConversationContext,
  dialect: string
): Promise<PlanResult> {
  // Filter to relevant tables when schema is large
  const workingSchema =
    schema.tables.length > 20 ? selectRelevantTables(schema, question) : schema;

  const compressedSchema = compressSchema(workingSchema);
  const systemPrompt = buildSystemPrompt(dialect, compressedSchema);
  const contextBlock = buildContextBlock(context);

  const userContent = contextBlock
    ? `${contextBlock}\n\nUser question: ${question}`
    : `User question: ${question}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
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
    throw new Error(`QueryTalk plan returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  const validated = PlanResultSchema.parse(parsed);

  // If clarification requested, return early with empty queries
  if (validated.intent === "clarify" && validated.clarification) {
    return {
      intent: validated.intent,
      thinking: validated.thinking,
      queries: [],
      clarification: validated.clarification,
    };
  }

  // Assign UUIDs to each query if id is missing or blank
  const queries = validated.queries.map((q) => ({
    ...q,
    id: q.id && q.id.trim().length > 0 ? q.id : uuidv4(),
  }));

  return {
    intent: validated.intent,
    thinking: validated.thinking,
    queries,
    explanation: validated.explanation,
  };
}
