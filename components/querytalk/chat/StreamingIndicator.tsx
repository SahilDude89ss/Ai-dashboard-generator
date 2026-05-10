"use client";

// Animated dots indicator shown while planning/executing
export function StreamingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted2 text-sm">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}
