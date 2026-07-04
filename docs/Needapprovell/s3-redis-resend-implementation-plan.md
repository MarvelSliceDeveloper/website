# S3 Uploads + Redis Queue + Resend Email - Implementation Plan

## Overview

Add production-ready file storage (S3), background job processing (Redis/BullMQ), and transactional email (Resend) to the LMS platform.

---

## Current Architecture Analysis

| Component           | Current State                                                | Gap                                  |
| ------------------- | ------------------------------------------------------------ | ------------------------------------ |
| **Uploads**         | Multer + local disk (`/uploads`) served via `express.static` | No S3, no presigned URLs, no CDN     |
| **Background Jobs** | `setInterval` in `recording-sync.job.ts`                     | No queue, no retries, no persistence |
| **Email**           | None (in-app notifications only)                             | No email provider, no templates      |
| **Redis**           | Configured in `.env` but unused                              | No BullMQ, no queues                 |

---

## 1. S3 Storage Provider (Video + Image Uploads)

### New Files to Create

```
apps/api/src/lib/storage/
├── index.ts              # StorageProvider interface + factory
├── s3.provider.ts        # S3 implementation (AWS SDK v3)
├── local.provider.ts     # Local fallback (existing multer logic)
├── presigned-urls.ts     # Presigned URL generation for direct uploads
└── types.ts              # Shared types (UploadResult, PresignedUrlOptions)
```

### Updated Files

| File                                                 | Changes                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/api/package.json`                              | Add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`                                                 |
| `.env.example`                                       | Add `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_CDN_URL`, `UPLOAD_PROVIDER=s3\|local` |
| `apps/api/src/modules/courses/modules.upload.ts`     | Refactor to use `StorageProvider`; support video MIME types                                               |
| `apps/api/src/modules/courses/course.upload`         | Use storage provider; add video support for course trailers                                               |
| `apps/api/src/modules/assignments/assignment.upload` | Use storage provider                                                                                      |
| `apps/api/src/index.ts`                              | Remove `express.static('/uploads')`; add presigned URL endpoint                                           |
| `apps/api/prisma/schema.prisma`                      | Add `storageProvider`, `storageKey` fields to `Course`, `Module`, `Assignment`                            |

### Upload Flow Options

| Approach                                 | Pros                          | Cons                                    |
| ---------------------------------------- | ----------------------------- | --------------------------------------- |
| **Server-side (multer → S3)**            | Simple, validated             | Server bandwidth bottleneck             |
| **Presigned URLs (direct browser → S3)** | Scalable, no server bandwidth | Requires CORS config, client-side logic |

**Recommendation**: Support both. Server-side for small files (<50MB), presigned URLs for videos (>50MB).

### Video MIME Types to Add

```typescript
// modules.upload.ts additions
("video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska");
```

---

## 2. Redis Queue Management (BullMQ)

### New Files to Create

```
apps/api/src/lib/queue/
├── index.ts              # Queue factory, connection config
├── queues.ts             # Queue definitions (names, options)
├── workers/
│   ├── index.ts          # Worker registry + startup
│   ├── recording-sync.worker.ts    # Migrate from recording-sync.job.ts
│   ├── email.worker.ts             # Resend email sending
│   ├── webhook.worker.ts           # External webhooks (Razorpay, Teams)
│   └── upload-processing.worker.ts # Video transcoding, thumbnails
├── jobs/
│   ├── recording-sync.job.ts       # Job payload types + handlers
│   ├── email.job.ts
│   └── webhook.job.ts
└── metrics.ts            # Optional: queue metrics endpoint
```

### Updated Files

| File                                      | Changes                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `apps/api/package.json`                   | Add `bullmq`, `ioredis`                               |
| `apps/api/src/index.ts`                   | Initialize queue connection, start workers            |
| `apps/api/src/jobs/recording-sync.job.ts` | **Delete** → move logic to worker                     |
| `.env.example`                            | Add `REDIS_URL` (already exists), `QUEUE_CONCURRENCY` |

### Queue Definitions

