// Student portal layout — pass-through only.
// StudentPortalShell is embedded directly in page.tsx so it can
// react to view-stack state (back button, breadcrumbs).
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
