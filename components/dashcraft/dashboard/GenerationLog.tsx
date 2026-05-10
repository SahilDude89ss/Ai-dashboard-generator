"use client";
import { LogEntry } from "@/types";
import { useEffect, useRef } from "react";

interface GenerationLogProps {
  entries: LogEntry[];
  status: "idle" | "generating" | "success" | "error";
}

const LEVEL_COLORS = {
  info: "text-muted2",
  success: "text-a2",
  warning: "text-a4",
  error: "text-a3",
};

export function GenerationLog({ entries, status }: GenerationLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card p-4 font-mono text-xs space-y-1.5 min-h-32 max-h-64 overflow-y-auto">
      {entries.length === 0 && (
        <p className="text-muted">Waiting for generation to start…</p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`animate-slideRight ${LEVEL_COLORS[entry.level]}`}
        >
          <span className="text-muted mr-2 select-none">
            {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {entry.message}
        </div>
      ))}
      {status === "generating" && (
        <div className="flex items-center gap-1 text-muted">
          <span className="animate-blink">█</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
