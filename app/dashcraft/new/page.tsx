"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDashcraftStore } from "@/store/dashcraft";
import { StepIndicator } from "@/components/dashcraft/setup/StepIndicator";
import { SourcePicker } from "@/components/dashcraft/setup/SourcePicker";
import { LiveDbForm } from "@/components/dashcraft/setup/LiveDbForm";
import { SqlUploadZone } from "@/components/dashcraft/setup/SqlUploadZone";
import { DialectPicker } from "@/components/dashcraft/setup/DialectPicker";
import { SchemaPreview } from "@/components/dashcraft/setup/SchemaPreview";
import { PromptBox } from "@/components/dashcraft/setup/PromptBox";
import { GenerationLog } from "@/components/dashcraft/dashboard/GenerationLog";
import { WidgetSpec, Widget } from "@/types";
import Link from "next/link";

const STEPS = ["Source", "Schema", "Describe"];

type GenerationEvent =
  | { type: "log"; message: string; level: "info" | "success" | "warning" | "error" }
  | { type: "widget"; widget: WidgetSpec }
  | { type: "done"; totalWidgets: number }
  | { type: "error"; message: string };

export default function NewPage() {
  const router = useRouter();
  const { sourceType, schema, dialect, prompt, setSourceType, connectionConfig } = useDashcraftStore();
  const {
    startGeneration,
    addLogEntry,
    addWidget,
    setGenerationStatus,
    saveDashboard,
    generationLog,
    generationStatus,
  } = useDashcraftStore();

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleSourceSelect = (type: "live" | "dump") => {
    setSourceType(type);
  };

  const handleSchemaReady = () => {
    setStep(1);
  };

  const handleGenerate = useCallback(async () => {
    if (!schema || !prompt.trim()) return;
    setGenerating(true);

    const dashboardId = startGeneration(schema, prompt, dialect);
    setGenerationStatus("generating");
    setStep(2);

    try {
      const res = await fetch("/api/dashcraft/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema, prompt, dialect, widgetCount: 7 }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as GenerationEvent;
            if (event.type === "log") {
              addLogEntry({ message: event.message, level: event.level });
            } else if (event.type === "widget") {
              const widget: Widget = { ...event.widget, status: "idle" };
              addWidget(widget);
            } else if (event.type === "done") {
              setGenerationStatus("success");
            } else if (event.type === "error") {
              addLogEntry({ message: event.message, level: "error" });
              setGenerationStatus("error");
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      addLogEntry({
        message: err instanceof Error ? err.message : "Generation failed",
        level: "error",
      });
      setGenerationStatus("error");
    } finally {
      setGenerating(false);
      saveDashboard();

      // Navigate to dashboard
      setTimeout(() => {
        router.push(`/dashcraft/dashboard/${dashboardId}`);
      }, 800);
    }
  }, [schema, prompt, dialect, startGeneration, addLogEntry, addWidget, setGenerationStatus, saveDashboard, router]);

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashcraft" className="text-muted2 hover:text-text text-sm transition-colors">
            ← Dashcraft
          </Link>
          <StepIndicator steps={STEPS} current={step} />
        </div>

        {/* Step 0: Source */}
        {step === 0 && (
          <div className="animate-fadeUp space-y-6">
            <div>
              <h1 className="text-2xl font-black text-text mb-1">Connect your data</h1>
              <p className="text-muted2 text-sm">Choose how to provide your database schema.</p>
            </div>

            <SourcePicker onSelect={handleSourceSelect} />

            {sourceType === "live" && (
              <div className="animate-fadeIn">
                <LiveDbForm onConnected={handleSchemaReady} />
              </div>
            )}

            {sourceType === "dump" && (
              <div className="animate-fadeIn space-y-4">
                <DialectPicker />
                <SqlUploadZone onParsed={handleSchemaReady} />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Schema Preview + Describe */}
        {step === 1 && schema && (
          <div className="animate-fadeUp space-y-6">
            <div>
              <h1 className="text-2xl font-black text-text mb-1">Schema looks good?</h1>
              <p className="text-muted2 text-sm">Review the detected tables, then describe what you want.</p>
            </div>

            <div className="bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card p-5">
              <SchemaPreview schema={schema} />
              <button
                onClick={() => setStep(0)}
                className="mt-3 text-xs text-muted hover:text-muted2 transition-colors"
              >
                Looks wrong? Re-upload ↑
              </button>
            </div>

            <div className="bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card p-5">
              <h2 className="text-sm font-bold text-text mb-3">Describe your dashboard</h2>
              <PromptBox onSubmit={handleGenerate} loading={generating} />
            </div>
          </div>
        )}

        {/* Step 2: Generation log */}
        {step === 2 && (
          <div className="animate-fadeUp space-y-4">
            <div>
              <h1 className="text-2xl font-black text-text mb-1">Generating dashboard…</h1>
              <p className="text-muted2 text-sm">Claude is writing SQL for each widget.</p>
            </div>
            <GenerationLog entries={generationLog} status={generationStatus} />
            {generationStatus === "success" && (
              <p className="text-a2 text-sm text-center animate-fadeIn">
                ✅ Redirecting to your dashboard…
              </p>
            )}
            {generationStatus === "error" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-a3 text-sm">Generation failed. Check the log above.</p>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-accent hover:underline"
                >
                  ← Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
