/**
 * Email service — sends transactional emails via Brevo (Sendinblue) API.
 *
 * Handles welcome emails (with optional credentials), password reset links,
 * and notification emails for 15+ event types (sessions, enrollments,
 * assignments, mentorship, support tickets).
 *
 * Uses @react-email/render for HTML templates. Gracefully skips sending
 * when BREVO_API_KEY is not configured (logs warning, returns false).
 */
import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";
import {
  WelcomeEmail,
  SessionScheduled,
  SessionCancelled,
  RecordingAvailable,
  EnrollmentApproved,
  EnrollmentRejected,
  AssignmentGraded,
  MentorshipCreated,
  MentorshipStatusChanged,
  SupportTicketCreated,
  SupportTicketReply,
  SupportTicketStatusChanged,
  CustomNotification,
  ResetPasswordEmail,
} from "@lms/email-templates";
import { generateInvoicePdf } from "./invoice.service";

type EmailTemplateComponent = (
  props: Record<string, unknown>,
) => React.ReactElement;

/* eslint-disable @typescript-eslint/no-explicit-any */
const NOTIFICATION_EMAIL_TEMPLATES: Record<string, EmailTemplateComponent> = {
  SESSION_SCHEDULED: SessionScheduled as unknown as EmailTemplateComponent,
  SESSION_CANCELLED: SessionCancelled as unknown as EmailTemplateComponent,
  RECORDING_AVAILABLE: RecordingAvailable as unknown as EmailTemplateComponent,
  ENROLLMENT_APPROVED: EnrollmentApproved as unknown as EmailTemplateComponent,
  ENROLLMENT_REJECTED: EnrollmentRejected as unknown as EmailTemplateComponent,
  ASSIGNMENT_GRADED: AssignmentGraded as unknown as EmailTemplateComponent,
  MENTORSHIP_CREATED: MentorshipCreated as unknown as EmailTemplateComponent,
  MENTORSHIP_ASSIGNED:
    MentorshipStatusChanged as unknown as EmailTemplateComponent,
  MENTORSHIP_SCHEDULED:
    MentorshipStatusChanged as unknown as EmailTemplateComponent,
  MENTORSHIP_COMPLETED:
    MentorshipStatusChanged as unknown as EmailTemplateComponent,
  MENTORSHIP_CANCELLED:
    MentorshipStatusChanged as unknown as EmailTemplateComponent,
  SUPPORT_TICKET_CREATED:
    SupportTicketCreated as unknown as EmailTemplateComponent,
  SUPPORT_TICKET_RESPONDED:
    SupportTicketReply as unknown as EmailTemplateComponent,
  SUPPORT_TICKET_STATUS_CHANGED:
    SupportTicketStatusChanged as unknown as EmailTemplateComponent,
  CUSTOM_NOTIFICATION: CustomNotification as unknown as EmailTemplateComponent,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function getSenderConfig() {
  return {
    name: process.env.EMAIL_FROM_NAME || "LMS Portal",
    email: process.env.EMAIL_FROM_EMAIL || "noreply@localhost",
  };
}

function isConfigured(): boolean {
  return !!process.env.BREVO_API_KEY;
}

let brevoClient: BrevoClient | null = null;

function getBrevoClient(): BrevoClient | null {
  if (!isConfigured()) {
    return null;
  }

  if (!brevoClient) {
    brevoClient = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY!,
    });
  }

  return brevoClient;
}

interface SendEmailAttachment {
  content: string;
  name: string;
}

interface SendEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
  attachment?: SendEmailAttachment[];
}

/**
 * Renders an EmailTemplate from the database by replacing
 * {{notificationTitle}} and {{notificationMessage}} placeholders
 * with actual values. Falls back gracefully if template not found.
 */
async function renderDbTemplate(
  templateId: string,
  data: Record<string, unknown>,
): Promise<{ subject: string; html: string } | null> {
  try {
    const { prisma } = await import("../../utils/prisma");
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || !template.isActive) return null;

    const title = (data.title as string) || "Notification";
    const message = (data.message as string) || "";

    const subject = template.subject.replace(
      /\{\{notificationTitle\}\}/g,
      title,
    );
    const html = template.body
      .replace(/\{\{notificationTitle\}\}/g, title)
      .replace(/\{\{notificationMessage\}\}/g, message);

    return { subject, html };
  } catch {
    return null;
  }
}

