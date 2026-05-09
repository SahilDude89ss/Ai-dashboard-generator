import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`bg-s1 border border-[rgba(255,255,255,0.06)] rounded-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}
