"use client";
import { useDashcraftStore } from "@/store/dashcraft";

const EXAMPLE_PROMPTS = [
  "Show me revenue trends, top customers, and payment breakdown",
  "Give me a sales dashboard with KPIs, product performance, and order status",
  "Build an executive summary with MRR, churn indicators, and top accounts",
  "Show user growth, conversion rates, and plan distribution",
];

interface PromptBoxProps {
  onSubmit: () => void;
  loading?: boolean;
}

export function PromptBox({ onSubmit, loading = false }: PromptBoxProps) {
  const { prompt, setPrompt } = useDashcraftStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          placeholder="Describe the dashboard you want…"
          rows={4}
          className="w-full bg-s2 border border-[rgba(255,255,255,0.11)] text-text rounded-card px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-[10px] text-muted">
          {prompt.length}/500
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrompt(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-s2 border border-[rgba(255,255,255,0.08)] text-muted2 hover:text-text hover:border-[rgba(255,255,255,0.2)] transition-colors"
          >
            {p.slice(0, 42)}…
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!prompt.trim() || loading}
        className="w-full bg-accent text-white font-bold py-3 rounded-btn hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
      >
        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        Generate Dashboard →
      </button>
    </form>
  );
}
