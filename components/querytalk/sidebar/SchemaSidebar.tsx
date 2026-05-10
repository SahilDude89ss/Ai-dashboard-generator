"use client";

import { DbSchema } from "@/types";
import { Database } from "lucide-react";
import { TableTree } from "./TableTree";

interface Props {
  schema: DbSchema;
  isOpen: boolean;
}

export function SchemaSidebar({ schema, isOpen }: Props) {
  return (
    <div
      className={`w-60 bg-s1 border-r border-DEFAULT flex-col ${isOpen ? "flex" : "hidden"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-DEFAULT flex-shrink-0">
        <Database size={14} className="text-accent flex-shrink-0" />
        <span className="text-text text-xs font-medium flex-1">Schema</span>
        <span className="text-muted2 text-xs">{schema.tables.length} tables</span>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto">
        {schema.tables.map((table) => (
          <TableTree key={table.name} table={table} />
        ))}
      </div>
    </div>
  );
}
