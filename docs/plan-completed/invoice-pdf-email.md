# Completed: Invoice PDF in Post-Purchase Email

## Summary

Implemented automatic invoice PDF generation and attachment to the welcome email sent after course purchase.

## What was done

### 1. Invoice PDF Service (`apps/api/src/services/invoice.service.ts`)

- Uses jsPDF to generate A4 portrait invoice PDF
- Content: company name (from `EMAIL_FROM_NAME` env var), invoice number (`INV-{shortId}`), date, bill-to section, package name, amount, discount, total, login credentials (for new users)
- Returns `Buffer` for email attachment

### 2. Email Service (`apps/api/src/services/email.service.ts`)

- Added `attachment` field to `SendEmailOptions` interface
- Passes `attachment` to Brevo `sendTransacEmail` call (base64-encoded content + filename)
- `sendWelcomeEmail()` now accepts optional `invoice` data
- Generates invoice PDF and attaches as `invoice-{paymentId}.pdf`
- Updated subject to "Welcome to LMS Portal — Purchase Confirmation"
- Added "purchase" tag

### 3. Payment Service (`apps/api/src/modules/payments/payment.service.ts`)

- Removed welcome email from `createGuestUser()` (was sent before payment completion)
- `enrollInBatch()` now sends welcome email with invoice data (payment + package details already available)
- `createConsentEnrollment()` now includes package relation in payment query + sends invoice email
- Both pass `paymentId`, `packageName`, `amount`, `discountAmount` to the email service

### 4. WelcomeEmail Template (`packages/email-templates/src/emails/WelcomeEmail.tsx`)

- Updated body text to mention purchase and attached invoice

## Testing

- All 249 previously-passing tests still pass
- Email service tests (16) and payment service tests (6) all pass
- Typecheck passes (pre-existing errors in other files unrelated)

## Files Changed

- **Created:** `apps/api/src/services/invoice.service.ts`
- **Modified:** `apps/api/src/services/email.service.ts`, `apps/api/src/modules/payments/payment.service.ts`, `packages/email-templates/src/emails/WelcomeEmail.tsx`
