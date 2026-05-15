"use client";

import { useState, useEffect } from "react";
import { MentorshipRequestModal } from "@/components/mentorship/MentorshipRequestModal";
import { MentorshipTickets } from "@/components/mentorship/MentorshipTickets";
import { api } from "@/lib/api";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  preferredDate?: string;
  preferredTime?: string;
  scheduledAt?: string;
  joinUrl?: string;
  createdAt: string;
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MentorshipPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{ tickets?: Ticket[] }>("/api/mentorship/tickets/my");
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitRequest = async (data: {
    title: string;
    description: string;
    preferredDate?: string;
    preferredTime?: string;
  }) => {
    await api.post("/api/mentorship/tickets", data);

    // Refresh tickets after successful submission
    await fetchTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            1-on-1 Mentorship
          </h1>
          <p className="text-sm text-muted mt-1">
            Request personalized mentorship sessions with our expert instructors
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Request Session
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Requests"
          value={tickets.length}
          icon="📝"
          color="from-primary to-violet-500"
        />
        <StatCard
          label="Pending"
          value={tickets.filter((t) => t.status === "OPEN").length}
          icon="⏳"
          color="from-warning to-amber-400"
        />
        <StatCard
          label="Scheduled"
          value={tickets.filter((t) => t.status === "SCHEDULED").length}
          icon="📅"
          color="from-success to-emerald-400"
        />
        <StatCard
          label="Completed"
          value={tickets.filter((t) => t.status === "COMPLETED").length}
          icon="✅"
          color="from-accent to-cyan-400"
        />
      </div>

      {/* Tickets List */}
      <div className="glass-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Your Mentorship Requests
          </h2>
        </div>
        <div className="p-6">
          <MentorshipTickets
            tickets={tickets}
            isLoading={isLoading}
            onRefresh={fetchTickets}
          />
        </div>
      </div>



      {/* Modal */}
      <MentorshipRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-lg opacity-80`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


