import React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface ManualOrderRejectedProps {
  userName: string;
  courseName: string;
  reason: string;
}

export default function ManualOrderRejected({
  userName,
  courseName,
  reason,
}: ManualOrderRejectedProps) {
  return (
    <BaseLayout previewText={`Payment update: ${courseName}`}>
      <Heading style={headingStyle}>Payment Needs Attention</Heading>
      <Text style={textStyle}>
        Hi {userName}, your UPI payment submission for{" "}
        <strong>{courseName}</strong> could not be approved.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Reason</Text>
        <Text style={valueStyle}>{reason}</Text>
      </Section>
      <Text style={textStyle}>
        Please double-check your transaction ID and submit again, or contact
        support if you believe this is a mistake.
      </Text>
      <Section style={buttonContainerStyle}>
        <Button
          href={`${process.env.WEB_URL || "http://localhost:3000"}/student`}
          style={buttonStyle}
        >
          Go to Student Portal
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
