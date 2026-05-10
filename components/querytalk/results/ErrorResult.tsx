"use client";

import { AlertCircle } from "lucide-react";

export function ErrorResult({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-a3/10 border border-a3/20 rounded-card p-3 flex items-start gap-2">
      <AlertCircle size={16} className="text-a3 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-a3 text-sm">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="self-start text-xs bg-a3/20 hover:bg-a3/30 text-a3 rounded-btn px-2 py-1 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
