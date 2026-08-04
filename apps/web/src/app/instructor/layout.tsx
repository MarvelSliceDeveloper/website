import InstructorShell from "@/components/InstructorShell";
import { Suspense } from "react";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <InstructorShell>{children}</InstructorShell>
    </Suspense>
  );
}
