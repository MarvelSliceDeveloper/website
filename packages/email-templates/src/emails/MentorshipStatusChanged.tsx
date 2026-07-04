import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface MentorshipStatusChangedProps {
  ticketTitle: string;
  status: string;
  label: string;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "#4f46e5",
  SCHEDULED: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#dc2626",
};

export default function MentorshipStatusChanged({
  ticketTitle,
  status,
  label,
}: MentorshipStatusChangedProps) {
  const color = STATUS_COLORS[status] || "#6b7280";

  return (
    <BaseLayout
      previewText={`Mentorship update: ${label}`}
    >
      <Heading style={headingStyle}>Mentorship Update</Heading>
      <Text style={textStyle}>
        There's an update on your mentorship request.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Request</Text>
        <Text style={valueStyle}>{ticketTitle}</Text>
        <Text style={labelStyle}>New Status</Text>
        <Text style={{ ...valueStyle, color }}>{label}</Text>
      </Section>
      <Text style={textStyle}>
        {status === "COMPLETED"
          ? "Your mentorship session has been completed. We hope it was helpful!"
          : status === "CANCELLED"
            ? "This mentorship request has been cancelled."
            : "Check your dashboard for more details."}
      </Text>
    </BaseLayout>
  );
}

const headingStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const textStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const detailsContainerStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const labelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "12px 0 4px",
};

const valueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
};
