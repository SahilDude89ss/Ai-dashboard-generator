import { create } from "zustand";
import { DbConnectionConfig, DbDialect, DbSchema } from "@/types";

interface SetupStore {
  sourceType: "live" | "dump" | null;
  connectionConfig: DbConnectionConfig | null;
  sqlDumpContent: string | null;
  schema: DbSchema | null;
  schemaStatus: "idle" | "loading" | "success" | "error";
  schemaError: string | null;
  dialect: DbDialect;
  prompt: string;
  setSourceType: (type: "live" | "dump") => void;
  setConnectionConfig: (config: DbConnectionConfig) => void;
  setSqlDump: (content: string) => void;
  setSchema: (schema: DbSchema) => void;
  setSchemaStatus: (status: "idle" | "loading" | "success" | "error", error?: string) => void;
  setDialect: (dialect: DbDialect) => void;
  setPrompt: (prompt: string) => void;
  reset: () => void;
}

const initialState = {
  sourceType: null as "live" | "dump" | null,
  connectionConfig: null as DbConnectionConfig | null,
  sqlDumpContent: null as string | null,
  schema: null as DbSchema | null,
  schemaStatus: "idle" as const,
  schemaError: null as string | null,
  dialect: "postgresql" as DbDialect,
  prompt: "",
};

export const useSetupStore = create<SetupStore>((set) => ({
  ...initialState,
  setSourceType: (type) => set({ sourceType: type }),
  setConnectionConfig: (config) => set({ connectionConfig: config }),
  setSqlDump: (content) => set({ sqlDumpContent: content }),
  setSchema: (schema) => set({ schema, schemaStatus: "success", schemaError: null }),
  setSchemaStatus: (status, error) => set({ schemaStatus: status, schemaError: error ?? null }),
  setDialect: (dialect) => set({ dialect }),
  setPrompt: (prompt) => set({ prompt }),
  reset: () => set(initialState),
}));
