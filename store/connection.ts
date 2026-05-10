import { create } from "zustand";
import { DbConnectionConfig, DbSchema } from "@/types";
import { compressSchema } from "@/lib/db/compress";

interface ConnectionStore {
  config: DbConnectionConfig | null;
  schema: DbSchema | null;
  compressedSchema: string | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;

  connect: (config: DbConnectionConfig) => Promise<void>;
  setSchema: (schema: DbSchema, config: DbConnectionConfig) => void;
  disconnect: () => void;
  clearError: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  config: null,
  schema: null,
  compressedSchema: null,
  status: "disconnected",
  error: null,

  connect: async (config) => {
    set({ status: "connecting", error: null });
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Connection failed");

      const schema: DbSchema = { ...data.schema, connectedAt: new Date() };
      const compressed = compressSchema(schema);
      set({ config, schema, compressedSchema: compressed, status: "connected", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Connection failed" });
      throw err;
    }
  },

  setSchema: (schema, config) => {
    const compressed = compressSchema(schema);
    set({ schema, compressedSchema: compressed, config, status: "connected" });
  },

  disconnect: () => set({ config: null, schema: null, compressedSchema: null, status: "disconnected", error: null }),

  clearError: () => set({ error: null }),
}));
