"use client";
import { create } from "zustand";
import {
  Session,
  Turn,
  UserTurn,
  AssistantTurn,
  ExecutedQuery,
  ConversationContext,
  DbConnectionConfig,
  DbSchema,
  QueryResult,
  VizHint,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

const LS_KEY = "qt:sessions";

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultContext = (): ConversationContext => ({
  recentTurns: [],
  activeFilters: [],
  lastQuery: null,
  clarificationCount: 0,
  usesSonnet: false,
});

/** Revive Date fields that JSON.parse returns as strings */
function reviveSession(raw: unknown): Session {
  const s = raw as Session;
  return {
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    schema: {
      ...s.schema,
      connectedAt: new Date(s.schema.connectedAt),
    },
    turns: s.turns.map((t) => ({
      ...t,
      timestamp: new Date((t as Turn).timestamp),
    })),
  };
}

function loadFromStorage(): Session[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(reviveSession);
  } catch {
    return [];
  }
}

function saveToStorage(sessions: Session[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage may be unavailable (SSR or private browsing)
  }
}

/** Immutably update a session in the sessions array */
function updateSessionIn(sessions: Session[], sessionId: string, fn: (s: Session) => Session): Session[] {
  return sessions.map((s) => (s.id === sessionId ? fn(s) : s));
}

/** Immutably update an assistant turn inside a session */
function updateAssistantTurnIn(
  session: Session,
  turnId: string,
  fn: (t: AssistantTurn) => AssistantTurn
): Session {
  return {
    ...session,
    updatedAt: new Date(),
    turns: session.turns.map((t) => {
      if (t.id !== turnId || t.role !== "assistant") return t;
      return fn(t as AssistantTurn);
    }),
  };
}

/** Immutably update an ExecutedQuery inside an assistant turn */
function updateQueryIn(
  turn: AssistantTurn,
  queryId: string,
  fn: (q: ExecutedQuery) => ExecutedQuery
): AssistantTurn {
  return {
    ...turn,
    queries: turn.queries.map((q) => (q.id === queryId ? fn(q) : q)),
  };
}

// ── Store interface ───────────────────────────────────────────────────────────

interface QueryTalkStore {
  // State
  sessions: Session[];
  activeSessionId: string | null;

  // Derived
  getActiveSession: () => Session | null;

  // Session management
  createSession: (config: DbConnectionConfig, schema: DbSchema) => string;
  loadSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => void;
  listSessions: () => { id: string; title: string; createdAt: Date }[];

  // Turn management
  addUserTurn: (sessionId: string, content: string) => string;
  addAssistantTurn: (sessionId: string, turnId: string, initialStatus: AssistantTurn["status"]) => void;
  updateAssistantTurn: (sessionId: string, turnId: string, updates: Partial<AssistantTurn>) => void;
  setTurnStatus: (sessionId: string, turnId: string, status: AssistantTurn["status"]) => void;
  setTurnThinking: (sessionId: string, turnId: string, thinking: string) => void;
  setTurnExplanation: (sessionId: string, turnId: string, explanation: string) => void;

  // Query management within turns
  addQuery: (sessionId: string, turnId: string, query: ExecutedQuery) => void;
  updateQuery: (sessionId: string, turnId: string, queryId: string, updates: Partial<ExecutedQuery>) => void;
  setQueryResult: (sessionId: string, turnId: string, queryId: string, result: QueryResult, viz: VizHint) => void;
  setQueryError: (sessionId: string, turnId: string, queryId: string, error: string) => void;
  setQueryEditedSql: (sessionId: string, turnId: string, queryId: string, sql: string) => void;

  // Context
  updateContext: (sessionId: string, context: ConversationContext) => void;
}

// ── Store implementation ──────────────────────────────────────────────────────

export const useQueryTalkStore = create<QueryTalkStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────

  sessions: loadFromStorage(),
  activeSessionId: null,

  // ── Derived ────────────────────────────────────────────────────────────────

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  },

  // ── Session management ─────────────────────────────────────────────────────

  createSession: (config, schema) => {
    const id = uuidv4();
    const now = new Date();
    const session: Session = {
      id,
      title: "New Session",
      connection: config,
      schema,
      turns: [],
      context: defaultContext(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const sessions = [session, ...state.sessions];
      saveToStorage(sessions);
      return { sessions, activeSessionId: id };
    });
    return id;
  },

  loadSession: (sessionId) => {
    const found = get().sessions.some((s) => s.id === sessionId);
    if (found) {
      set({ activeSessionId: sessionId });
    }
    return found;
  },

  deleteSession: (sessionId) => {
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      saveToStorage(sessions);
      return {
        sessions,
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      };
    });
  },

  listSessions: () => {
    return [...get().sessions]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt }));
  },

  // ── Turn management ────────────────────────────────────────────────────────

  addUserTurn: (sessionId, content) => {
    const turnId = uuidv4();
    const turn: UserTurn = {
      id: turnId,
      role: "user",
      content,
      timestamp: new Date(),
    };
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) => ({
        ...s,
        updatedAt: new Date(),
        turns: [...s.turns, turn],
      }));
      saveToStorage(sessions);
      return { sessions };
    });
    return turnId;
  },

  addAssistantTurn: (sessionId, turnId, initialStatus) => {
    const turn: AssistantTurn = {
      id: turnId,
      role: "assistant",
      status: initialStatus,
      queries: [],
      timestamp: new Date(),
    };
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) => ({
        ...s,
        updatedAt: new Date(),
        turns: [...s.turns, turn],
      }));
      saveToStorage(sessions);
      return { sessions };
    });
  },

  updateAssistantTurn: (sessionId, turnId, updates) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) => ({ ...t, ...updates }))
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setTurnStatus: (sessionId, turnId, status) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) => ({ ...t, status }))
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setTurnThinking: (sessionId, turnId, thinking) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) => ({ ...t, thinking }))
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setTurnExplanation: (sessionId, turnId, explanation) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) => ({ ...t, explanation }))
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  // ── Query management ───────────────────────────────────────────────────────

  addQuery: (sessionId, turnId, query) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) => ({
          ...t,
          queries: [...t.queries, query],
        }))
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  updateQuery: (sessionId, turnId, queryId, updates) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) =>
          updateQueryIn(t, queryId, (q) => ({ ...q, ...updates }))
        )
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setQueryResult: (sessionId, turnId, queryId, result, viz) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) =>
          updateQueryIn(t, queryId, (q) => ({
            ...q,
            status: "success" as const,
            result,
            viz,
            error: undefined,
            executionMs: result.executionMs,
          }))
        )
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setQueryError: (sessionId, turnId, queryId, error) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) =>
          updateQueryIn(t, queryId, (q) => ({
            ...q,
            status: "error" as const,
            error,
          }))
        )
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  setQueryEditedSql: (sessionId, turnId, queryId, sql) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) =>
        updateAssistantTurnIn(s, turnId, (t) =>
          updateQueryIn(t, queryId, (q) => ({
            ...q,
            isEdited: true,
            editedSql: sql,
          }))
        )
      );
      saveToStorage(sessions);
      return { sessions };
    });
  },

  // ── Context ────────────────────────────────────────────────────────────────

  updateContext: (sessionId, context) => {
    set((state) => {
      const sessions = updateSessionIn(state.sessions, sessionId, (s) => ({
        ...s,
        context,
        updatedAt: new Date(),
      }));
      saveToStorage(sessions);
      return { sessions };
    });
  },
}));
