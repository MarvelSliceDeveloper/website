import React from "react";
import {
  Heading,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
} from "@react-email/components";
import BaseLayout from "./BaseLayout";

interface WelcomeEmailProps {
  userName: string;
  credentials?: { email: string; password: string };
}

export default function WelcomeEmail({
  userName,
  credentials,
}: WelcomeEmailProps) {
  return (
    <BaseLayout previewText={`Welcome to LMS Portal, ${userName}!`}>
      <Section style={bodyStyle}>
        <Heading style={headingStyle}>Welcome, {userName}!</Heading>
        <Text style={textStyle}>
          We're excited to have you on board. Your account is ready, and your
          learning journey starts now.
        </Text>

        {credentials && (
          <>
            <Section style={credBoxStyle}>
              <Text style={credTitleStyle}>Your Login Credentials</Text>
              <Text style={credFieldStyle}>
                <strong>Email:</strong> {credentials.email}
              </Text>
              <Text style={credFieldStyle}>
                <strong>Password:</strong> {credentials.password}
              </Text>
              <Section style={buttonContainerStyle}>
                <Button
                  href={`${process.env.WEB_URL || "http://localhost:3000"}/login`}
                  style={buttonStyle}
                >
                  Log In to Your Account
                </Button>
              </Section>
              <Text style={credNoteStyle}>
                For security, please set your own password after logging in.
              </Text>
            </Section>
            <Hr style={dividerStyle} />
          </>
        )}

        <Text style={sectionLabelStyle}>Here's what you can do next</Text>

        <Row style={listRowStyle}>
          <Column style={iconColStyle}>📚</Column>
          <Column style={listTextColStyle}>Browse and enroll in courses</Column>
        </Row>
        <Hr style={dividerStyle} />
        <Row style={listRowStyle}>
          <Column style={iconColStyle}>🎥</Column>
          <Column style={listTextColStyle}>
            Watch live sessions and recordings
          </Column>
        </Row>
        <Hr style={dividerStyle} />
        <Row style={listRowStyle}>
          <Column style={iconColStyle}>📝</Column>
          <Column style={listTextColStyle}>
            Complete assignments and quizzes
          </Column>
        </Row>
        <Hr style={dividerStyle} />
        <Row style={listRowStyle}>
          <Column style={iconColStyle}>💬</Column>
          <Column style={listTextColStyle}>Get mentorship support</Column>
        </Row>

        <Section style={buttonContainerStyle}>
          <Button
            href={`${process.env.WEB_URL || "http://localhost:3000"}/student`}
            style={buttonStyle}
          >
            Go to dashboard
          </Button>
        </Section>

        <Text style={footerTextStyle}>
          Questions? Reach out to our support team anytime.
        </Text>
      </Section>
    </BaseLayout>
  );
}

const bodyStyle: React.CSSProperties = {
  padding: "0",
};

const headingStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const textStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 12px",
};

const sectionLabelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "24px 0 12px",
};

const listRowStyle: React.CSSProperties = {
  padding: "6px 0",
};

const iconColStyle: React.CSSProperties = {
  width: "28px",
  fontSize: "16px",
  verticalAlign: "top",
};

const listTextColStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.5",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#f3f4f6",
  margin: "0",
};

const buttonContainerStyle: React.CSSProperties = {
  margin: "28px 0 20px",
  textAlign: "center",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "13px 32px",
};

const credBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0 16px",
};

const credTitleStyle: React.CSSProperties = {
  color: "#166534",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const credFieldStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
  fontFamily: "monospace",
};

const credNoteStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "12px 0 0",
  textAlign: "center" as const,
  fontStyle: "italic",
};

const footerTextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};
