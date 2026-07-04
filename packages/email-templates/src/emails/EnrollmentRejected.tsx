import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface EnrollmentRejectedProps {
  courseName: string;
  reason?: string;
}

export default function EnrollmentRejected({
  courseName,
  reason,
}: EnrollmentRejectedProps) {
  return (
    <BaseLayout
      previewText={`Enrollment update: ${courseName}`}
    >
      <Heading style={headingStyle}>Enrollment Update</Heading>
      <Text style={textStyle}>
        We've reviewed your enrollment request for the following course.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Course</Text>
        <Text style={valueStyle}>{courseName}</Text>
        <Text style={labelStyle}>Status</Text>
        <Text style={{ ...valueStyle, color: "#dc2626" }}>Not Approved</Text>
      </Section>
      {reason && (
        <Section style={reasonContainerStyle}>
          <Text style={labelStyle}>Reason</Text>
          <Text style={textStyle}>{reason}</Text>
        </Section>
      )}
      <Text style={textStyle}>
        If you believe this is an error, please contact our support team for assistance.
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

const reasonContainerStyle: React.CSSProperties = {
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
