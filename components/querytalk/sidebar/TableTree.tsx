"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Key, Link } from "lucide-react";
import { TableDef } from "@/types";

export function TableTree({ table }: { table: TableDef }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-s2 transition-colors text-left w-full group"
      >
        {expanded ? (
          <ChevronDown size={12} className="text-muted2 flex-shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-muted2 flex-shrink-0" />
        )}
        <span className="text-text text-xs font-medium truncate flex-1">
          {table.name}
        </span>
        <span className="text-muted2 text-xs flex-shrink-0">
          {table.columns.length}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col pl-6 pb-1">
          {table.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-2 px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-1 flex-shrink-0">
                {col.isPrimaryKey && (
                  <Key size={10} className="text-a4" />
                )}
                {col.isForeignKey && !col.isPrimaryKey && (
                  <Link size={10} className="text-a5" />
                )}
                {!col.isPrimaryKey && !col.isForeignKey && (
                  <span className="w-2.5" />
                )}
              </div>
              <span className="text-text truncate flex-1">{col.name}</span>
              <span className="text-muted2 flex-shrink-0">{col.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
