"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";
import { useQueryTalkStore } from "@/store/querytalk";
import { parseSqlDump } from "@/lib/db/parse-sql-dump";
import type { DbDialect, DbConnectionConfig } from "@/types";

// ── Small reusable pieces ─────────────────────────────────────────────────────

const inputCls =
  "bg-s2 border border-DEFAULT rounded-input px-3 py-2 text-sm text-text w-full focus:outline-none focus:border-accent transition-colors";

const labelCls = "block text-xs font-medium text-muted2 mb-1";

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input className={inputCls} {...props} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabId = "live" | "dump";

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useQueryTalkStore();

  const defaultTab: TabId = searchParams.get("mode") === "dump" ? "dump" : "live";
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  // ── Live connection state ──────────────────────────────────────────────────
  const [dialect, setDialect] = useState<DbDialect>("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);
  const [sqlitePath, setSqlitePath] = useState("");

  // ── SQL dump state ─────────────────────────────────────────────────────────
  const [dumpDialect, setDumpDialect] = useState<DbDialect>("postgresql");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Shared UI state ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Dialect selector component ─────────────────────────────────────────────
  const DialectSelector = ({
    value,
    onChange,
  }: {
    value: DbDialect;
    onChange: (d: DbDialect) => void;
  }) => {
    const dialects: DbDialect[] = ["postgresql", "mysql", "sqlite"];
    return (
      <div>
        <p className={labelCls}>Dialect</p>
        <div className="flex gap-2">
          {dialects.map((d) => (
            <button
              key={d}
              onClick={() => onChange(d)}
              className={`flex-1 rounded-btn px-3 py-2 text-xs font-semibold border transition-colors ${
                value === d
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-s2 border-DEFAULT text-muted2 hover:border-border2"
              }`}
            >
              {d === "postgresql" ? "PostgreSQL" : d === "mysql" ? "MySQL" : "SQLite"}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Live connect handler ───────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const config: DbConnectionConfig = {
        dialect,
        database: dialect === "sqlite" ? sqlitePath : database,
        ...(dialect !== "sqlite" && {
          host,
          port: parseInt(port, 10) || undefined,
          user,
          password,
          ssl,
        }),
      };

      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Connection failed");
      }

      const { schema } = (await res.json()) as {
        schema: import("@/types").DbSchema;
      };

      const sessionId = store.createSession(config, schema);
      store.loadSession(sessionId);
      router.push(`/querytalk/chat/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [dialect, database, sqlitePath, host, port, user, password, ssl, store, router]);

  // ── SQL dump handlers ──────────────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".sql")) {
        setError("Please upload a .sql file");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const text = await file.text();
        const schema = await parseSqlDump(text, dumpDialect);

        const config: DbConnectionConfig = {
          dialect: dumpDialect,
          database: file.name.replace(/\.sql$/, ""),
        };

        const sessionId = store.createSession(config, schema);
        store.loadSession(sessionId);
        router.push(`/querytalk/chat/${sessionId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse SQL dump");
      } finally {
        setLoading(false);
      }
    },
    [dumpDialect, store, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const tabCls = (id: TabId) =>
    `flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
      activeTab === id
        ? "border-accent text-accent"
        : "border-transparent text-muted2 hover:text-text"
    }`;

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
      {/* Back link */}
      <div className="w-full max-w-lg mb-4">
        <Link href="/querytalk" className="text-sm text-muted2 hover:text-text transition-colors">
          ← Back
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-s1 border border-DEFAULT rounded-card overflow-hidden animate-fadeUp">
        {/* Card header */}
        <div className="px-6 pt-6 pb-4 border-b border-DEFAULT">
          <h1 className="font-syne text-xl font-bold text-text">Connect to Database</h1>
          <p className="text-xs text-muted2 mt-1">
            Link a live database or import a SQL dump to start chatting.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-DEFAULT px-6">
          <button className={tabCls("live")} onClick={() => setActiveTab("live")}>
            Live Connection
          </button>
          <button className={tabCls("dump")} onClick={() => setActiveTab("dump")}>
            SQL Dump
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Live Connection Tab ── */}
          {activeTab === "live" && (
            <>
              <DialectSelector value={dialect} onChange={setDialect} />

              {dialect === "sqlite" ? (
                <Field
                  label="Database file path"
                  placeholder="/path/to/database.db"
                  value={sqlitePath}
                  onChange={(e) => setSqlitePath(e.target.value)}
                />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field
                        label="Host"
                        placeholder="localhost"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                      />
                    </div>
                    <div>
                      <Field
                        label="Port"
                        placeholder={dialect === "mysql" ? "3306" : "5432"}
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                      />
                    </div>
                  </div>

                  <Field
                    label="Database"
                    placeholder="my_database"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="User"
                      placeholder="postgres"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                    />
                    <Field
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {/* SSL toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setSsl((v) => !v)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${
                        ssl ? "bg-accent" : "bg-s3"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          ssl ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-muted2">Enable SSL</span>
                  </label>
                </>
              )}

              {error && (
                <p className="text-xs text-a3 bg-a3/10 border border-a3/20 rounded-input px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full bg-accent text-white rounded-btn px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Connecting…
                  </>
                ) : (
                  "Connect"
                )}
              </button>
            </>
          )}

          {/* ── SQL Dump Tab ── */}
          {activeTab === "dump" && (
            <>
              <DialectSelector value={dumpDialect} onChange={setDumpDialect} />

              {/* Drag-and-drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-card p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  dragging
                    ? "border-accent bg-accent/5"
                    : "border-DEFAULT hover:border-border2 bg-s2"
                }`}
              >
                <Upload size={28} className={dragging ? "text-accent" : "text-muted"} />
                <div className="text-center">
                  <p className="text-sm font-medium text-text">
                    {dragging ? "Drop it!" : "Drop your .sql file here"}
                  </p>
                  <p className="text-xs text-muted mt-1">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  className="hidden"
                  onChange={onFileInput}
                />
              </div>

              {error && (
                <p className="text-xs text-a3 bg-a3/10 border border-a3/20 rounded-input px-3 py-2">
                  {error}
                </p>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted2">
                  <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  Parsing SQL dump…
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
