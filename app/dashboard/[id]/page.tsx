"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { DashboardCanvas } from "@/components/dashboard/DashboardCanvas";
import { QueryBadge } from "@/components/dashboard/QueryBadge";
import { GenerationLog } from "@/components/dashboard/GenerationLog";
import { Spinner } from "@/components/ui/Spinner";
import { Tag } from "@/components/ui/Tag";
import { Widget, QueryResult } from "@/types";
import { LayoutDashboard } from "lucide-react";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const {
    dashboard,
    generationStatus,
    generationLog,
    loadFromBrowser,
    updateWidget,
    setWidgetResult,
    setWidgetError,
    saveToBrowser,
  } = useDashboardStore();

  const [badgeDismissed, setBadgeDismissed] = useState(false);
  const [loadStartMs] = useState(Date.now());
  const [loadedMs, setLoadedMs] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!dashboard || dashboard.id !== id) {
      loadFromBrowser(id);
    }
  }, [id]);

  const executeAllWidgets = useCallback(
    async (widgets: Widget[], connection: NonNullable<typeof dashboard>["connection"]) => {
      if (!connection) return;

      const results = await Promise.allSettled(
        widgets.map(async (widget) => {
          updateWidget(widget.id, { status: "loading" });
          const res = await fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sql: widget.sql, connection, maxRows: 500 }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Query failed");
          return { id: widget.id, result: data as QueryResult };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          setWidgetResult(result.value.id, result.value.result);
        } else {
          // find which widget failed - match by index
        }
      }
      setLoadedMs(Date.now() - loadStartMs);
      saveToBrowser();
    },
    [updateWidget, setWidgetResult, loadStartMs, saveToBrowser]
  );

  useEffect(() => {
    if (!dashboard) return;
    if (dashboard.connection && generationStatus === "success") {
      const idleWidgets = dashboard.widgets.filter((w) => w.status === "idle");
      if (idleWidgets.length > 0) {
        executeAllWidgets(idleWidgets, dashboard.connection);
      }
    }
  }, [dashboard?.id, generationStatus]);

  if (!hydrated) return null;

  if (!dashboard || dashboard.id !== id) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted2 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const isLive = !!dashboard.connection;
  const dialectLabels: Record<string, string> = {
    postgresql: "PostgreSQL 🐘",
    mysql: "MySQL 🐬",
    sqlite: "SQLite 📦",
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-s1/90 backdrop-blur border-b border-[rgba(255,255,255,0.06)] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-accent font-black text-lg">
              <LayoutDashboard size={20} />
              Dashcraft
            </Link>
            <span className="text-muted">/</span>
            <span className="text-text font-semibold text-sm truncate max-w-xs">{dashboard.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tag variant="muted">{dialectLabels[dashboard.dialect] ?? dashboard.dialect}</Tag>
            {isLive ? (
              <Tag variant="success">Live</Tag>
            ) : (
              <Tag variant="warning">Preview</Tag>
            )}
            <Link
              href="/new"
              className="text-xs text-muted2 hover:text-text transition-colors font-semibold"
            >
              + New Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Generation banner */}
        {generationStatus === "generating" && (
          <div className="mb-6">
            <GenerationLog entries={generationLog} status={generationStatus} />
          </div>
        )}

        {/* Preview mode banner */}
        {!isLive && (
          <div className="mb-6 px-4 py-3 bg-a4/10 border border-a4/20 rounded-card text-a4 text-sm flex items-center gap-2">
            <span>⚠</span>
            Preview mode — connect a live database to execute queries and see real data.
          </div>
        )}

        {/* Info badge */}
        {!badgeDismissed && generationStatus === "success" && (
          <div className="mb-6">
            <QueryBadge
              widgets={dashboard.widgets}
              totalMs={loadedMs ?? undefined}
              onDismiss={() => setBadgeDismissed(true)}
            />
          </div>
        )}

        {/* Dashboard */}
        <DashboardCanvas dashboard={dashboard} connection={dashboard.connection} />
      </main>
    </div>
  );
}
