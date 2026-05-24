import InstructorShell from "@/components/InstructorShell";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstructorShell>{children}</InstructorShell>
  );
}
