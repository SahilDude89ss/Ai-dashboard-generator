import { NextRequest } from "next/server";
import { ChatRequestSchema } from "@/lib/schema/types";
import { planQueries } from "@/lib/ai/querytalk/plan";
import { retrySqlError } from "@/lib/ai/querytalk/retry";
import { executeQuery } from "@/lib/db/execute";
import { ConversationContext, QueryResult, VizHint } from "@/types";

type NdjsonEvent =
  | { type: "status"; status: string }
  | { type: "thinking"; text: string }
  | { type: "clarification"; question: string; options?: string[]; context: string }
  | { type: "query_start"; queryId: string; title: string; sql: string }
  | { type: "query_result"; queryId: string; result: QueryResult; viz: VizHint }
  | { type: "query_error"; queryId: string; error: string; retrying: boolean }
  | { type: "query_retry_result"; queryId: string; result: QueryResult; sql: string; viz: VizHint }
  | { type: "done"; durationMs: number }
  | { type: "error"; message: string };

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "Invalid JSON body" }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ type: "error", message: "Invalid request", details: parsed.error.issues }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const { userMessage, context, schema, connection, dialect } = parsed.data;
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: NdjsonEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      try {
        // Phase 1: Planning
        send({ type: "status", status: "planning" });

        // Normalize context: ensure lastQuery is null (not undefined) to satisfy ConversationContext
        const normalizedContext: ConversationContext = {
          ...context,
          lastQuery: context.lastQuery ?? null,
        };

        const plan = await planQueries(userMessage, schema, normalizedContext, dialect);

        send({ type: "thinking", text: plan.thinking });

        // If clarification needed, stream clarification and end
        if (plan.clarification) {
          send({
            type: "clarification",
            question: plan.clarification.question,
            options: plan.clarification.options,
            context: plan.clarification.context,
          });
          send({ type: "done", durationMs: Date.now() - startTime });
          return;
        }

        // Phase 2: Execute all queries in parallel
        // Stream all query_start events first
        for (const query of plan.queries) {
          send({ type: "query_start", queryId: query.id, title: query.title, sql: query.sql });
        }

        // Execute all queries in parallel
        const results = await Promise.allSettled(
          plan.queries.map(async (query) => {
            const result = await executeQuery(query.sql, connection);
            return { query, result };
          })
        );

        // Stream results in order
        for (let i = 0; i < results.length; i++) {
          const settled = results[i];
          const query = plan.queries[i];

          if (settled.status === "fulfilled") {
            const { result } = settled.value;
            const queryResult: QueryResult = {
              ...result,
              truncated: result.rowCount >= 500,
            };
            send({ type: "query_result", queryId: query.id, result: queryResult, viz: query.viz });
          } else {
            const errorMsg = settled.reason instanceof Error
              ? settled.reason.message
              : String(settled.reason);

            send({ type: "query_error", queryId: query.id, error: errorMsg, retrying: true });

            // Attempt retry
            try {
              const retryResult = await retrySqlError(
                query.sql,
                errorMsg,
                query.title,
                schema,
                dialect
              );

              const retryQueryResult = await executeQuery(retryResult.sql, connection);
              const retryFinalResult: QueryResult = {
                ...retryQueryResult,
                truncated: retryQueryResult.rowCount >= 500,
              };

              send({
                type: "query_retry_result",
                queryId: query.id,
                result: retryFinalResult,
                sql: retryResult.sql,
                viz: retryResult.viz,
              });
            } catch (retryErr) {
              const retryErrMsg = retryErr instanceof Error
                ? retryErr.message
                : String(retryErr);
              send({ type: "query_error", queryId: query.id, error: retryErrMsg, retrying: false });
            }
          }
        }

        send({ type: "done", durationMs: Date.now() - startTime });
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        send({ type: "error", message });
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
