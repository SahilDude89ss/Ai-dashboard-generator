import Anthropic from "@anthropic-ai/sdk";
import { DbSchema, DbDialect, WidgetSpec } from "@/types";
import { WidgetSpecSchema } from "@/lib/schema/types";
import { buildSystemPrompt, buildUserMessage } from "./prompts";

const client = new Anthropic();

export type GenerationEvent =
  | { type: "log"; message: string; level: "info" | "success" | "warning" | "error" }
  | { type: "widget"; widget: WidgetSpec }
  | { type: "done"; totalWidgets: number }
  | { type: "error"; message: string };

function extractJsonArray(text: string): string {
  // Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // Try to find first [...] block
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function parseWidgets(text: string): WidgetSpec[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    const extracted = extractJsonArray(text);
    try {
      parsed = JSON.parse(extracted);
    } catch {
      throw new Error("Could not parse AI response as JSON");
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not a JSON array");
  }

  const widgets: WidgetSpec[] = [];
  const seenIds = new Set<string>();

  for (const item of parsed) {
    const result = WidgetSpecSchema.safeParse(item);
    if (!result.success) {
      console.warn("Widget validation failed:", result.error.issues);
      continue;
    }

    let id = result.data.id;
    if (seenIds.has(id)) {
      id = `${id}_${seenIds.size}`;
    }
    seenIds.add(id);

    widgets.push({ ...result.data, id });
  }

  return widgets;
}

export async function* generateWidgets(
  schema: DbSchema,
  prompt: string,
  dialect: DbDialect,
  widgetCount = 7
): AsyncGenerator<GenerationEvent> {
  const tableCount = schema.tables.length;
  const colCount = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);

  yield { type: "log", message: `🔍 Analyzing schema — ${tableCount} tables, ${colCount} columns`, level: "info" };
  yield { type: "log", message: `✦ Sending request to Claude (${dialect} dialect)…`, level: "info" };

  const systemPrompt = buildSystemPrompt(dialect);
  const userMessage = buildUserMessage(schema, prompt, widgetCount);

  let responseText: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type from Claude");
    responseText = content.text;
  } catch (err) {
    yield { type: "error", message: `Claude API error: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  yield { type: "log", message: `📊 Received response — parsing widget specifications…`, level: "info" };

  let widgets: WidgetSpec[];
  try {
    widgets = parseWidgets(responseText);
  } catch {
    yield { type: "log", message: "AI returned an unexpected response. Retrying once…", level: "warning" };

    // Retry with explicit instruction
    try {
      const retryMessage = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: responseText },
          { role: "user", content: "Your previous response was not valid JSON. Return ONLY the JSON array, no other text." },
        ],
      });

      const retryContent = retryMessage.content[0];
      if (retryContent.type !== "text") throw new Error("Unexpected response type");
      widgets = parseWidgets(retryContent.text);
    } catch (err) {
      yield { type: "error", message: `Dashboard generation failed. Try rephrasing your request.` };
      return;
    }
  }

  if (widgets.length === 0) {
    yield { type: "error", message: "No valid widgets could be generated. Try rephrasing your request." };
    return;
  }

  for (const widget of widgets) {
    yield { type: "log", message: `⚡ Validating SQL for: ${widget.title}`, level: "info" };
    yield { type: "widget", widget };
  }

  yield { type: "log", message: `✅ ${widgets.length} widgets ready — rendering dashboard`, level: "success" };
  yield { type: "done", totalWidgets: widgets.length };
}
