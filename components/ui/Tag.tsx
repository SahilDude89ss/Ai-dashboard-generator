interface TagProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "muted";
}

export function Tag({ children, variant = "muted" }: TagProps) {
  const variants = {
    primary: "bg-accent/10 text-accent border-accent/20",
    success: "bg-a2/10 text-a2 border-a2/20",
    warning: "bg-a4/10 text-a4 border-a4/20",
    danger: "bg-a3/10 text-a3 border-a3/20",
    muted: "bg-s2 text-muted2 border-[rgba(255,255,255,0.08)]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
