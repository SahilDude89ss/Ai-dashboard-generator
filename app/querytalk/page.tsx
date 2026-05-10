"use client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function QueryTalkPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-DEFAULT">
        <Link
          href="/dashcraft"
          className="text-sm text-muted2 hover:text-text transition-colors"
        >
          ← Dashcraft
        </Link>
        <span className="font-syne font-bold text-text text-sm tracking-wide">
          QueryTalk
        </span>
        <div className="w-24" />
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 animate-fadeUp">
        {/* Icon */}
        <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20">
          <MessageSquare size={36} className="text-accent" />
        </div>

        {/* Heading */}
        <h1 className="font-syne text-5xl sm:text-6xl font-black text-text text-center mb-4 leading-tight">
          QueryTalk
        </h1>

        <p className="text-muted2 text-lg text-center max-w-md mb-10 leading-relaxed">
          Ask your database anything. Get instant answers with charts.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <Link
            href="/querytalk/connect"
            className="bg-accent text-white rounded-btn px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity text-center"
          >
            Connect Database
          </Link>
          <Link
            href="/querytalk/connect?mode=dump"
            className="bg-s2 border border-border2 text-text rounded-btn px-6 py-3 text-sm font-semibold hover:border-accent/40 transition-colors text-center"
          >
            Upload SQL Dump
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {["No SQL required", "Multi-turn conversation", "Export to Dashcraft"].map((pill) => (
            <span
              key={pill}
              className="px-3 py-1 bg-s1 border border-DEFAULT rounded-full text-xs text-muted2"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Bottom tagline */}
        <p className="text-xs text-muted text-center">
          Supports PostgreSQL &bull; MySQL &bull; SQLite
        </p>
      </div>
    </main>
  );
}
