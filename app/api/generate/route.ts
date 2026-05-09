import { NextRequest } from "next/server";
import { DbSchemaSchema } from "@/lib/schema/types";
import { z } from "zod";
import { generateWidgets } from "@/lib/ai/generate-widgets";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const GenerateRequestSchema = z.object({
  schema: DbSchemaSchema,
  prompt: z.string().min(1).max(500),
  dialect: z.enum(["postgresql", "mysql", "sqlite"]),
  widgetCount: z.number().int().min(4).max(12).default(7),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ type: "error", message: "Rate limit exceeded. Please wait a minute." }) + "\n",
      { status: 429, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "Invalid JSON body" }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ type: "error", message: "Invalid request", details: parsed.error.issues }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const { schema, prompt, dialect, widgetCount } = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of generateWidgets(schema, prompt, dialect, widgetCount)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        const errorEvent = {
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error during generation",
        };
        controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
