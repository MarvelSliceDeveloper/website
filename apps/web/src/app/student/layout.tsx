import StudentShell from "@/components/StudentShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentShell>{children}</StudentShell>
  );
}
