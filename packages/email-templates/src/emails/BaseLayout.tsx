import React from "react";
import { Html, Head, Body, Container, Text, Hr, Link, Section, Img } from "@react-email/components";

interface BaseLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const COMPANY_NAME = process.env.EMAIL_FROM_NAME || "LMS Portal";

export default function BaseLayout({ children, previewText }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        {previewText && (
          <Text style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
            {previewText}
          </Text>
        )}
        <Container style={containerStyle}>
          <Section style={logoSectionStyle}>
            <Img
              src={`${WEB_URL}/images/logo.svg`}
              width="40"
              height="40"
              alt={COMPANY_NAME}
              style={logoStyle}
            />
            <Text style={logoTextStyle}>{COMPANY_NAME}</Text>
          </Section>

          {children}

          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              You received this email because you're a member of {COMPANY_NAME}.{" "}
              <Link
                href={`${WEB_URL}/settings/notifications`}
                style={linkStyle}
              >
                Manage notification preferences
              </Link>
            </Text>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  margin: "40px auto",
  maxWidth: "600px",
  padding: "40px",
};

const logoSectionStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const logoStyle: React.CSSProperties = {
  margin: "0 auto",
};

const logoTextStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "700",
  margin: "8px 0 0",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e8ecf1",
  margin: "32px 0",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const linkStyle: React.CSSProperties = {
  color: "#4f46e5",
  textDecoration: "underline",
};
