import React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface RecordingAvailableProps {
  sessionTitle: string;
  courseName: string;
  batchName: string;
  recordingUrl?: string;
}

export default function RecordingAvailable({
  sessionTitle,
  courseName,
  batchName,
  recordingUrl,
}: RecordingAvailableProps) {
  return (
    <BaseLayout
      previewText={`Recording available: ${sessionTitle}`}
    >
      <Heading style={headingStyle}>Recording Available</Heading>
      <Text style={textStyle}>
        The recording for a recent live session is now available.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Course</Text>
        <Text style={valueStyle}>{courseName}</Text>
        <Text style={labelStyle}>Batch</Text>
        <Text style={valueStyle}>{batchName}</Text>
        <Text style={labelStyle}>Session</Text>
        <Text style={valueStyle}>{sessionTitle}</Text>
      </Section>
      {recordingUrl && (
        <Section style={buttonContainerStyle}>
          <Button href={recordingUrl} style={buttonStyle}>
            Watch Recording
          </Button>
        </Section>
      )}
      <Text style={textStyle}>
        You can also access the recording from your course dashboard.
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
  backgroundColor: "#f0fdf4",
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
