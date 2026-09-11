import InstructorShell from "@/components/InstructorShell";
import LoadingPage from "@/components/LoadingPage";
import { Suspense } from "react";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingPage fullScreen />}>
      <InstructorShell>{children}</InstructorShell>
    </Suspense>
  );
}
