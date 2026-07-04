import { Suspense } from "react";
import InstructorAssignmentsContent from "./_components/InstructorAssignmentsContent";

export default function InstructorAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading assignments...</p>
        </div>
      }
    >
      <InstructorAssignmentsContent />
    </Suspense>
  );
}
