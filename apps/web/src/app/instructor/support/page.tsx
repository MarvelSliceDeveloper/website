"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import SupportTicketList from "./_comps/SupportTicketList";
import SupportTicketDetail from "./_comps/SupportTicketDetail";
import CreateTicketForm from "./_comps/CreateTicketForm";
import { usePageTitle } from "@/lib/use-page-title";

export default function InstructorSupportPage() {
  usePageTitle("Support");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (selectedTicketId) {
    return (
      <SupportTicketDetail
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  return (
    <div className="w-full space-y-8 p-6">
      <AdminPageHeader
        title="Support"
        breadcrumbs={[{ label: "Support", href: "/instructor/support" }]}
        role="Instructor"
        description="Report issues or ask questions. Admin will review and respond."
        action={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="btn-primary"
          >
            {showCreate ? "Cancel" : "New Ticket"}
          </button>
        }
      />

      {showCreate && (
        <CreateTicketForm
          onSuccess={() => {
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {!showCreate && (
        <SupportTicketList
          onSelectTicket={(id) => setSelectedTicketId(id)}
          onNewTicket={() => setShowCreate(true)}
        />
      )}
    </div>
  );
}