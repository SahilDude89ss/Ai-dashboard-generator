"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";

interface Props {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSubmit, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 5 + 24; // 5 rows + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    adjustHeight();
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 bg-s2 border border-DEFAULT rounded-card px-4 py-3 focus-within:border-accent transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "Ask a question about your data…"}
        rows={1}
        className="flex-1 bg-transparent text-sm text-text placeholder:text-muted2 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed leading-5"
        style={{ maxHeight: "100px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed rounded-btn transition-colors mb-0.5"
      >
        <Send size={13} className="text-white" />
      </button>
    </div>
  );
}
