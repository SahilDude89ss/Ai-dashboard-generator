"use client";
import { useState } from "react";
import { useSetupStore } from "@/store/setup";
import { DbConnectionConfig, DbDialect } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DialectPicker } from "./DialectPicker";
import { CheckCircle, AlertCircle } from "lucide-react";

interface LiveDbFormProps {
  onConnected: () => void;
}

export function LiveDbForm({ onConnected }: LiveDbFormProps) {
  const { dialect, setConnectionConfig, setSchema, setSchemaStatus } = useSetupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const [form, setForm] = useState({
    host: "",
    port: "",
    database: "",
    user: "",
    password: "",
    ssl: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const config: DbConnectionConfig = {
      dialect,
      host: dialect !== "sqlite" ? form.host : undefined,
      port: dialect !== "sqlite" && form.port ? parseInt(form.port) : undefined,
      database: form.database,
      user: dialect !== "sqlite" ? form.user : undefined,
      password: dialect !== "sqlite" ? form.password : undefined,
      ssl: dialect === "postgresql" ? form.ssl : undefined,
    };

    try {
      setSchemaStatus("loading");
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Connection failed");
      }

      setConnectionConfig(config);
      setSchema({ ...data.schema, connectedAt: new Date() });
      setLatency(data.latencyMs);
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setSchemaStatus("error", err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const defaultPort = dialect === "postgresql" ? "5432" : dialect === "mysql" ? "3306" : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialectPicker />

      {dialect !== "sqlite" ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Host"
                placeholder="localhost"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                required
              />
            </div>
            <Input
              label="Port"
              placeholder={defaultPort}
              value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              type="number"
            />
          </div>
          <Input
            label="Database"
            placeholder="my_database"
            value={form.database}
            onChange={(e) => setForm({ ...form, database: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              placeholder="postgres"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {dialect === "postgresql" && (
            <label className="flex items-center gap-2 text-sm text-muted2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ssl}
                onChange={(e) => setForm({ ...form, ssl: e.target.checked })}
                className="accent-accent"
              />
              Enable SSL
            </label>
          )}
        </>
      ) : (
        <Input
          label="File Path"
          placeholder="/path/to/database.db"
          value={form.database}
          onChange={(e) => setForm({ ...form, database: e.target.value })}
          required
        />
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-input bg-a3/10 border border-a3/30 text-a3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {latency && !error && (
        <div className="flex items-center gap-2 text-a2 text-sm">
          <CheckCircle size={16} />
          Connected in {latency}ms
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Test Connection & Extract Schema
      </Button>
    </form>
  );
}
