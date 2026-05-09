interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                i < current
                  ? "bg-accent border-accent text-white"
                  : i === current
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-s2 border-[rgba(255,255,255,0.11)] text-muted"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                i === current ? "text-text" : i < current ? "text-muted2" : "text-muted"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-px mx-2 ${i < current ? "bg-accent" : "bg-[rgba(255,255,255,0.08)]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
