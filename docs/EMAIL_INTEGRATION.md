# Brevo Email Integration

## Overview

The LMS Portal integrates **Brevo** (formerly Sendinblue) as its email delivery provider, using **React Email** for template authoring. All in-app notifications automatically trigger corresponding HTML emails when configured.

---

## Architecture

```
Notification Created (DB)
        │
        ▼
NotificationService.notify*()
        │
        ├── Creates in-app notification (DB record)
        │
        └── dispatchEmailsForNotification()
                │
                ├── Batch-fetch users + NotificationPreference records
                │
                ├── Filter users:
                │     • Has email address?
                │     • No preference record OR email: true?
                │     (Missing preference → default enabled)
                │
                └── emailService.sendNotificationEmail()
                        │
                        ├── Render React Email template → HTML
                        │
                        └── Brevo API → Send email
```

---

## Setup Guide

### Step 1: Get Brevo API Key

1. Go to [https://app.brevo.com/](https://app.brevo.com/)
2. Sign up for a free account (300 emails/day on free tier)
3. Navigate to **SMTP & API** → **API Keys**
4. Click **Generate a new API key**
5. Copy the key (shown only once)

### Step 2: Configure Environment

Add these to your `.env` file:

```bash
# Brevo Email (Required for email sending)
BREVO_API_KEY=xkeysib-your-api-key-here

# Sender Configuration
# NOTE: For free accounts, use your Brevo login email as EMAIL_FROM_EMAIL
# You can customize EMAIL_FROM_NAME to anything
EMAIL_FROM_NAME=LMS Portal
EMAIL_FROM_EMAIL=your-personal-email@gmail.com
```

**Important for free accounts:**

- `EMAIL_FROM_EMAIL` must match your Brevo account email OR be a verified sender
- For testing, use your personal email (Gmail, Outlook, etc.)
- You can customize `EMAIL_FROM_NAME` to "LMS Portal" or any name

### Step 3: Seed Notification Preferences

```bash
pnpm prisma:reset
```

This creates `NotificationPreference` records with `email: true` for all 15 notification types.

### Step 4: Restart API Server

```bash
pnpm dev
```

The server logs will show:

- `[email] Sent successfully, messageId: ...` when emails send
- `[email] BREVO_API_KEY not set — skipping email send` if not configured

---

## Email Templates

All templates are React Email components in `packages/email-templates/`:

| Template                     | Trigger                      | Subject                             |
| ---------------------------- | ---------------------------- | ----------------------------------- |
| `WelcomeEmail`               | User registration            | "Welcome to LMS Portal!"            |
| `SessionScheduled`           | Live session created         | "Live Session Scheduled — {course}" |
| `SessionCancelled`           | Live session cancelled       | "Session Cancelled — {course}"      |
| `RecordingAvailable`         | Recording uploaded           | "Recording Available — {course}"    |
| `EnrollmentApproved`         | Admin approves enrollment    | "Enrollment Approved — {course}"    |
| `EnrollmentRejected`         | Admin rejects enrollment     | "Enrollment Update — {course}"      |
| `AssignmentGraded`           | Assignment graded            | "Assignment Graded — {title}"       |
| `MentorshipCreated`          | Mentorship request submitted | "Mentorship Request Submitted"      |
| `MentorshipStatusChanged`    | Mentorship status update     | "Mentorship Update — {label}"       |
| `SupportTicketCreated`       | Support ticket submitted     | "Support Ticket Submitted"          |
| `SupportTicketReply`         | Admin replies to ticket      | "New Reply on Support Ticket"       |
| `SupportTicketStatusChanged` | Ticket status update         | "Support Ticket Update — {label}"   |
| `CustomNotification`         | Fallback/unknown type        | Custom title from data              |

---

## Email Trigger Points

Every email is sent **fire-and-forget** (non-blocking). If Brevo is not configured, emails are silently skipped.

| Action                                          | Email Sent? | Type                                              |
| ----------------------------------------------- | ----------- | ------------------------------------------------- |
| User self-registers (`POST /api/auth/register`) | ✅          | Welcome email                                     |
| Admin creates user (`POST /api/users`)          | ✅          | Welcome email                                     |
| Schedule live session                           | ✅          | SESSION_SCHEDULED                                 |
| Cancel live session                             | ✅          | SESSION_CANCELLED                                 |
| Upload recording                                | ✅          | RECORDING_AVAILABLE                               |
| Approve enrollment                              | ✅          | ENROLLMENT_APPROVED                               |
| Reject enrollment                               | ✅          | ENROLLMENT_REJECTED                               |
| Grade assignment                                | ✅          | ASSIGNMENT_GRADED                                 |
| Submit mentorship request                       | ✅          | MENTORSHIP_CREATED                                |
| Update mentorship status                        | ✅          | MENTORSHIP_ASSIGNED/SCHEDULED/COMPLETED/CANCELLED |
| Submit support ticket                           | ✅          | SUPPORT_TICKET_CREATED                            |
| Reply to support ticket                         | ✅          | SUPPORT_TICKET_RESPONDED                          |
| Update ticket status                            | ✅          | SUPPORT_TICKET_STATUS_CHANGED                     |
| Admin sends custom notification                 | ✅          | CUSTOM_NOTIFICATION                               |

**User control:** Each user can toggle email on/off per notification type via Notification Preferences in the UI. Only users with `email: true` for a given type receive the email. If no preference record exists (new user), email defaults to enabled.

**Note:** After `pnpm prisma:reset`, all seed users get `email: true` for all 15 types. Existing users who registered before will have no preferences — they default to enabled.

---

## Testing Email Sending

### Method 1: Quick Test with cURL

Register a new user to trigger the welcome email:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "TestPass123!"
  }'
