import {
  IconBell,
  IconEye,
  IconCheck,
  IconX,
  IconHelp,
  IconMessage,
  IconSend,
} from "@tabler/icons-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  SESSION_SCHEDULED: <IconBell size={16} />,
  SESSION_CANCELLED: <IconX size={16} />,
  RECORDING_AVAILABLE: <IconEye size={16} />,
  ENROLLMENT_APPROVED: <IconCheck size={16} />,
  ENROLLMENT_REJECTED: <IconX size={16} />,
  ASSIGNMENT_GRADED: <IconBell size={16} />,
  SUPPORT_TICKET_CREATED: <IconHelp size={16} />,
  SUPPORT_TICKET_RESPONDED: <IconMessage size={16} />,
  SUPPORT_TICKET_STATUS_CHANGED: <IconCheck size={16} />,
  CUSTOM_NOTIFICATION: <IconSend size={16} />,
};

const COLOR_MAP: Record<string, string> = {
  SESSION_SCHEDULED: "bg-primary/20 text-primary",
  SESSION_CANCELLED: "bg-danger/20 text-danger",
  RECORDING_AVAILABLE: "bg-accent/20 text-accent",
  ENROLLMENT_APPROVED: "bg-success/20 text-success",
  ENROLLMENT_REJECTED: "bg-danger/20 text-danger",
  ASSIGNMENT_GRADED: "bg-primary/20 text-primary",
  SUPPORT_TICKET_CREATED: "bg-primary/20 text-primary",
  SUPPORT_TICKET_RESPONDED: "bg-accent/20 text-accent",
  SUPPORT_TICKET_STATUS_CHANGED: "bg-success/20 text-success",
  CUSTOM_NOTIFICATION: "bg-primary/20 text-primary",
};

interface Props {
  type: string;
  className?: string;
  withContainer?: boolean;
}

// Notification icon with type-specific color and icon
export function NotificationIcon({
  type,
  className = "",
  withContainer = true,
}: Props) {
  const icon = ICON_MAP[type] ?? <IconBell size={16} />;
  const colors = COLOR_MAP[type] ?? "bg-muted/20 text-muted-foreground";

  if (!withContainer) {
    return <span className={className}>{icon}</span>;
  }

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full ${colors} ${className}`}
    >
      {icon}
    </div>
  );
}
