import { type ComponentType, createElement, type ReactNode } from "react";

interface GlassEmptyStateProps {
  icon: ComponentType<{ size?: number | string; stroke?: number | string }>;
  variant: "glass";
  title: string;
  description?: string;
  action?: ReactNode;
}

interface DefaultEmptyStateProps {
  icon: ReactNode;
  variant?: "default";
  title: string;
  description?: string;
  action?: ReactNode;
}

type EmptyStateProps = GlassEmptyStateProps | DefaultEmptyStateProps;

// Empty state placeholder with icon, title, and optional action
export function EmptyState(props: EmptyStateProps) {
  const { title, description, action, variant = "default" } = props;
  const containerClass =
    variant === "glass"
      ? "glass-card p-12 text-center"
      : "flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/50 py-20 text-center";

  return (
    <div className={containerClass}>
      {variant === "glass" ? (
        <div className="mx-auto mb-4 flex items-center justify-center text-muted">
          {createElement((props as GlassEmptyStateProps).icon, {
            size: 48,
            stroke: 1.2,
          })}
        </div>
      ) : (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {(props as DefaultEmptyStateProps).icon}
        </div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
