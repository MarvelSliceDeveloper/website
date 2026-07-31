"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { IconHelp, IconMessage, IconSearch } from "@tabler/icons-react";
import type { SupportTicket, FilterTab } from "./constants";
import { FILTER_TABS, STATUS_CONFIG } from "./constants";

interface SupportTicketListProps {
  onSelectTicket: (ticketId: string) => void;
  onNewTicket: () => void;
}

export default function SupportTicketList({
  onSelectTicket,
  onNewTicket,
}: SupportTicketListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<{ tickets: SupportTicket[] }>(
        "/api/tickets?type=SUPPORT",
      );
      setTickets(data.tickets || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .get<{ tickets: SupportTicket[] }>("/api/tickets?type=SUPPORT")
      .then((data) => {
        setTickets(data.tickets || []);
      })
      .catch(() => { })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const countsByTab = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: tickets.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    tickets.forEach((t) => {
      const key = t.status.toLowerCase() as FilterTab;
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    const activeDef = FILTER_TABS.find((t) => t.key === activeTab);
    if (activeDef?.status) {
      result = result.filter((t) => t.status === activeDef.status);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tickets, activeTab, searchQuery]);

  const showEmpty = !loading && tickets.length === 0;
  const showNoResults =
    !loading && tickets.length > 0 && filteredTickets.length === 0;

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border/50">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground"
              }`}
          >
            {label}
            <span className="text-xs text-muted-foreground/60">
              ({countsByTab[key]})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickets..."
          className="field w-full"
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-card-hover h-24 border border-border/60"
            />
          ))}
        </div>
      )}

      {/* Empty state — no tickets at all */}
      {showEmpty && (
        <EmptyState
          icon={<IconHelp size={28} />}
          title="No support tickets"
          description="Create a ticket and admin will help you out."
          action={
            <button onClick={onNewTicket} className="btn-primary text-sm">
              Create Ticket
            </button>
          }
        />
      )}

      {/* Empty state — no results for current filter/search */}
      {showNoResults && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <IconSearch size={22} />
          </div>
          <p className="font-semibold text-foreground">
            No tickets match your search
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filter or search query.
          </p>
        </div>
      )}

      {/* Ticket cards */}
      {!loading && filteredTickets.length > 0 && (
        <div className="space-y-2.5">
          {filteredTickets.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className="w-full flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:bg-card-hover hover:border-border"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0 mt-0.5">
                <IconHelp size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.title}
                  </p>
                  <StatusBadge status={t.status} config={STATUS_CONFIG} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {t.description}
                </p>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted">
                  <span>{timeAgo(t.createdAt)}</span>
                  {t._count && (
                    <span className="flex items-center gap-1">
                      <IconMessage size={12} /> {t._count.messages}{" "}
                      {t._count.messages === 1 ? "message" : "messages"}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
