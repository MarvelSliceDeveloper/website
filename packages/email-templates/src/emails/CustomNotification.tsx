import React from "react";
import { Heading, Text, Section } from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface CustomNotificationProps {
  title: string;
  message: string;
}

export default function CustomNotification({
  title,
  message,
}: CustomNotificationProps) {
  return (
    <BaseLayout previewText={title}>
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={textStyle}>{message}</Text>
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
