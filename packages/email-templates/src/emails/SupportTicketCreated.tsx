import React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface SupportTicketCreatedProps {
  ticketTitle: string;
}

export default function SupportTicketCreated({
  ticketTitle,
}: SupportTicketCreatedProps) {
  return (
    <BaseLayout previewText={`Support ticket created: ${ticketTitle}`}>
      <Heading style={headingStyle}>Support Ticket Submitted</Heading>
      <Text style={textStyle}>
        Your support ticket has been submitted successfully.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Ticket</Text>
        <Text style={valueStyle}>{ticketTitle}</Text>
        <Text style={labelStyle}>Status</Text>
        <Text style={valueStyle}>Open</Text>
      </Section>
      <Text style={textStyle}>
        Our team will review your ticket and respond shortly. You'll receive an
        email when there's a reply.
      </Text>
      <Section style={buttonContainerStyle}>
        <Button
          href={`${process.env.WEB_URL || "http://localhost:3000"}/student`}
          style={buttonStyle}
        >
          View Ticket
        </Button>
      </Section>
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

const buttonContainerStyle: React.CSSProperties = {
  margin: "24px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
