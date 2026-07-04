import React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface EnrollmentApprovedProps {
  courseName: string;
  batchName: string;
}

export default function EnrollmentApproved({
  courseName,
  batchName,
}: EnrollmentApprovedProps) {
  return (
    <BaseLayout previewText={`Enrollment approved: ${courseName}`}>
      <Heading style={headingStyle}>Enrollment Approved! 🎉</Heading>
      <Text style={textStyle}>
        Great news! Your enrollment has been approved.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Course</Text>
        <Text style={valueStyle}>{courseName}</Text>
        <Text style={labelStyle}>Batch</Text>
        <Text style={valueStyle}>{batchName}</Text>
      </Section>
      <Text style={textStyle}>
        You now have full access to the course materials, live sessions, and
        recordings.
      </Text>
      <Section style={buttonContainerStyle}>
        <Button
          href={`${process.env.WEB_URL || "http://localhost:3000"}/student`}
          style={buttonStyle}
        >
          Go to Course
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