export const emailService = {
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const client = getBrevoClient();
    if (!client) {
      console.warn("[email] BREVO_API_KEY not set — skipping email send");
      return false;
    }

    const sender = getSenderConfig();

    try {
      const result = await client.transactionalEmails.sendTransacEmail({
        sender,
        to: options.to,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        tags: options.tags,
        attachment: options.attachment,
      });

      console.log("[email] Sent successfully, messageId:", result.messageId);
      return true;
    } catch (error: unknown) {
      const err = error as { body?: { message?: string }; message?: string };
      console.error(
        `[email] Failed to send: ${err.body?.message || err.message || error}`,
      );
      return false;
    }
  },

  async sendWelcomeEmail(user: {
    name: string;
    email: string;
    credentials?: { email: string; password: string };
    invoice?: {
      paymentId: string;
      packageName: string;
      amount: number;
      discountAmount: number;
      orderId?: string;
    };
  }): Promise<boolean> {
    if (!isConfigured()) {
      console.warn("[email] BREVO_API_KEY not set — skipping welcome email");
      return false;
    }

    try {
      const html = await render(
        WelcomeEmail({ userName: user.name, credentials: user.credentials }),
      );

      const credsText = user.credentials
        ? `\n\nYour login credentials:\nEmail: ${user.credentials.email}\nPassword: ${user.credentials.password}\n\nPlease change your password after logging in.`
        : "";

      const invoiceText = user.invoice
        ? `\n\nPurchase Summary:\nPackage: ${user.invoice.packageName}\nAmount: ₹${(user.invoice.amount / 100).toLocaleString("en-IN")}${user.invoice.discountAmount > 0 ? `\nDiscount: -₹${(user.invoice.discountAmount / 100).toLocaleString("en-IN")}` : ""}\nTotal Paid: ₹${((user.invoice.amount - user.invoice.discountAmount) / 100).toLocaleString("en-IN")}\n\nInvoice PDF is attached to this email.`
        : "";

      const attachment = user.invoice
        ? [
            {
              content: generateInvoicePdf({
                invoiceNumber: `INV-${user.invoice.paymentId.slice(-8).toUpperCase()}`,
                userName: user.name,
                userEmail: user.email,
                packageName: user.invoice.packageName,
                amount: user.invoice.amount,
                discountAmount: user.invoice.discountAmount,
                date: new Date(),
                password: user.credentials?.password,
              }).toString("base64"),
              name: `invoice-${user.invoice.paymentId.slice(-8)}.pdf`,
            },
          ]
        : undefined;

      return this.sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Welcome to LMS Portal — Purchase Confirmation",
        html,
        text: `Hi ${user.name},\n\nWelcome to LMS Portal! Your account has been created successfully.${credsText}${invoiceText}\n\nBest regards,\nLMS Portal Team`,
        tags: ["welcome", "onboarding", "purchase"],
        attachment,
      });
    } catch (error: unknown) {
      console.error("[email] Failed to render/send welcome email:", error);
      return false;
    }
  },

  async sendInvoiceEmail(user: {
    name: string;
    email: string;
    invoice: {
      paymentId: string;
      packageName: string;
      amount: number;
      discountAmount: number;
      orderId?: string;
    };
  }): Promise<boolean> {
    if (!isConfigured()) {
      console.warn("[email] BREVO_API_KEY not set — skipping invoice email");
      return false;
    }

    try {
      const attachment = [
        {
          content: generateInvoicePdf({
            invoiceNumber: `INV-${user.invoice.paymentId.slice(-8).toUpperCase()}`,
            userName: user.name,
            userEmail: user.email,
            packageName: user.invoice.packageName,
            amount: user.invoice.amount,
            discountAmount: user.invoice.discountAmount,
            date: new Date(),
          }).toString("base64"),
          name: `invoice-${user.invoice.paymentId.slice(-8)}.pdf`,
        },
      ];

      return this.sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: `Invoice — ${user.invoice.packageName}`,
        html: `<p>Hi ${user.name},</p><p>Your payment for <strong>${user.invoice.packageName}</strong> has been received successfully.</p><p>Your invoice is attached to this email. Please keep it for your records.</p><p>You will receive your login credentials once your batch enrollment is confirmed.</p><p>Best regards,<br/>LMS Portal Team</p>`,
        text: `Hi ${user.name},\n\nYour payment for ${user.invoice.packageName} has been received successfully.\n\nYour invoice is attached to this email. Please keep it for your records.\n\nYou will receive your login credentials once your batch enrollment is confirmed.\n\nBest regards,\nLMS Portal Team`,
        tags: ["invoice", "payment"],
        attachment,
      });
    } catch (error: unknown) {
      console.error("[email] Failed to send invoice email:", error);
      return false;
    }
  },

  async sendResetPasswordEmail(user: {
    name: string;
    email: string;
    resetLink: string;
  }): Promise<boolean> {
    if (!isConfigured()) {
      console.warn(
        "[email] BREVO_API_KEY not set — skipping reset password email",
      );
      return false;
    }

    try {
      const html = await render(
        ResetPasswordEmail({ userName: user.name, resetLink: user.resetLink }),
      );

      return this.sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Reset Your Password — LMS Portal",
        html,
        text: `Hi ${user.name},\n\nWe received a request to reset your password. Click the link below to choose a new password:\n\n${user.resetLink}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nLMS Portal Team`,
        tags: ["password-reset"],
      });
    } catch (error: unknown) {
      console.error("[email] Failed to send reset password email:", error);
      return false;
    }
  },

  async sendNotificationEmail(
    user: { name: string; email: string },
    type: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    if (!isConfigured()) {
      console.warn(
        "[email] BREVO_API_KEY not set — skipping notification email",
      );
      return false;
    }

    try {
      const TemplateComponent =
        NOTIFICATION_EMAIL_TEMPLATES[type] || CustomNotification;

      const templateData = { ...data };

      if (
        type === "CUSTOM_NOTIFICATION" ||
        !NOTIFICATION_EMAIL_TEMPLATES[type]
      ) {
        templateData.title = (data.title as string) || "Notification";
        templateData.message =
          (data.message as string) || "You have a new notification.";
      }

      const html = await render(TemplateComponent(templateData));

      const subject = this.getSubjectForType(type, data);

      return this.sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject,
        html,
        text: this.getTextForType(type, data),
        tags: ["notification", type.toLowerCase()],
      });
    } catch (error: unknown) {
      console.error(
        `[email] Failed to send notification email (type: ${String(type)}): ${String(error instanceof Error ? error.message : error)}`,
      );
      return false;
    }
  },

  async sendEmailWithTemplate(
    user: { name: string; email: string },
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    if (!isConfigured()) {
      console.warn(
        "[email] BREVO_API_KEY not set — skipping template email",
      );
      return false;
    }

    try {
      const rendered = await renderDbTemplate(templateId, data);
      if (!rendered) {
        console.warn(
          `[email] Template ${templateId} not found or inactive — falling back to default`,
        );
        return this.sendNotificationEmail(user, "CUSTOM_NOTIFICATION", data);
      }

      return this.sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: rendered.subject,
        html: rendered.html,
        text: `${data.title || "Notification"}: ${data.message || ""}`,
        tags: ["notification", "custom", "template"],
      });
    } catch (error: unknown) {
      console.error(
        `[email] Failed to send template email: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  },

  getSubjectForType(type: string, data: Record<string, unknown>): string {
    const courseName = (data.courseName as string) || "";
    const suffix = courseName ? ` — ${courseName}` : "";

    switch (type) {
      case "SESSION_SCHEDULED":
        return `Live Session Scheduled${suffix}`;
      case "SESSION_CANCELLED":
        return `Session Cancelled${suffix}`;
      case "RECORDING_AVAILABLE":
        return `Recording Available${suffix}`;
      case "ENROLLMENT_APPROVED":
        return `Enrollment Approved — ${courseName}`;
      case "ENROLLMENT_REJECTED":
        return `Enrollment Update — ${courseName}`;
      case "ASSIGNMENT_GRADED":
        return `Assignment Graded — ${(data.assignmentTitle as string) || ""}`;
      case "MENTORSHIP_CREATED":
        return `Mentorship Request Submitted`;
      case "MENTORSHIP_ASSIGNED":
      case "MENTORSHIP_SCHEDULED":
      case "MENTORSHIP_COMPLETED":
      case "MENTORSHIP_CANCELLED":
        return `Mentorship Update — ${(data.label as string) || type}`;
      case "SUPPORT_TICKET_CREATED":
        return `Support Ticket Submitted`;
      case "SUPPORT_TICKET_RESPONDED":
        return `New Reply on Support Ticket`;
      case "SUPPORT_TICKET_STATUS_CHANGED":
        return `Support Ticket Update — ${(data.label as string) || ""}`;
      case "CUSTOM_NOTIFICATION":
        return (data.title as string) || "Notification from LMS Portal";
      default:
        return "Notification from LMS Portal";
    }
  },

  getTextForType(type: string, data: Record<string, unknown>): string {
    const courseName = (data.courseName as string) || "";
    const batchName = (data.batchName as string) || "";

    switch (type) {
      case "SESSION_SCHEDULED":
        return `A live session has been scheduled for ${courseName} — ${batchName}. Session: ${data.sessionTitle || ""}, Time: ${data.scheduledAt || ""}. Join URL: ${data.joinUrl || ""}`;
      case "SESSION_CANCELLED":
        return `Session cancelled for ${courseName} — ${batchName}. Session: ${data.sessionTitle || ""}`;
      case "RECORDING_AVAILABLE":
        return `Recording is now available for ${courseName} — ${batchName}. Session: ${data.sessionTitle || ""}`;
      case "ENROLLMENT_APPROVED":
        return `Your enrollment for ${courseName} has been approved. Batch: ${batchName}`;
      case "ENROLLMENT_REJECTED":
        return `Your enrollment for ${courseName} was not approved. ${data.reason ? `Reason: ${data.reason}` : ""}`;
      case "ASSIGNMENT_GRADED":
        return `Your assignment "${data.assignmentTitle || ""}" has been graded. ${data.grade ? `Grade: ${data.grade}` : ""}`;
      case "MENTORSHIP_CREATED":
        return `Your mentorship request "${data.ticketTitle || ""}" has been submitted.`;
      case "SUPPORT_TICKET_CREATED":
        return `Your support ticket "${data.ticketTitle || ""}" has been submitted.`;
      case "SUPPORT_TICKET_RESPONDED":
        return `${data.senderName || "Admin"} replied to your support ticket "${data.ticketTitle || ""}".`;
      case "CUSTOM_NOTIFICATION":
        return `${data.title || "Notification"}: ${data.message || ""}`;
      default:
        return `You have a new notification from LMS Portal.`;
    }
  },
};
