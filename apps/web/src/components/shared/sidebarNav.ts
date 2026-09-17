// Single source of truth for sidebar nav colors.
// Both AdminSidebar and InstructorSidebar import these helpers.

export function getNavItemColors(isActive: boolean): string {
  if (isActive) {
    return "border-primary bg-primary/10 text-primary dark:text-primary-foreground font-semibold shadow-2xs";
  }
  return "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-foreground font-medium";
}

export function getNavIconClass(isActive: boolean): string {
  if (isActive) {
    return "shrink-0 text-primary drop-shadow-[0_1px_3px_rgba(37,81,217,0.35)] transition-all duration-200 scale-105";
  }
  return "shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:scale-105 transition-all duration-150";
}
