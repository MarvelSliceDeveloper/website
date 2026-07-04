import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface SessionCancelledProps {
  sessionTitle: string;
  courseName: string;
  batchName: string;
}

export default function SessionCancelled({
  sessionTitle,
  courseName,
  batchName,
}: SessionCancelledProps) {
  return (
    <BaseLayout previewText={`Session cancelled: ${sessionTitle}`}>
      <Heading style={headingStyle}>Session Cancelled</Heading>
      <Text style={textStyle}>
        The following live session has been cancelled.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Course</Text>
        <Text style={valueStyle}>{courseName}</Text>
        <Text style={labelStyle}>Batch</Text>
        <Text style={valueStyle}>{batchName}</Text>
        <Text style={labelStyle}>Session</Text>
        <Text style={valueStyle}>{sessionTitle}</Text>
      </Section>
      <Text style={textStyle}>
        You'll be notified when a new session is scheduled. Check your dashboard
        for updates.
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
  backgroundColor: "#fef2f2",
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
