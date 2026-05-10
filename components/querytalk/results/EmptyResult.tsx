"use client";

import { SearchX } from "lucide-react";

export function EmptyResult({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted2">
      <SearchX size={20} />
      <span className="text-sm">{message ?? "No results found"}</span>
    </div>
  );
}
