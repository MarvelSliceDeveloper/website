# Email Hosting Comparison

## Self-Hosted Mail Server vs Third-Party Email Providers

## Overview

Most modern applications need to send emails for:

- User registration verification
- Password reset
- One-Time Password (OTP)
- Welcome emails
- Notifications
- Monthly reports
- Transaction confirmations

There are two common approaches:

1. Use a third-party email provider (Recommended)
2. Host your own email server

---

# Option 1 — Third-Party Email Provider

Examples:

- Resend
- Amazon SES
- SendGrid
- Mailgun
- Brevo

## Architecture

```
Customer
     ▲
     │
Email Provider
     ▲
     │
Your Application
     ▲
     │
Your VPS
```

Your VPS only runs your application.

The email provider is responsible for:

- SMTP servers
- Email delivery
- Spam protection
- Retry mechanisms
- DKIM
- SPF guidance
- IP reputation
- Deliverability

---

## Advantages

- Very easy to set up
- High delivery success
- Emails rarely go to spam
- No server maintenance
- Suitable for production
- Excellent documentation
- Highly scalable

---

## Disadvantages

- Monthly cost after free tier
- Dependency on an external service

---

## Typical Pricing

| Provider   | Free Tier              | Paid Pricing               |
| ---------- | ---------------------- | -------------------------- |
| Resend     | 3,000 emails/month     | Starts around $20/month    |
| Amazon SES | No permanent free tier | ~$0.10 per 1,000 emails    |
| Brevo      | 300 emails/day         | Starts around $9/month     |
| SendGrid   | Free tier available    | Starts around $19.95/month |
| Mailgun    | Trial available        | Pay-as-you-go              |

---

## Best For

- Personal projects
- Startups
- SaaS applications
- Production systems
- Student projects

---

# Option 2 — Self-Hosted Email Server

You host the complete email infrastructure on your VPS.

## Architecture

```
Customer
     ▲
     │
Internet
     ▲
     │
Postfix
     ▲
     │
Your Application
     ▲
     │
Your VPS
```

---

## Required Software

| Software              | Purpose          |
| --------------------- | ---------------- |
| Postfix               | SMTP Server      |
| Dovecot               | IMAP/POP3 Server |
| OpenDKIM              | DKIM Signing     |
| OpenDMARC             | DMARC Validation |
| Rspamd / SpamAssassin | Spam Filtering   |
| Certbot               | SSL Certificates |

Many people deploy these using Docker.

Popular Docker solutions include:

- Mailcow
- Mailu
- Docker Mailserver

---

## Additional Requirements

You must configure:

- SPF
- DKIM
- DMARC
- Reverse DNS (PTR)
- MX Records
- TLS Certificates
- Spam Protection
- Firewall Rules

---

## Advantages

- Complete control
- No email provider fees
- Unlimited email volume (limited by server resources)
- Good learning experience
- Privacy

---

## Disadvantages

- Difficult setup
- High maintenance
- Poor IP reputation initially
- Emails may land in spam
- Must monitor security
- Must handle backups
- Must manage updates
- SMTP port may be blocked by some VPS providers

---

## Cost

### Direct Cost

| Item          | Approximate Cost   |
| ------------- | ------------------ |
| VPS           | ₹500–₹1,000/month  |
| Domain        | ₹800–₹1,500/year   |
| Mail Software | Free (Open Source) |

### Hidden Costs

- Time
- Maintenance
- Security
- Debugging
- Deliverability issues

These hidden costs are often much larger than the software cost itself.

---

# Comparison

| Feature          | Third-Party Provider | Self-Hosted Server       |
| ---------------- | -------------------- | ------------------------ |
| Initial Setup    | Easy                 | Difficult                |
| Monthly Cost     | Low                  | VPS only                 |
| Maintenance      | Very Low             | High                     |
| Spam Protection  | Included             | Manual                   |
| Deliverability   | Excellent            | Depends on configuration |
| Scalability      | Excellent            | Depends on server        |
| Security         | Managed              | Self-managed             |
| Time to Deploy   | 30–60 minutes        | Several days             |
| Production Ready | Yes                  | Requires experience      |
| Learning Value   | Medium               | Very High                |

---

# Estimated Time

| Task           | Third-Party   | Self-Hosted |
| -------------- | ------------- | ----------- |
| Initial Setup  | 30–60 minutes | 2–5 days    |
| Learning Curve | Low           | High        |
| Maintenance    | Minimal       | Ongoing     |

---

# Recommendation

## Personal Projects

✅ Resend

---

## Student Projects

✅ Resend

---

## Startup / SaaS

✅ Resend or Amazon SES

---

## Learning Email Infrastructure

✅ Self-host a mail server on a test VPS to understand SMTP, DNS, DKIM, SPF, and DMARC.

---

## Production Applications

Use a third-party email provider.

The monthly cost is usually very small compared to the time and effort required to maintain a reliable self-hosted mail server.

---

# Recommendation for the Finance Tracker Project

Application Hosting:

- VPS
- Docker
- Next.js
- PostgreSQL
- Nginx

Email Delivery:

- Resend

Reason:

- Easy integration
- Reliable email delivery
- Low maintenance
- Production-ready
- Suitable for future scaling

This architecture provides a good balance between cost, simplicity, and reliability.
