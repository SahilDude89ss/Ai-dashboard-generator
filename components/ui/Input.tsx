import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-muted2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-s2 border ${error ? "border-a3/50" : "border-[rgba(255,255,255,0.11)]"} text-text rounded-input px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-a3">{error}</p>}
    </div>
  );
}
