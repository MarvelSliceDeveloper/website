import React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface SessionScheduledProps {
  sessionTitle: string;
  scheduledAt: string;
  joinUrl: string;
  courseName: string;
  batchName: string;
}

export default function SessionScheduled({
  sessionTitle,
  scheduledAt,
  joinUrl,
  courseName,
  batchName,
}: SessionScheduledProps) {
  return (
    <BaseLayout previewText={`Live session scheduled: ${sessionTitle}`}>
      <Heading style={headingStyle}>Live Session Scheduled</Heading>
      <Text style={textStyle}>
        A new live session has been scheduled for your course.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Course</Text>
        <Text style={valueStyle}>{courseName}</Text>
        <Text style={labelStyle}>Batch</Text>
        <Text style={valueStyle}>{batchName}</Text>
        <Text style={labelStyle}>Session</Text>
        <Text style={valueStyle}>{sessionTitle}</Text>
        <Text style={labelStyle}>Scheduled At</Text>
        <Text style={valueStyle}>{scheduledAt}</Text>
      </Section>
      <Section style={buttonContainerStyle}>
        <Button href={joinUrl} style={buttonStyle}>
          Join Session
        </Button>
      </Section>
      <Text style={textStyle}>
        Please make sure to join on time. The session link will be available in
        your dashboard as well.
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

const buttonContainerStyle: React.CSSProperties = {
  margin: "24px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
