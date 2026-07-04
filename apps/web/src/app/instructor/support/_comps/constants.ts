export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

export interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string; email: string; role?: string };
  _count?: { messages: number };
  messages?: SupportMessage[];
}

export type TicketStatus = SupportTicket["status"];

export type FilterTab = "all" | "open" | "in_progress" | "resolved" | "closed";

export interface FilterTabDef {
  key: FilterTab;
  label: string;
  status?: TicketStatus;
}

export const FILTER_TABS: FilterTabDef[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open", status: "OPEN" },
  { key: "in_progress", label: "In Progress", status: "IN_PROGRESS" },
  { key: "resolved", label: "Resolved", status: "RESOLVED" },
  { key: "closed", label: "Closed", status: "CLOSED" },
];

export const STATUS_CONFIG: Record<string, { label: string; classes: string }> =
  {
    OPEN: {
      label: "Open",
      classes: "border-warning/30 bg-warning/10 text-warning",
    },
    IN_PROGRESS: {
      label: "In Progress",
      classes: "border-accent/30 bg-accent/10 text-accent",
    },
    RESOLVED: {
      label: "Resolved",
      classes: "border-success/30 bg-success/10 text-success",
    },
    CLOSED: {
      label: "Closed",
      classes: "border-muted/30 bg-muted/10 text-muted",
    },
  };
