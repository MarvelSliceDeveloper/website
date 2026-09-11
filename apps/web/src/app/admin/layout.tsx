import AdminShell from "@/components/AdminShell";
import LoadingPage from "@/components/LoadingPage";
import { Suspense } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingPage fullScreen />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
