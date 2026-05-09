import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-bold rounded-btn transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-accent text-white hover:bg-opacity-90 border border-accent",
    secondary: "bg-s2 text-text border border-[rgba(255,255,255,0.11)] hover:border-[rgba(255,255,255,0.2)]",
    ghost: "bg-transparent text-muted2 hover:text-text hover:bg-s2 border border-transparent",
    danger: "bg-a3/10 text-a3 border border-a3/30 hover:bg-a3/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
