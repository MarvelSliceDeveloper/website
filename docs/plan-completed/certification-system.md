# Certification System Enhancement Plan

## Goals

1. Auto-generate certificates when a student completes ALL course requirements
2. Support two certificate output options: jsPDF generated + uploaded PDF template with placeholders
3. Add admin certificate upload with placeholder fields
4. Update student UI to show auto-issued certificates

## Current State

- Manual "claim" flow: student clicks claim after course completion
- Progress only checks recordings (video completion) — ignores quizzes & assignments
- jsPDF generates certificate dynamically from template styling
- No auto-issue trigger exists

## Implementation Steps

### Step 1: Schema Changes

- Add `pdfTemplateUrl` (String?) to `CertificateTemplate` — URL of uploaded PDF template
- Add `pdfTemplateFields` (Json?) to `CertificateTemplate` — e.g. `[{key: "studentName", label: "Student Name", x: 100, y: 150, fontSize: 22, color: "#1e293b"}]`
- Add `uploadedTemplateId` (String?) to `Certificate` — links to which uploaded template was used

### Step 2: Completion Check Service

- Create `certificate-completion.service.ts`:
  - `getCourseContentProgress(userId, courseId)` — checks:
    - Lessons: all with `durationSeconds` are considered "watched" if `Progress.completedAt` is set (via recordings)
    - Quizzes: all quizzes have a `QuizAttempt` with `status: GRADED` or `SUBMITTED`
    - Assignments: all module-level assignments have `AssignmentSubmission` with `status: GRADED`
  - `checkAndAutoIssueCertificate(userId, courseId)` — if all complete, auto-create Certificate

### Step 3: Auto-issue Triggers

Add calls to `checkAndAutoIssueCertificate` in:

- Quiz submit endpoint (after quiz is graded)
- Assignment grade endpoint (when admin grades)
- (Recording completion is already handled implicitly by the claim check)

### Step 4: PDF Template Upload

- Add admin endpoint `POST /api/admin/certificate-templates/:id/upload-pdf`
- Store PDF via multer, replace placeholders with text overlay using pdf-lib
- Two placeholder options:
  1. **Text overlay** — upload completed PDF, define text fields (x, y, font size, color) where dynamic content is overlaid
  2. **PDF replacement** — upload PDF with `{{placeholder}}` text, replace with actual values

### Step 5: Student UI Updates

- Remove manual "Claim" button — certificates auto-appear
- Show "Certificate Available" notification
- Keep download button in certificates page

### Step 6: Admin UI Updates

- Add PDF template upload to template editor
- Add placeholder field editor (add/remove text fields)

## Files to Create/Modify

### Schema

- `apps/api/prisma/schema.prisma` — add fields to CertificateTemplate, Certificate

### New API Files

- `apps/api/src/modules/certificates/certificate-completion.service.ts`
- `apps/api/src/modules/certificates/certificate-template-upload.routes.ts`

### Modified API Files

- `apps/api/src/modules/certificates/certificate.service.ts` — add auto-issue logic
- `apps/api/src/modules/certificates/certificate.controller.ts` — add auto-issue endpoint
- `apps/api/src/modules/certificates/certificate.routes.ts` — add routes
- `apps/api/src/modules/courses/quiz.controller.ts` — trigger after quiz submit
- `apps/api/src/modules/assignments/assignment.controller.ts` — trigger after grade
- `apps/api/src/modules/admin/certificates/template.routes.ts` — add upload endpoint

### Modified Student UI

- `apps/web/src/app/student/_views/CertificatesView.tsx` — auto-display, remove claim button
- `apps/web/src/lib/api-types.ts` — update types

### Modified Admin UI

- `apps/web/src/app/admin/certificates/page.tsx` — add template upload UI
