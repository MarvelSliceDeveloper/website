import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface AssignmentGradedProps {
  assignmentTitle: string;
  grade?: string;
  feedback?: string;
}

export default function AssignmentGraded({
  assignmentTitle,
  grade,
  feedback,
}: AssignmentGradedProps) {
  return (
    <BaseLayout
      previewText={`Assignment graded: ${assignmentTitle}`}
    >
      <Heading style={headingStyle}>Assignment Graded</Heading>
      <Text style={textStyle}>
        Your assignment has been reviewed and graded.
      </Text>
      <Section style={detailsContainerStyle}>
        <Text style={labelStyle}>Assignment</Text>
        <Text style={valueStyle}>{assignmentTitle}</Text>
        {grade && (
          <>
            <Text style={labelStyle}>Grade</Text>
            <Text style={{ ...valueStyle, color: "#059669", fontSize: "20px" }}>{grade}</Text>
          </>
        )}
      </Section>
      {feedback && (
        <Section style={feedbackContainerStyle}>
          <Text style={labelStyle}>Feedback</Text>
          <Text style={textStyle}>{feedback}</Text>
        </Section>
      )}
      <Text style={textStyle}>
        Check your dashboard for detailed feedback and scores.
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

const feedbackContainerStyle: React.CSSProperties = {
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
