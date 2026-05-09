"use client";
import { DbDialect } from "@/types";
import { useSetupStore } from "@/store/setup";

const DIALECTS: { id: DbDialect; label: string; emoji: string }[] = [
  { id: "postgresql", label: "PostgreSQL", emoji: "🐘" },
  { id: "mysql", label: "MySQL", emoji: "🐬" },
  { id: "sqlite", label: "SQLite", emoji: "📦" },
];

interface DialectPickerProps {
  onChange?: (dialect: DbDialect) => void;
}

export function DialectPicker({ onChange }: DialectPickerProps) {
  const { dialect, setDialect } = useSetupStore();

  const handleSelect = (d: DbDialect) => {
    setDialect(d);
    onChange?.(d);
  };

  return (
    <div className="flex gap-3">
      {DIALECTS.map((d) => (
        <button
          key={d.id}
          onClick={() => handleSelect(d.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-card border-2 font-semibold text-sm transition-all ${
            dialect === d.id
              ? "border-accent bg-accent/10 text-accent"
              : "border-[rgba(255,255,255,0.08)] bg-s1 text-muted2 hover:border-[rgba(255,255,255,0.2)]"
          }`}
        >
          <span>{d.emoji}</span>
          {d.label}
        </button>
      ))}
    </div>
  );
}
