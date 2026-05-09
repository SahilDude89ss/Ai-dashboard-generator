"use client";
import { useState } from "react";
import { DbSchema, TableDef } from "@/types";
import { ChevronDown, ChevronRight, Search, Key, Link } from "lucide-react";

interface SchemaPreviewProps {
  schema: DbSchema;
}

function TableRow({ table }: { table: TableDef }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[rgba(255,255,255,0.06)] rounded-input overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-s2 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-muted2" /> : <ChevronRight size={14} className="text-muted2" />}
          <span className="font-mono text-sm text-text font-medium">{table.name}</span>
          <span className="text-xs text-muted">{table.columns.length} cols</span>
        </div>
        {table.rowEstimate !== undefined && (
          <span className="text-[10px] text-muted bg-s3 px-1.5 py-0.5 rounded">
            ~{table.rowEstimate.toLocaleString()} rows
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-s2 divide-y divide-[rgba(255,255,255,0.04)]">
          {table.columns.map((col) => (
            <div key={col.name} className="flex items-center gap-2 px-4 py-1.5">
              <span className="font-mono text-xs text-muted2 flex-1">{col.name}</span>
              <span className="text-[10px] text-muted bg-s3 px-1 py-0.5 rounded font-mono">{col.type}</span>
              {col.isPrimaryKey && <Key size={10} className="text-a4" />}
              {col.isForeignKey && <Link size={10} className="text-a5" />}
              {!col.nullable && <span className="text-[9px] text-muted">NOT NULL</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  const [search, setSearch] = useState("");
  const filtered = schema.tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted2">
        <span className="text-a2 font-semibold">{schema.tables.length} tables</span>
        <span>·</span>
        <span>{schema.tables.reduce((s, t) => s + t.columns.length, 0)} columns</span>
        <span>·</span>
        <span>{schema.sourceType === "live" ? "Live DB" : "SQL Dump"}</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Filter tables…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-s2 border border-[rgba(255,255,255,0.11)] text-text rounded-input pl-8 pr-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {filtered.map((table) => (
          <TableRow key={table.name} table={table} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-sm text-center py-4">No tables match &ldquo;{search}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
