"use client";
import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useQueryTalkStore } from "@/store/querytalk";
import type { AssistantTurn, ExecutedQuery, Session, UserTurn } from "@/types";

// ── Types for streaming events ────────────────────────────────────────────────

type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "query_start"; queryId: string; sql: string; title: string }
  | { type: "query_result"; queryId: string; result: import("@/types").QueryResult; viz: import("@/types").VizHint }
  | { type: "query_error"; queryId: string; error: string }
  | { type: "explanation"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

// ── Schema sidebar ─────────────────────────────────────────────────────────────

function SchemaSidebar({ session }: { session: Session }) {
  return (
    <aside className="w-60 flex-shrink-0 bg-s1 border-r border-DEFAULT overflow-y-auto">
      <div className="px-4 py-3 border-b border-DEFAULT">
        <p className="text-xs font-semibold text-muted2 uppercase tracking-wider">Schema</p>
        <p className="text-xs text-muted mt-0.5">{session.schema.tables.length} tables</p>
      </div>
      <div className="py-2">
        {session.schema.tables.map((table) => (
          <div key={table.name} className="group">
            <div className="flex items-center gap-2 px-4 py-1.5 hover:bg-s2 transition-colors cursor-default">
              <Database size={12} className="text-muted shrink-0" />
              <span className="text-xs text-text font-mono truncate">{table.name}</span>
              {table.rowEstimate !== undefined && (
                <span className="ml-auto text-[10px] text-muted shrink-0">
                  {table.rowEstimate.toLocaleString()}
                </span>
              )}
            </div>
            <div className="hidden group-hover:block px-4 pb-1">
              {table.columns.slice(0, 6).map((col) => (
                <div key={col.name} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[10px] text-muted2 font-mono truncate">{col.name}</span>
                  <span className="text-[10px] text-muted truncate">{col.type}</span>
                  {col.isPrimaryKey && (
                    <span className="text-[9px] text-a4 ml-auto">PK</span>
                  )}
                </div>
              ))}
              {table.columns.length > 6 && (
                <p className="text-[10px] text-muted mt-0.5">
                  +{table.columns.length - 6} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── User turn bubble ───────────────────────────────────────────────────────────

function UserBubble({ turn }: { turn: UserTurn }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] bg-s3 border border-DEFAULT rounded-card rounded-br-sm px-4 py-3">
        <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{turn.content}</p>
        <p className="text-[10px] text-muted mt-1.5 text-right">
          {turn.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── SQL query card ─────────────────────────────────────────────────────────────

function QueryCard({ query }: { query: ExecutedQuery }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-s2 border border-DEFAULT rounded-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-DEFAULT">
        <div className="flex items-center gap-2">
          {query.status === "running" ? (
            <Loader2 size={12} className="text-accent animate-spin" />
          ) : query.status === "success" ? (
            <span className="w-2 h-2 rounded-full bg-a2" />
          ) : query.status === "error" ? (
            <span className="w-2 h-2 rounded-full bg-a3" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-muted" />
          )}
          <span className="text-xs font-semibold text-text">{query.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {query.executionMs !== undefined && (
            <span className="text-[10px] text-muted">{query.executionMs}ms</span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] text-muted2 hover:text-text transition-colors"
          >
            {expanded ? "Hide SQL" : "View SQL"}
          </button>
        </div>
      </div>

      {expanded && (
        <pre className="px-4 py-3 text-xs font-mono text-muted2 overflow-x-auto bg-s1 border-b border-DEFAULT whitespace-pre-wrap">
          {query.sql}
        </pre>
      )}

      {query.status === "success" && query.result && (
        <div className="px-4 py-2.5">
          <p className="text-xs text-muted2">
            {query.result.rowCount.toLocaleString()} row{query.result.rowCount !== 1 ? "s" : ""}
            {query.result.truncated && " (truncated)"}
          </p>
          {/* Simple table preview — first 5 rows */}
          {query.result.rows.length > 0 && (
            <div className="mt-2 overflow-x-auto">
              <table className="text-[10px] w-full border-collapse">
                <thead>
                  <tr>
                    {query.result.columns.map((col) => (
                      <th
                        key={col}
                        className="text-left text-muted px-2 py-1 border-b border-DEFAULT font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.result.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-s3 transition-colors">
                      {query.result!.columns.map((col) => (
                        <td key={col} className="px-2 py-1 text-muted2 border-b border-DEFAULT">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {query.result.rows.length > 5 && (
                <p className="text-[10px] text-muted mt-1 px-2">
                  …and {query.result.rows.length - 5} more rows
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {query.status === "error" && query.error && (
        <div className="px-4 py-2.5">
          <p className="text-xs text-a3">{query.error}</p>
        </div>
      )}
    </div>
  );
}

// ── Assistant turn ─────────────────────────────────────────────────────────────

function AssistantBubble({ turn }: { turn: AssistantTurn }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3">
        {/* Status / thinking */}
        {(turn.status === "planning" || turn.status === "executing") && (
          <div className="flex items-center gap-2 text-xs text-muted2">
            <Loader2 size={12} className="text-accent animate-spin" />
            {turn.status === "planning"
              ? "Analyzing your question…"
              : turn.thinking
              ? turn.thinking
              : "Running queries…"}
          </div>
        )}

        {/* Queries */}
        {turn.queries.length > 0 && (
          <div className="space-y-2">
            {turn.queries.map((q) => (
              <QueryCard key={q.id} query={q} />
            ))}
          </div>
        )}

        {/* Explanation */}
        {turn.explanation && (
          <div className="px-4 py-3 bg-s1 border border-DEFAULT rounded-card">
            <p className="text-sm text-text leading-relaxed">{turn.explanation}</p>
          </div>
        )}

        <p className="text-[10px] text-muted">
          {turn.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {turn.durationMs !== undefined && ` · ${(turn.durationMs / 1000).toFixed(1)}s`}
        </p>
      </div>
    </div>
  );
}

// ── Starter chips ─────────────────────────────────────────────────────────────

function StarterChips({
  onSelect,
  sessionId,
  session,
}: {
  onSelect: (q: string) => void;
  sessionId: string;
  session: Session;
}) {
  const [starters, setStarters] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/querytalk/starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema: session.schema, dialect: session.connection.dialect }),
    })
      .then((r) => r.json())
      .then((data: { questions?: string[] }) => {
        if (!cancelled && Array.isArray(data.questions)) {
          setStarters(data.questions.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session.schema, session.connection.dialect]);

  if (starters.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-8 animate-fadeUp">
      <p className="text-xs text-muted2">Try asking…</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {starters.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-s1 border border-DEFAULT rounded-full text-xs text-muted2 hover:border-accent/40 hover:text-text transition-colors"
          >
            {q}
            <ChevronRight size={10} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main chat page ─────────────────────────────────────────────────────────────

export default function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const store = useQueryTalkStore();

  const session = store.sessions.find((s) => s.id === sessionId) ?? null;

  const [schemaOpen, setSchemaOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if session not found
  useEffect(() => {
    if (!session) {
      router.replace("/querytalk/connect");
    }
  }, [session, router]);

  // Set active session in store
  useEffect(() => {
    if (session && store.activeSessionId !== sessionId) {
      store.loadSession(sessionId);
    }
  }, [sessionId, session, store]);

  // Scroll to bottom when turns change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.turns]);

  // ── Streaming send ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || !session || sending) return;
      setSending(true);
      setInput("");

      store.addUserTurn(sessionId, question);
      const assistantTurnId = uuidv4();
      store.addAssistantTurn(sessionId, assistantTurnId, "planning");

      try {
        const resp = await fetch("/api/querytalk/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            sessionId,
            connection: session.connection,
            schema: session.schema,
            context: session.context,
            dialect: session.connection.dialect,
          }),
        });

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line) as StreamEvent;

              if (event.type === "thinking") {
                store.setTurnThinking(sessionId, assistantTurnId, event.text);
                store.setTurnStatus(sessionId, assistantTurnId, "executing");
              }
              if (event.type === "query_start") {
                store.addQuery(sessionId, assistantTurnId, {
                  id: event.queryId,
                  sql: event.sql,
                  title: event.title,
                  viz: { type: "table" },
                  status: "running",
                  isEdited: false,
                });
              }
              if (event.type === "query_result") {
                store.setQueryResult(
                  sessionId,
                  assistantTurnId,
                  event.queryId,
                  event.result,
                  event.viz
                );
              }
              if (event.type === "query_error") {
                store.setQueryError(sessionId, assistantTurnId, event.queryId, event.error);
              }
              if (event.type === "explanation") {
                store.setTurnExplanation(sessionId, assistantTurnId, event.text);
              }
              if (event.type === "done") {
                store.setTurnStatus(sessionId, assistantTurnId, "complete");
              }
              if (event.type === "error") {
                store.setTurnStatus(sessionId, assistantTurnId, "error");
              }
            } catch {
              // skip malformed line
            }
          }
        }
      } catch (err) {
        store.updateAssistantTurn(sessionId, assistantTurnId, {
          status: "error",
          explanation:
            err instanceof Error ? err.message : "Something went wrong. Please try again.",
        });
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    },
    [session, sessionId, sending, store]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasQueries = session?.turns.some(
    (t) => t.role === "assistant" && (t as AssistantTurn).queries.length > 0
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-s1 border-b border-DEFAULT z-10">
        <Link
          href="/querytalk"
          className="text-xs text-muted2 hover:text-text transition-colors whitespace-nowrap"
        >
          ← Sessions
        </Link>

        <div className="w-px h-4 bg-border2" />

        <span className="text-sm font-semibold text-text truncate flex-1">{session.title}</span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Export to Dashcraft */}
          <button
            disabled={!hasQueries}
            className="flex items-center gap-1.5 text-xs text-muted2 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-btn hover:bg-s2"
          >
            <ArrowUpRight size={13} />
            Export to Dashcraft
          </button>

          {/* Schema toggle */}
          <button
            onClick={() => setSchemaOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-btn transition-colors ${
              schemaOpen
                ? "text-accent bg-accent/10"
                : "text-muted2 hover:text-text hover:bg-s2"
            }`}
          >
            {schemaOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
            Schema
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Schema sidebar */}
        {schemaOpen && <SchemaSidebar session={session} />}

        {/* Chat column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {session.turns.length === 0 ? (
              <StarterChips
                onSelect={(q) => sendMessage(q)}
                sessionId={sessionId}
                session={session}
              />
            ) : (
              session.turns.map((turn) =>
                turn.role === "user" ? (
                  <UserBubble key={turn.id} turn={turn as UserTurn} />
                ) : (
                  <AssistantBubble key={turn.id} turn={turn as AssistantTurn} />
                )
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-DEFAULT bg-s1 px-4 py-4">
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your data…"
                disabled={sending}
                className="flex-1 resize-none bg-s2 border border-DEFAULT rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50 leading-relaxed overflow-y-auto"
                style={{ minHeight: "42px", maxHeight: "140px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-btn bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted text-center mt-2">
              Enter to send &nbsp;·&nbsp; Shift+Enter for newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