```

Check your inbox for "Welcome to LMS Portal!" email.

### Method 2: Admin Creates User (Welcome Email)

Login as admin and create a user — welcome email is sent automatically:

```bash
# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lms.local", "password": "admin123"}'

# Create a new user (replace <TOKEN> with the accessToken from login)
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "New Student",
    "email": "your-email@gmail.com",
    "password": "TestPass123!",
    "role": "STUDENT"
  }'
```

Check your inbox for "Welcome to LMS Portal!" email.

### Method 3: Using the Web UI

1. Open http://localhost:3000
2. Register a new account with your email
3. Check your inbox (and spam folder)

### Method 4: Trigger Notification Emails

Login as admin and perform actions that create notifications:

```bash
# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lms.local", "password": "admin123"}'
```

Then perform actions:

- Schedule a live session → triggers `SessionScheduled` email
- Approve/reject enrollment → triggers enrollment email
- Grade an assignment → triggers `AssignmentGraded` email

### Method 5: Test Brevo API Key Directly

Verify your API key works:

```bash
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: xkeysib-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {"name": "LMS Portal", "email": "your-email@gmail.com"},
    "to": [{"email": "your-email@gmail.com"}],
    "subject": "Test from Brevo",
    "htmlContent": "<h1>Hello!</h1><p>This is a test email from Brevo API.</p>"
  }'
```

---

## Troubleshooting

### Emails not sending?

1. **Check API server logs:**

   ```bash
   # Look for email-related logs
   pnpm dev 2>&1 | grep -i email
   ```

2. **Verify environment variables:**

   ```bash
   # In Node.js console or API health endpoint
   console.log(process.env.BREVO_API_KEY ? 'Key set' : 'Key missing');
   ```

3. **Test Brevo API key:**
   - Go to Brevo dashboard → SMTP & API → API Keys
   - Verify key is active

4. **Check sender email:**
   - Free accounts can only send from their registered email
   - Verify `EMAIL_FROM_EMAIL` matches your Brevo account email

### Emails going to spam?

1. **Use a proper sender email:**
   - Avoid `noreply@localhost` for production
   - Use a real domain email

2. **Check Brevo sender reputation:**
   - Brevo dashboard → Statistics → Deliverability

### Template rendering errors?

```bash
# Test template rendering in Node.js
node -e "
  const { render } = require('@react-email/render');
  const { WelcomeEmail } = require('@lms/email-templates');
  render(WelcomeEmail({ userName: 'Test' })).then(html => console.log(html));
