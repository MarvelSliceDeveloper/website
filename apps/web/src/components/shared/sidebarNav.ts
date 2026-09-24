// Single source of truth for sidebar nav colors.
// Both AdminSidebar and InstructorSidebar import these helpers.

export function getNavItemColors(isActive: boolean): string {
  if (isActive) {
    return "border-primary bg-primary/10 text-primary dark:text-primary-foreground font-semibold shadow-2xs";
  }
  return "border-transparent text-[#1a1d29] hover:bg-slate-200/70 hover:text-[#111827] font-semibold";
}

export function getNavIconClass(isActive: boolean): string {
  if (isActive) {
    return "shrink-0 text-primary drop-shadow-[0_1px_3px_rgba(37,81,217,0.35)] transition-all duration-200 scale-105";
  }
  return "shrink-0 text-[#4b5563] group-hover:text-primary group-hover:scale-105 transition-all duration-150";
}