| Queue               | Concurrency | Retry            | Use Case                      |
| ------------------- | ----------- | ---------------- | ----------------------------- |
| `recording-sync`    | 2           | 3x (exp backoff) | Poll Teams for recordings     |
| `email`             | 10          | 5x               | Send emails via Resend        |
| `webhooks`          | 5           | 3x               | Razorpay, Teams webhooks      |
| `upload-processing` | 2           | 2x               | Video thumbnails, transcoding |

### Job Payload Examples

```typescript
// recording-sync.job.ts
interface RecordingSyncJob {
  sessionId: string;
  attempt: number;
}

// email.job.ts
interface EmailJob {
  to: string;
  template:
    | "session-scheduled"
    | "recording-ready"
    | "assignment-graded"
    | "welcome"
    | "password-reset";
  data: Record<string, unknown>;
}
```

---

## 3. Resend Email Integration

### New Files to Create

```
apps/api/src/lib/email/
├── index.ts              # EmailService interface + factory
├── resend.provider.ts    # Resend implementation
├── templates/
│   ├── index.ts          # Template registry
│   ├── session-scheduled.tsx
│   ├── recording-ready.tsx
│   ├── assignment-graded.tsx
│   ├── welcome.tsx
│   └── password-reset.tsx
└── types.ts              # EmailTemplate, SendOptions
```

### Updated Files

| File                                                         | Changes                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `apps/api/package.json`                                      | Add `resend`, `@react-email/components`, `@react-email/render` |
| `.env.example`                                               | Add `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`           |
| `apps/api/src/modules/notifications/notification.service.ts` | Add `sendEmailNotification()`; integrate with email queue      |
| `apps/api/prisma/schema.prisma`                              | Add `email` field to `NotificationPreference` (already exists) |

### Email Templates (React Email)

- Use `@react-email/components` for consistent HTML emails
- Support both HTML and text versions
- Template variables typed via TypeScript

### Integration Flow

```
NotificationService.notifySessionScheduled()
  → notificationService.createMany() [in-app]
  → notificationService.getPreferences() [check email: true]
  → emailQueue.add('email', { to, template, data }) [async]
```

---

## 4. Database Schema Updates

```prisma
// apps/api/prisma/schema.prisma additions

model Course {
  // ...existing fields
  thumbnailUrl      String?
  thumbnailKey      String?   // S3 key
  thumbnailProvider String?   // 's3' | 'local'
  coverImageUrl     String?
  coverImageKey     String?
  coverImageProvider String?
  trailerVideoUrl   String?
  trailerVideoKey   String?
  trailerVideoProvider String?
}

model Module {
  // ...existing fields
  videoType         String?   // 'upload' | 'youtube' | 'vimeo' | 'loom' | 'url'
  videoUrl          String?
  videoKey          String?   // S3 key for uploaded videos
  videoProvider     String?   // 's3' | 'local'
  videoEmbedId      String?
  durationSeconds   Int?
}

model Assignment {
  // ...existing fields
  questionPdfUrl    String?
  questionPdfKey    String?
  questionPdfProvider String?
}

model NotificationPreference {
  // ...existing fields
  email             Boolean @default(false)  // Already exists!
}
```

Run: `pnpm prisma:generate && pnpm prisma:push`

---

## 5. Environment Variables (`.env.example` additions)

```env
# Storage
UPLOAD_PROVIDER=s3          # s3 | local
S3_BUCKET=lms-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_CDN_URL=https://cdn.example.com  # Optional CloudFront/CDN URL

# Queue
REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM="LMS <noreply@lms.example.com>"
EMAIL_REPLY_TO="support@lms.example.com"

# Existing (verify these exist)
DATABASE_URL=postgresql://...
JWT_SECRET=...
TOKEN_ENCRYPTION_KEY=...
```

---

## 6. Implementation Phases

| Phase                       | Tasks                                                                   | Est. Effort |
| --------------------------- | ----------------------------------------------------------------------- | ----------- |
| **1. Foundation**           | Add deps, env vars, storage interface, S3 provider, local provider      | 2-3 hrs     |
| **2. Upload Migration**     | Refactor 3 upload modules, add video support, presigned URLs, DB schema | 3-4 hrs     |
| **3. Queue Infrastructure** | BullMQ setup, connection, worker registry, metrics endpoint             | 2-3 hrs     |
| **4. Job Migration**        | Move recording-sync to worker, add email/webhook/upload-processing jobs | 2-3 hrs     |
| **5. Email System**         | Resend provider, React Email templates, notification integration        | 3-4 hrs     |
| **6. Testing & Polish**     | Unit tests, integration tests, E2E upload/email flow                    | 2-3 hrs     |

