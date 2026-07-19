import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Hr,
  Link,
  Section,
} from "@react-email/components";

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const COMPANY_NAME = process.env.EMAIL_FROM_NAME || "LMS Portal";

interface ResetPasswordEmailProps {
  userName: string;
  resetLink: string;
}

export default function ResetPasswordEmail({
  userName,
  resetLink,
}: ResetPasswordEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headingStyle}>Reset Your Password</Text>
          <Text style={paragraphStyle}>Hi {userName},</Text>
          <Text style={paragraphStyle}>
            We received a request to reset your password. Click the button below
            to choose a new password. This link expires in 15 minutes.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Link href={resetLink} style={buttonStyle}>
              Reset Password
            </Link>
          </Section>
          <Text style={paragraphStyle}>
            If you did not request a password reset, you can safely ignore this
            email. Your password will remain unchanged.
          </Text>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            {COMPANY_NAME} &mdash; Learning Management System
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f6f9",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "40px 32px",
  maxWidth: "480px",
  margin: "0 auto",
  border: "1px solid #e3e6ea",
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#1a2238",
  margin: "0 0 8px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4a5568",
  margin: "12px 0",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#4f76e6",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e3e6ea",
  margin: "24px 0",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "0",
};
