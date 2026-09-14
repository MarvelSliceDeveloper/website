// Single source of truth for sidebar nav colors.
//
// Both AdminSidebar and InstructorSidebar import these helpers, so the two
// sidebars can never drift apart. Active and inactive items intentionally
// share the exact same colors — to restyle sidebar navigation, edit the
// strings below and every nav item, child link, and icon in both sidebars
// updates together.
export function getNavItemColors(_isActive: boolean): string {
  return "border-transparent text-black dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-black dark:hover:text-slate-100";
}

export function getNavIconClass(_isActive: boolean): string {
  return "shrink-0";
}
