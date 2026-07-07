import type { ComponentType } from "react";

export type NavItemChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number | string;
    stroke?: number | string;
    className?: string;
  }>;
  badge?: number;
  children?: NavItemChild[];
};