"
```

---

## API Reference

### emailService.sendEmail(options)

Send a raw email.

```typescript
await emailService.sendEmail({
  to: [{ email: "user@example.com", name: "John Doe" }],
  subject: "Hello",
  html: "<h1>Hello!</h1>",
  text: "Hello!", // Optional plain text fallback
  tags: ["test"], // Optional tags for tracking
});
```

### emailService.sendWelcomeEmail(user)

Send welcome email to new user.

```typescript
await emailService.sendWelcomeEmail({
  name: "John Doe",
  email: "john@example.com",
});
```

### emailService.sendNotificationEmail(user, type, data)

Send notification email based on type.

```typescript
await emailService.sendNotificationEmail(
  { name: "John", email: "john@example.com" },
  "SESSION_SCHEDULED",
  {
    sessionTitle: "React Hooks Deep Dive",
    courseName: "React Masterclass",
    batchName: "Batch A",
    scheduledAt: "2024-01-15T10:00:00Z",
    joinUrl: "https://teams.microsoft.com/...",
  },
);
```

---

## Adding New Email Templates

1. Create template in `packages/email-templates/src/emails/`:

```tsx
// packages/email-templates/src/emails/NewTemplate.tsx
import { Body, Container, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface NewTemplateProps {
  title: string;
  message: string;
}

export function NewTemplate({ title, message }: NewTemplateProps) {
  return (
    <BaseLayout preview={title}>
      <Container>
        <Heading>{title}</Heading>
        <Text>{message}</Text>
      </Container>
    </BaseLayout>
  );
}
```

2. Export from `packages/email-templates/src/index.ts`:

```typescript
export { NewTemplate } from "./emails/NewTemplate";
```

3. Add mapping in `apps/api/src/services/email.service.ts`:

```typescript
import { NewTemplate } from "@lms/email-templates";

const NOTIFICATION_EMAIL_TEMPLATES = {
  // ... existing mappings
  NEW_NOTIFICATION_TYPE: NewTemplate as unknown as EmailTemplateComponent,
};
```

4. Add subject/text generators in the same file.

---

## Free Tier Limitations

| Feature        | Free Tier             | Paid ($9+/month) |
| -------------- | --------------------- | ---------------- |
| Emails/day     | 300                   | 10,000+          |
| Sender email   | Your Brevo email only | Custom domains   |
| Brevo branding | Included              | Removable        |
| API access     | Full                  | Full             |

**Recommendation:** Free tier is perfect for development and small deployments.

---

## Files Changed

```
packages/email-templates/          # React Email templates
  src/emails/                      # 13 templates + BaseLayout
  src/index.ts                     # Template exports

apps/api/src/services/
  email.service.ts                 # Brevo integration (sendEmail, sendWelcomeEmail, sendNotificationEmail)

apps/api/src/modules/notifications/
  notification.service.ts          # dispatchEmailsForNotification (exported, handles missing prefs)

apps/api/src/modules/enrollments/
  enrollment.routes.ts             # Added email dispatch after approve/reject

apps/api/src/modules/users/
  user.routes.ts                   # Added notificationPreference.deleteMany on user delete

apps/api/src/modules/auth/
  auth.service.ts                  # Welcome email on register

apps/api/prisma/
  seed.ts                          # 15 notification types, email: true
  schema.prisma                    # NotificationPreference model (email default: false)

docs/
  EMAIL_INTEGRATION.md             # This file
```
