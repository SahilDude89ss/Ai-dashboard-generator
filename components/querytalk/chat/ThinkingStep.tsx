"use client";

import { Sparkles } from "lucide-react";

interface Props {
  thinking: string;
}

export function ThinkingStep({ thinking }: Props) {
  return (
    <div className="bg-s2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-muted2">
      <Sparkles size={12} className="text-accent flex-shrink-0" />
      <span>{thinking}</span>
    </div>
  );
}
