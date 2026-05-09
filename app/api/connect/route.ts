import { NextRequest, NextResponse } from "next/server";
import { DbConnectionConfigSchema } from "@/lib/schema/types";
import { introspectDatabase } from "@/lib/db/introspect";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DbConnectionConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection config", details: parsed.error.issues }, { status: 400 });
  }

  const config = parsed.data;
  const startMs = Date.now();

  try {
    const schema = await Promise.race([
      introspectDatabase(config),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out after 10 seconds.")), 10000)
      ),
    ]);

    const latencyMs = Date.now() - startMs;
    return NextResponse.json({ success: true, schema, latencyMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
