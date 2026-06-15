import { Suspense } from "react";
import InstructorAssignmentsContent from "./_components/InstructorAssignmentsContent";

export default function InstructorAssignmentsPage() {
    return (
        <Suspense fallback={<div className="glass-card p-12 text-center text-sm text-muted animate-pulse">Loading dashboard content...</div>}>
            <InstructorAssignmentsContent />
        </Suspense>
    );
}