**Total: ~14-20 hours**

---

## 7. Key Decisions Needed

| Decision                  | Options                                      | Recommendation                                       |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **Video upload approach** | Server-side (multer→S3) vs Presigned URLs    | **Both**: server-side <50MB, presigned >50MB         |
| **Video transcoding**     | None, FFmpeg on server, AWS MediaConvert     | **Phase 2**: Start with none, add MediaConvert later |
| **Email templates**       | React Email (TSX) vs Handlebars/MJML         | **React Email** - type-safe, component-based         |
| **Queue monitoring**      | BullMQ built-in + custom `/api/queues/stats` | Add simple metrics endpoint                          |
| **Local dev S3**          | MinIO, LocalStack, real S3                   | **MinIO** via docker-compose                         |

---

## 8. Testing Strategy

| Test Type       | Coverage                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| **Unit**        | Storage providers, email templates, queue job handlers                               |
| **Integration** | Upload → S3 → DB, Email queue → Resend, Recording sync job                           |
| **E2E**         | Course creation with video upload, Assignment submission, Session scheduling → email |

---

## Questions Before Implementation

1. **Video max size**: Current module resource limit is 50MB. Increase for videos? (Recommend: 2GB via presigned URLs)
2. **CDN**: Use CloudFront/Cloudflare in front of S3? Need `S3_CDN_URL` config.
3. **Video processing**: Generate thumbnails? Transcode to HLS/DASH? (Phase 2)
4. **Email domain**: Use Resend's shared domain or custom domain?
5. **Queue dashboard**: Add Bull Board for monitoring? (optional)

---

## File Structure Summary

```
apps/api/
├── src/
│   ├── lib/
│   │   ├── storage/          # NEW: Storage abstraction
│   │   │   ├── index.ts
│   │   │   ├── s3.provider.ts
│   │   │   ├── local.provider.ts
│   │   │   ├── presigned-urls.ts
│   │   │   └── types.ts
│   │   ├── queue/            # NEW: BullMQ queue system
│   │   │   ├── index.ts
│   │   │   ├── queues.ts
│   │   │   ├── workers/
│   │   │   │   ├── index.ts
│   │   │   │   ├── recording-sync.worker.ts
│   │   │   │   ├── email.worker.ts
│   │   │   │   ├── webhook.worker.ts
│   │   │   │   └── upload-processing.worker.ts
│   │   │   ├── jobs/
│   │   │   │   ├── recording-sync.job.ts
│   │   │   │   ├── email.job.ts
│   │   │   │   └── webhook.job.ts
│   │   │   └── metrics.ts
│   │   └── email/            # NEW: Resend email system
│   │       ├── index.ts
│   │       ├── resend.provider.ts
│   │       ├── templates/
│   │       │   ├── index.ts
│   │       │   ├── session-scheduled.tsx
│   │       │   ├── recording-ready.tsx
│   │       │   ├── assignment-graded.tsx
│   │       │   ├── welcome.tsx
│   │       │   └── password-reset.tsx
│   │       └── types.ts
│   ├── modules/
│   │   ├── courses/
│   │   │   ├── modules.upload.ts      # UPDATED
│   │   │   ├── course.upload.ts       # UPDATED
│   │   │   └── ...
│   │   ├── assignments/
│   │   │   ├── assignment.upload.ts   # UPDATED
│   │   │   └── ...
│   │   └── notifications/
│   │       └── notification.service.ts # UPDATED
│   ├── index.ts                         # UPDATED
│   └── jobs/
│       └── recording-sync.job.ts        # DELETE (moved to worker)
├── prisma/
│   └── schema.prisma                    # UPDATED
├── package.json                         # UPDATED
└── .env.example                         # UPDATED
```
