"use client";

import type { ReactNode, ComponentType } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ size?: number; stroke?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="mx-auto mb-4 flex items-center justify-center text-muted">
        <Icon size={48} stroke={1.2} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
