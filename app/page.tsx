"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { Button } from "@/components/ui/Button";
import { Database, Zap, Eye } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { listFromBrowser } = useDashboardStore();

  useEffect(() => {
    try {
      const dashboards = listFromBrowser();
      if (dashboards.length > 0) {
        router.replace(`/dashboard/${dashboards[0].id}`);
      }
    } catch {}
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-bg">
      <div className="max-w-2xl w-full text-center animate-fadeUp">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-accent tracking-wide">Powered by Claude</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-text leading-tight mb-4">
          Describe it.{" "}
          <span className="text-accent">Claude writes</span>{" "}
          the SQL.
        </h1>

        <p className="text-muted2 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Connect your database or upload a SQL dump — get a fully-rendered dashboard with real, dialect-correct SQL behind every widget.
        </p>

        <Link href="/new">
          <Button size="lg" className="mb-12 text-base px-8 py-4">
            Build your first dashboard →
          </Button>
        </Link>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            {
              icon: <Database size={20} />,
              step: "1. Connect",
              desc: "Link a live PostgreSQL, MySQL, or SQLite database — or upload a SQL dump file.",
            },
            {
              icon: <Zap size={20} />,
              step: "2. Describe",
              desc: "Tell Claude what you want in plain English. No SQL knowledge required.",
            },
            {
              icon: <Eye size={20} />,
              step: "3. Explore",
              desc: "Instant dashboard with real data. Inspect and edit every query.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card p-5"
            >
              <div className="text-accent mb-3">{item.icon}</div>
              <h3 className="font-bold text-text text-sm mb-1">{item.step}</h3>
              <p className="text-muted2 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
