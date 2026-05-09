import { create } from "zustand";
import { Dashboard, DbDialect, DbSchema, LogEntry, QueryResult, Widget, WidgetSpec } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface DashboardStore {
  dashboard: Dashboard | null;
  generationStatus: "idle" | "generating" | "success" | "error";
  generationLog: LogEntry[];
  startGeneration: (schema: DbSchema, prompt: string, dialect: DbDialect) => string;
  addLogEntry: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  setWidgets: (widgets: Widget[]) => void;
  addWidget: (spec: WidgetSpec) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updateWidgetSql: (id: string, sql: string) => void;
  setWidgetResult: (id: string, result: QueryResult) => void;
  setWidgetError: (id: string, error: string) => void;
  setGenerationStatus: (status: "idle" | "generating" | "success" | "error") => void;
  setDashboard: (dashboard: Dashboard) => void;
  saveToBrowser: () => void;
  loadFromBrowser: (id: string) => boolean;
  listFromBrowser: () => { id: string; title: string; createdAt: Date }[];
}

function widgetFromSpec(spec: WidgetSpec): Widget {
  return { ...spec, status: "idle" };
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboard: null,
  generationStatus: "idle",
  generationLog: [],

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
    set((state) => ({ generationLog: [...state.generationLog, full] }));
  },

  setWidgets: (widgets) =>
    set((state) => ({
      dashboard: state.dashboard
        ? { ...state.dashboard, widgets, title: state.dashboard.title === "Generating Dashboard…" ? "Dashboard" : state.dashboard.title }
        : null,
    })),

  addWidget: (spec) =>
    set((state) => ({
      dashboard: state.dashboard
        ? { ...state.dashboard, widgets: [...state.dashboard.widgets, widgetFromSpec(spec)] }
        : null,
    })),

  updateWidget: (id, updates) =>
    set((state) => ({
      dashboard: state.dashboard
        ? {
            ...state.dashboard,
            widgets: state.dashboard.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
            updatedAt: new Date(),
          }
        : null,
    })),

  updateWidgetSql: (id, sql) =>
    set((state) => ({
      dashboard: state.dashboard
        ? {
            ...state.dashboard,
            widgets: state.dashboard.widgets.map((w) =>
              w.id === id ? { ...w, sql, status: "idle" as const } : w
            ),
            updatedAt: new Date(),
          }
        : null,
    })),

  setWidgetResult: (id, result) =>
    set((state) => ({
      dashboard: state.dashboard
        ? {
            ...state.dashboard,
            widgets: state.dashboard.widgets.map((w) =>
              w.id === id
                ? { ...w, status: "success" as const, result, lastExecutedAt: new Date(), error: undefined }
                : w
            ),
          }
        : null,
    })),

  setWidgetError: (id, error) =>
    set((state) => ({
      dashboard: state.dashboard
        ? {
            ...state.dashboard,
            widgets: state.dashboard.widgets.map((w) =>
              w.id === id ? { ...w, status: "error" as const, error } : w
            ),
          }
        : null,
    })),

  setGenerationStatus: (status) => set({ generationStatus: status }),

  setDashboard: (dashboard) => set({ dashboard }),

  saveToBrowser: () => {
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

  loadFromBrowser: (id) => {
    try {
      const raw = localStorage.getItem(`dashcraft:${id}`);
      if (!raw) return false;
      const dashboard = JSON.parse(raw) as Dashboard;
      // Rehydrate dates
      dashboard.createdAt = new Date(dashboard.createdAt);
      dashboard.updatedAt = new Date(dashboard.updatedAt);
      dashboard.schema.connectedAt = new Date(dashboard.schema.connectedAt);
      set({ dashboard, generationStatus: "success" });
      return true;
    } catch {
      return false;
    }
  },

  listFromBrowser: () => {
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
