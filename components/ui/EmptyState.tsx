interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && <div className="text-muted mb-4 text-4xl">{icon}</div>}
      <h3 className="text-text font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-muted2 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
