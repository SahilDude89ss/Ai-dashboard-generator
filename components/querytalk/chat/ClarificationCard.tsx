"use client";

import { useState } from "react";
import { ClarificationRequest } from "@/types";

interface Props {
  clarification: ClarificationRequest;
  onAnswer: (answer: string) => void;
}

export function ClarificationCard({ clarification, onAnswer }: Props) {
  const [customAnswer, setCustomAnswer] = useState("");

  function handleSubmit() {
    const trimmed = customAnswer.trim();
    if (trimmed) {
      onAnswer(trimmed);
      setCustomAnswer("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="bg-s2 border border-DEFAULT rounded-card p-4 flex flex-col gap-3">
      <p className="text-text text-sm font-medium">{clarification.question}</p>

      {clarification.context && (
        <p className="text-muted2 text-xs">{clarification.context}</p>
      )}

      {clarification.options && clarification.options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clarification.options.map((option) => (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              className="bg-s3 hover:bg-accent/20 text-text rounded-btn px-3 py-1.5 text-sm transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a custom answer…"
          className="flex-1 bg-s3 border border-DEFAULT rounded-input px-3 py-1.5 text-sm text-text placeholder:text-muted2 focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleSubmit}
          disabled={!customAnswer.trim()}
          className="bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-btn px-3 py-1.5 text-sm transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
