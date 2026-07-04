import type { ReactNode } from "react";

interface PageHeaderProps {
  role: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

// Page header with role label, title, description, and action
export function PageHeader({
  role,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          {role}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
