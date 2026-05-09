"use client";
import { Database, FileText } from "lucide-react";
import { useSetupStore } from "@/store/setup";

interface SourcePickerProps {
  onSelect: (type: "live" | "dump") => void;
}

export function SourcePicker({ onSelect }: SourcePickerProps) {
  const { sourceType } = useSetupStore();

  const options = [
    {
      id: "live" as const,
      icon: <Database size={28} />,
      title: "Live Database",
      description: "Connect directly to PostgreSQL, MySQL, or SQLite. Get real-time data.",
      badge: "Real-time",
    },
    {
      id: "dump" as const,
      icon: <FileText size={28} />,
      title: "SQL Dump",
      description: "Upload a .sql file. Extract schema without a live connection.",
      badge: "Offline",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`text-left p-6 rounded-card border-2 transition-all duration-200 ${
            sourceType === opt.id
              ? "border-accent bg-accent/5"
              : "border-[rgba(255,255,255,0.08)] bg-s1 hover:border-[rgba(255,255,255,0.2)]"
          }`}
        >
          <div className={`mb-3 ${sourceType === opt.id ? "text-accent" : "text-muted2"}`}>{opt.icon}</div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-text font-bold text-base">{opt.title}</h3>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-s3 text-muted2">{opt.badge}</span>
          </div>
          <p className="text-muted2 text-sm leading-relaxed">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
