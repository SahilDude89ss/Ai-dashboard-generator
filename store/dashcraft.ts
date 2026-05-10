import { create } from "zustand";
import { Dashboard, DbConnectionConfig, DbDialect, DbSchema, LogEntry, QueryResult, Widget } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface DashcraftStore {
  // Setup
  sourceType: "live" | "dump" | null;
  connectionConfig: DbConnectionConfig | null;
  schema: DbSchema | null;
  schemaStatus: "idle" | "loading" | "success" | "error";
  schemaError: string | null;
  dialect: DbDialect;
  prompt: string;

  // Dashboard
  dashboard: Dashboard | null;
  generationStatus: "idle" | "generating" | "success" | "error";
  generationLog: LogEntry[];

  // Setup actions
  setSourceType: (type: "live" | "dump") => void;
  setConnectionConfig: (config: DbConnectionConfig) => void;
  setSqlDump: (content: string) => void;
  setSchema: (schema: DbSchema) => void;
  setSchemaStatus: (status: "idle" | "loading" | "success" | "error", error?: string) => void;
  setDialect: (d: DbDialect) => void;
  setPrompt: (p: string) => void;
  resetSetup: () => void;

  // Dashboard actions
  startGeneration: (schema: DbSchema, prompt: string, dialect: DbDialect) => string;
  addLogEntry: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  addWidget: (widget: Widget) => void;
  setWidgets: (widgets: Widget[]) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updateWidgetSql: (id: string, sql: string) => void;
  setWidgetResult: (id: string, result: QueryResult) => void;
  setWidgetError: (id: string, error: string) => void;
  setGenerationStatus: (status: "idle" | "generating" | "success" | "error") => void;
  setDashboard: (dashboard: Dashboard) => void;
  saveDashboard: () => void;
  loadDashboard: (id: string) => boolean;
  listDashboards: () => { id: string; title: string; createdAt: Date }[];
}

export const useDashcraftStore = create<DashcraftStore>((set, get) => ({
  // Setup state
  sourceType: null,
  connectionConfig: null,
  schema: null,
  schemaStatus: "idle",
  schemaError: null,
  dialect: "postgresql",
  prompt: "",

  // Dashboard state
  dashboard: null,
  generationStatus: "idle",
  generationLog: [],

  setSourceType: (type) => set({ sourceType: type }),
  setConnectionConfig: (config) => set({ connectionConfig: config }),
  setSqlDump: (_content) => {},
  setSchema: (schema) => set({ schema, schemaStatus: "success", schemaError: null }),
  setSchemaStatus: (status, error) => set({ schemaStatus: status, schemaError: error ?? null }),
  setDialect: (d) => set({ dialect: d }),
  setPrompt: (p) => set({ prompt: p }),
  resetSetup: () =>
    set({ sourceType: null, connectionConfig: null, schema: null, schemaStatus: "idle", schemaError: null, prompt: "" }),

  startGeneration: (schema, prompt, dialect) => {
    const id = uuidv4();
    const dashboard: Dashboard = {
      id,
      title: "Generating Dashboard…",
      schema,
      widgets: [],
      prompt,
      dialect,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set({ dashboard, generationStatus: "generating", generationLog: [] });
    return id;
  },

  addLogEntry: (entry) => {
    const full: LogEntry = { ...entry, id: uuidv4(), timestamp: new Date() };
    set((s) => ({ generationLog: [...s.generationLog, full] }));
  },

  addWidget: (widget) =>
    set((s) => ({
      dashboard: s.dashboard
        ? { ...s.dashboard, widgets: [...s.dashboard.widgets, widget] }
        : null,
    })),

  setWidgets: (widgets) =>
    set((s) => ({
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            widgets,
            title:
              s.dashboard.title === "Generating Dashboard…"
                ? "Dashboard"
                : s.dashboard.title,
          }
        : null,
    })),

  updateWidget: (id, updates) =>
    set((s) => ({
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            widgets: s.dashboard.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
            updatedAt: new Date(),
          }
        : null,
    })),

  updateWidgetSql: (id, sql) =>
    set((s) => ({
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            widgets: s.dashboard.widgets.map((w) =>
              w.id === id ? { ...w, sql, status: "idle" as const } : w
            ),
            updatedAt: new Date(),
          }
        : null,
    })),

  setWidgetResult: (id, result) =>
    set((s) => ({
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            widgets: s.dashboard.widgets.map((w) =>
              w.id === id
                ? { ...w, status: "success" as const, result, lastExecutedAt: new Date(), error: undefined }
                : w
            ),
          }
        : null,
    })),

  setWidgetError: (id, error) =>
    set((s) => ({
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            widgets: s.dashboard.widgets.map((w) =>
              w.id === id ? { ...w, status: "error" as const, error } : w
            ),
          }
        : null,
    })),

  setGenerationStatus: (status) => set({ generationStatus: status }),

  setDashboard: (dashboard) => set({ dashboard }),

  saveDashboard: () => {
    const { dashboard } = get();
    if (!dashboard) return;
    try {
      localStorage.setItem(`dashcraft:${dashboard.id}`, JSON.stringify(dashboard));
      const index: string[] = JSON.parse(localStorage.getItem("dashcraft:index") ?? "[]");
      if (!index.includes(dashboard.id)) {
        index.unshift(dashboard.id);
        localStorage.setItem("dashcraft:index", JSON.stringify(index.slice(0, 20)));
      }
    } catch {
      // localStorage may be unavailable
    }
  },

  loadDashboard: (id) => {
    try {
      const raw = localStorage.getItem(`dashcraft:${id}`);
      if (!raw) return false;
      const dashboard = JSON.parse(raw) as Dashboard;
      dashboard.createdAt = new Date(dashboard.createdAt);
      dashboard.updatedAt = new Date(dashboard.updatedAt);
      dashboard.schema.connectedAt = new Date(dashboard.schema.connectedAt);
      set({ dashboard, generationStatus: "success" });
      return true;
    } catch {
      return false;
    }
  },

  listDashboards: () => {
    try {
      const index: string[] = JSON.parse(localStorage.getItem("dashcraft:index") ?? "[]");
      return index
        .map((id) => {
          try {
            const raw = localStorage.getItem(`dashcraft:${id}`);
            if (!raw) return null;
            const d = JSON.parse(raw) as Dashboard;
            return { id: d.id, title: d.title, createdAt: new Date(d.createdAt) };
          } catch {
            return null;
          }
        })
        .filter((x): x is { id: string; title: string; createdAt: Date } => x !== null);
    } catch {
      return [];
    }
  },
}));
