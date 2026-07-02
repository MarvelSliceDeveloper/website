import type { ReactNode } from "react";
import { IconChevronRight } from "@tabler/icons-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href: string }[];
  role?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  breadcrumbs,
  role = "Admin",
}: AdminPageHeaderProps) {
  return (
    <div>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <IconChevronRight size={14} />}
              <a href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </a>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            {role}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
