# Phase 11 — Admin Panel & Launch

> ⏱️ **Duration**: Weeks 20–23 (4 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: All previous phases  
> ⚠️ **Extended from original 2 weeks → 4 weeks** (production hardening + deployment + monitoring deserves dedicated time)

---

## 🎯 Objective

Build Super Admin and platform Admin panels, deploy to production, set up monitoring, perform security hardening, load testing, and launch.

---

## ✅ Tasks

### 11.1 — Super Admin Dashboard

- [ ] Build super admin pages: `/(admin)/dashboard`
- [ ] Dashboard overview:
- [ ] System health status
- [ ] User management: `/(admin)/dashboard/users`
  - List all users
  - Search by name/email
  - Filter by: role, status
  - Actions: view profile, change role, disable account, reset password
  - **🆕 Export user list** (CSV download)
- [ ] Revenue dashboard: `/(admin)/dashboard/payments`
  - Total revenue chart (monthly trend)
  - Payment list with filters (status, date)
  - Refund management
  - **🆕 Revenue export** (CSV for accounting)

### 11.2 — Admin Features

- [ ] Build admin section
- [ ] Dashboard:
  - Total users
  - Total courses
  - Active enrollments
  - Monthly revenue
- [ ] User management:
  - List all users
  - Change roles (student ↔ instructor ↔ admin)
  - **🆕 Bulk invite** via CSV upload (name, email, role)
- [ ] Course management:
  - List all courses
  - Publish/unpublish courses
  - View enrollment stats
  - Archive courses
- [ ] **🆕 Platform settings**:
  - Global platform name and logo
  - Feature toggles (enable/disable quizzes, forums, certificates)
- [ ] **🆕 Announcements**:
  - Create platform-wide announcements
  - Show on student/instructor dashboards
  - Expiry date for auto-removal

### 11.3 — 🆕 Email/Notification System

- [ ] Set up transactional email service (Resend / AWS SES):
  - Welcome email (on registration)
  - Email verification
  - Password reset
  - Enrollment confirmation
  - Payment receipt + invoice
  - Certificate issued
  - Session reminder (30 min before)
  - Session cancelled/rescheduled
  - New announcement
  - Invitation email (admin invites user)
- [ ] Email templates using **React Email** or similar:
  - Consistent branding with platform logo and colors
  - Mobile responsive
  - Unsubscribe link
- [ ] In-app notification system:
  - `Notification` table (created in Phase 1 schema)
  - API endpoints:
    - `GET /api/notifications` — list user's notifications
    - `PATCH /api/notifications/:id/read` — mark as read
    - `PATCH /api/notifications/read-all` — mark all as read
    - `GET /api/notifications/unread-count` — badge count
  - Bell icon in header with unread count badge
  - Notification dropdown panel
  - **🆕 Real-time notifications** via Server-Sent Events (SSE) or WebSocket

### 11.4 — 🆕 Discussion Forums

- [ ] Course-level discussion boards:
  - `Discussion` and `DiscussionReply` tables (created in Phase 1)
  - API endpoints:
    - `POST /api/courses/:courseId/discussions` — create thread
    - `GET /api/courses/:courseId/discussions` — list threads
    - `POST /api/discussions/:id/replies` — reply to thread
    - `GET /api/discussions/:id` — thread with replies
  - Frontend page within course view
  - Markdown support in posts
  - Instructor badge on instructor replies
  - Pin/unpin threads (instructor only)
  - **🆕 Mention users** with `@username`
  - Notification when mentioned or thread replied to

### 11.5 — Production Deployment

- [ ] **Frontend (Next.js) → Vercel**:
  - Connect GitHub repo
  - Configure environment variables
  - Set up custom domain + SSL
  - Configure preview deployments for PRs
  - Set up Edge Functions if used
- [ ] **Backend API → DigitalOcean / AWS EC2**:
  - Create Dockerfile for API:
    ```dockerfile
    FROM node:20-alpine
    WORKDIR /app
    COPY . .
    RUN pnpm install --frozen-lockfile
    RUN pnpm build
    CMD ["node", "dist/index.js"]
    ```
  - Set up PM2 for process management (cluster mode)
  - Configure nginx as reverse proxy
  - Set up SSL with Let's Encrypt (Certbot)
  - Configure auto-restart on crash
  - **🆕 Docker Compose** for production: API + Redis + Bull dashboard
- [ ] **Database → Supabase / Neon / AWS RDS**:
  - Create production PostgreSQL instance
  - Run `prisma migrate deploy` to apply all migrations
  - Set up automated daily backups
  - Configure connection pooling (PgBouncer or Supabase built-in)
  - **🆕 Read replica** for analytics queries (if needed)
- [ ] **Cache + Queues → Upstash Redis**:
  - Create Upstash Redis instance
  - Configure Bull to use production Redis
  - Set up Redis persistence
- [ ] **🆕 CDN**:
  - Configure CDN for static assets (Cloudflare / Vercel Edge)
  - Set cache headers for images, CSS, JS

### 11.6 — DNS & SSL Configuration

- [ ] Configure production domain:
  - Primary domain: `yourlms.com`
  - API subdomain: `api.yourlms.com`
- [ ] SSL certificates:
  - Vercel handles SSL for frontend automatically
  - Let's Encrypt for API server (via Certbot)

### 11.7 — Monitoring & Alerting

- [ ] **Error tracking**: Sentry
  - Frontend error boundaries
  - Backend uncaught exceptions
  - Source maps uploaded on deploy
  - Alert on: error spike, new error type, unhandled rejection
- [ ] **Uptime monitoring**: UptimeRobot / Better Uptime
  - Monitor: frontend URL, API health endpoint, database connection
  - Alert channels: email + Slack/Discord
  - Status page (public)
- [ ] **Application metrics**:
  - Request latency (p50, p95, p99)
  - Error rate per endpoint
  - Active users (DAU/MAU)
  - Queue depth (Bull jobs pending)
  - Database query latency
- [ ] **Log aggregation**: 
  - Set up centralized logging (Logflare / Datadog / self-hosted ELK)
  - Structured JSON logs from both frontend and backend
  - Log retention: 30 days minimum
- [ ] **🆕 Dashboard**: Create monitoring dashboard showing:
  - System health overview
  - Key metrics
  - Recent errors
  - Active alerts

### 11.8 — Security Hardening

- [ ] **HTTP Security Headers** (if not done already):
  ```
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; ...
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```
- [ ] **Rate limiting**:
  - Auth endpoints: 5 req/min per IP
  - API endpoints: 100 req/min per user
  - Webhook endpoints: 1000 req/min
  - File uploads: 10 req/min per user
- [ ] **Input validation**: Verify Zod schemas on ALL API endpoints
- [ ] **SQL injection**: Prisma parameterizes by default — verify no raw SQL
- [ ] **XSS prevention**: Sanitize all user-generated HTML content
- [ ] **CORS**: Restrict to known origins only
- [ ] **🆕 Dependency audit**: `pnpm audit` — fix all critical/high vulnerabilities
- [ ] **🆕 Secret scanning**: Ensure no secrets in git history
- [ ] **🆕 Penetration testing**: Run OWASP ZAP or similar against staging

### 11.9 — Load Testing

- [ ] Set up **k6** or **Artillery** for load testing
- [ ] Test scenarios:
  - 100 concurrent users browsing course catalog
  - 50 concurrent users watching recordings
  - 20 concurrent payment flows
  - Webhook burst: 100 notifications in 1 minute
- [ ] Performance targets:
  - API response time: p95 < 500ms
  - Page load time: < 3 seconds
  - Database queries: p95 < 100ms
- [ ] Identify and fix bottlenecks
- [ ] Document results and optimizations

### 11.10 — Pre-Launch Checklist

- [ ] All E2E tests passing on staging
- [ ] Manual QA pass on all critical flows:
  - Registration → Login → Browse → Enroll → Watch → Quiz → Certificate
  - Instructor: Create course → Add modules → Schedule session → View attendance
  - Admin: Manage users → View revenue → Handle refund
  - Payment: Purchase → Webhook → Enrollment → Invoice
- [ ] SEO basics:
  - Sitemap generated (`/sitemap.xml`)
  - Robots.txt configured
  - Meta tags on all public pages
  - Open Graph tags for social sharing
- [ ] Legal pages:
  - Terms of Service
  - Privacy Policy
  - Cookie Policy
  - Refund Policy
- [ ] Analytics:
  - Google Analytics or Plausible installed
  - Events tracked: page views, enrollments, completions, payments
- [ ] **🆕 Data backup verification**: Restore from backup to verify it works
- [ ] **🆕 Rollback plan**: Document how to rollback each service
- [ ] **🆕 Runbook**: Document common operational procedures

### 11.11 — Go Live! 🚀

- [ ] Point DNS to production servers
- [ ] Enable production Razorpay keys (switch from test mode)
- [ ] Verify all webhooks work with production URLs
- [ ] Monitor error rates for first 24 hours
- [ ] Have hotfix branch ready for critical issues
- [ ] Celebrate! 🎉

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Admin dashboard | Users, revenue, and courses visible |
| Email notification system | All transactional emails sending |
| In-app notifications | Bell icon with unread count |
| Discussion forums | Students can create threads, reply |
| Production deployment | All services live and accessible |
| DNS + SSL | HTTPS working on all domains |
| Monitoring | Sentry, uptime checks, log aggregation active |
| Security hardening | Headers, rate limits, audit complete |
| Load testing | Performance targets met |
| Legal pages | ToS, Privacy, Cookies published |
| Go live | 🚀 Platform accessible to real users |

---

## 🧪 Tests to Write

- [ ] Integration: Super admin CRUD on platforms
- [ ] Integration: platform admin can only access own org data
- [ ] Integration: Notification created on enrollment
- [ ] Integration: Email sent on registration
- [ ] Integration: Discussion thread CRUD
- [ ] E2E: Super admin creates platform → admin logs in → invites user
- [ ] E2E: Full student journey from registration to certificate
- [ ] Load: 100 concurrent users browsing catalog
- [ ] Security: OWASP ZAP scan returns no high-severity issues

