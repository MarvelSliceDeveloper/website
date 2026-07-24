# Plan: Invoice PDF in Post-Purchase Email

## Goal

Include an invoice PDF attachment in the welcome email sent after course purchase completion.

## Changes

1. **Create `apps/api/src/services/invoice.service.ts`** — Invoice PDF generation using jsPDF
2. **Update `apps/api/src/services/email.service.ts`** — Add attachment support + invoice data in sendWelcomeEmail
3. **Update `apps/api/src/modules/payments/payment.service.ts`** — Remove pre-payment email from createGuestUser, add invoice data in enrollInBatch/createConsentEnrollment
4. **Update `packages/email-templates/src/emails/WelcomeEmail.tsx`** — Reference purchase in email body

## Key Decisions

- Remove pre-payment email from createGuestUser (sent during order creation, before payment)
- Send welcome email + invoice only after payment + enrollment/consent
- Use existing env vars for company info
- Invoice number format: `INV-{paymentId.slice(-8).toUpperCase()}`
- PDF attached as base64 via Brevo API attachment field
