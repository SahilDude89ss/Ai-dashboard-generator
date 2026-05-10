import Link from "next/link";
import { LayoutDashboard, MessageSquare, ArrowRight, Zap, Database, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-DEFAULT">
        <span className="font-syne font-bold text-lg text-text tracking-tight">
          Dash<span className="text-accent">Craft</span> AI
        </span>
        <div className="flex items-center gap-6 text-sm text-muted2">
          <Link href="/dashcraft" className="hover:text-text transition-colors">Dashcraft</Link>
          <Link href="/querytalk" className="hover:text-text transition-colors">QueryTalk</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent mb-8">
          <Zap size={12} />
          <span>Powered by Claude AI</span>
        </div>

        <h1 className="font-syne font-bold text-5xl md:text-6xl text-text tracking-tight mb-5 max-w-3xl">
          Your AI-powered
          <br />
          <span className="text-accent">SQL intelligence</span> suite
        </h1>

        <p className="text-muted2 text-lg max-w-xl mb-16 leading-relaxed">
          Build live dashboards or have natural conversations with your database.
          Two tools, one seamless workflow — no SQL expertise required.
        </p>

        {/* Product cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
          {/* Dashcraft */}
          <Link
            href="/dashcraft"
            className="group bg-s1 border border-DEFAULT rounded-card p-6 text-left hover:border-accent/40 transition-all duration-200 hover:bg-s2"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <LayoutDashboard size={22} className="text-accent" />
            </div>
            <h2 className="font-syne font-semibold text-xl text-text mb-2">Dashcraft</h2>
            <p className="text-muted2 text-sm leading-relaxed mb-4">
              Generate full dashboards from a single prompt. Connect your database, describe what you need, and get production-ready charts instantly.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Live DB", "SQL Dump", "7 chart types", "Auto-refresh"].map((tag) => (
                <span key={tag} className="text-xs bg-s3 text-muted2 rounded-full px-2.5 py-1">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-accent text-sm font-medium">
              <span>Open Dashcraft</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* QueryTalk */}
          <Link
            href="/querytalk"
            className="group bg-s1 border border-DEFAULT rounded-card p-6 text-left hover:border-a2/40 transition-all duration-200 hover:bg-s2"
          >
            <div className="w-12 h-12 rounded-xl bg-a2/10 flex items-center justify-center mb-4 group-hover:bg-a2/20 transition-colors">
              <MessageSquare size={22} className="text-a2" />
            </div>
            <h2 className="font-syne font-semibold text-xl text-text mb-2">QueryTalk</h2>
            <p className="text-muted2 text-sm leading-relaxed mb-4">
              Ask your database anything in plain English. Multi-turn conversations, live results, smart visualizations — and export directly to Dashcraft.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Conversational", "Multi-turn", "Auto-charts", "→ Dashcraft"].map((tag) => (
                <span key={tag} className="text-xs bg-s3 text-muted2 rounded-full px-2.5 py-1">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-a2 text-sm font-medium">
              <span>Open QueryTalk</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature row */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted2">
          {[
            { icon: Database, text: "PostgreSQL · MySQL · SQLite" },
            { icon: Brain, text: "Claude Haiku + Sonnet" },
            { icon: Zap, text: "Streaming responses" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={14} className="text-muted" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-DEFAULT flex items-center justify-between text-xs text-muted">
        <span>DashCraft AI — Built with Next.js 14 + Claude</span>
        <span>Supports PostgreSQL · MySQL · SQLite</span>
      </footer>
    </main>
  );
}
