# Certification Module Plan

## Current State

- **Certificate auto-issue**: Based on completing ALL quizzes + assignments across ALL modules
- **Special Exams**: Quiz model has `isSpecialExam` flag, but it's just a quiz inside a regular module
- **No timer**: Quiz model has no duration/timer field
- **No dedicated certification section**: Certifications are buried inside module content

## Goal

Add a **dedicated Certification Module** at the course level — a special module that serves as the final gate for certificate issuance. When a student passes this certification exam (60%+), the certificate is auto-issued.

## Design

### 1. Database Changes (Prisma Schema)

**Module model** — add certification flag:
```prisma
model Module {
  ...existing fields...
  isCertificationModule  Boolean  @default(false)  // NEW: marks this as the certification module
}
```

**Quiz model** — add timer:
```prisma
model Quiz {
  ...existing fields...
  durationMinutes  Int?  // NEW: exam time limit in minutes (null = no limit)
}
```

### 2. Backend Changes

#### A. Course Service
- When creating a course, auto-create a certification module (or allow admin to designate one)
- Ensure only ONE certification module per course
- Certification module appears at the end of the module list (highest order)

#### B. Quiz Service
- Add `durationMinutes` field to quiz creation/update
- Enforce timer on quiz attempts when `durationMinutes` is set
- Auto-submit when time expires

#### C. Certificate Completion Service
- Update `getCourseContentProgress()` to check certification module separately
- If course has a certification module:
  - Certificate issued ONLY when certification quiz is passed (60%+)
  - Regular module completion is NOT required (or optionally required)
- If course has NO certification module:
  - Keep existing behavior (all modules must be completed)

#### D. New API Endpoints
- `POST /api/admin/courses/:courseId/certification-module` — create/get certification module
- `PUT /api/admin/courses/:courseId/certification-module` — update certification module settings
- `GET /api/student/courses/:courseId/certification` — get certification exam details + status

### 3. Admin UX Changes

#### Course Builder — New "Certification" Tab
- Add a 4th tab: "Content" | "Sessions" | "Recordings" | **"Certification"**
- Certification tab shows:
  - Toggle: "Enable Certification Exam" (on/off)
  - Quiz configuration (MCQ questions, passing score 60%)
  - Timer settings (duration in minutes)
  - Assignment configuration (optional file upload)
  - Preview of what students will see

#### Course Content Tab
- Certification module appears at the END of the module list
- Visually distinct (gold/amber badge, lock icon)
- Cannot be deleted like regular modules
- Cannot be reordered (always last)

### 4. Student UX Changes

#### Course Content View
- After completing all regular modules, show "Certification Exam" section
- Prominent CTA: "Take Certification Exam"
- Exam page shows:
  - Timer countdown
  - MCQ questions
  - Assignment upload (if configured)
  - Submit button

#### Results
- Show pass/fail with score
- If passed (60%+): Certificate auto-issued, show "Download Certificate" CTA
- If failed: Show "Retake Exam" option (with cooldown if configured)

### 5. Certificate Logic Update

```typescript
// Updated checkAndIssueCertificate
async function checkAndIssueCertificate(userId, courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { where: { isCertificationModule: true } } }
  });

  if (course.modules.length > 0) {
    // Course HAS certification module — check only that
    const certModule = course.modules[0];
    const quiz = await prisma.quiz.findFirst({
      where: { moduleId: certModule.id, isSpecialExam: true }
    });
    
    if (!quiz) return { issued: false, reason: "No certification exam found" };
    
    const attempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id, status: { not: "PENDING" } },
      orderBy: { percentage: "desc" }
    });
    
    if (!attempt || attempt.percentage < 60) {
      return { issued: false, reason: "Certification exam not passed" };
    }
    
    // Passed! Issue certificate
    await prisma.certificate.create({ ... });
    return { issued: true };
  } else {
    // Course has NO certification module — use existing logic
    return existingCheckLogic(userId, courseId);
  }
}
```

## Implementation Order

1. **Schema + Migration** — Add `isCertificationModule` to Module, `durationMinutes` to Quiz
2. **Backend Services** — Certification module CRUD, timer logic, certificate update
3. **Admin UI** — Certification tab in course builder
4. **Student UI** — Certification exam view + timer
5. **Testing** — End-to-end flow verification

## Files to Modify

### Backend
- `apps/api/prisma/schema.prisma` — Add new fields
- `apps/api/src/modules/courses/course.service.ts` — Certification module logic
- `apps/api/src/modules/courses/quiz.service.ts` — Timer + duration
- `apps/api/src/modules/certificates/certificate-completion.service.ts` — Updated logic
- `apps/api/src/modules/certificates/certificate.routes.ts` — New endpoints

### Frontend
- `apps/web/src/app/admin/courses/[id]/page.tsx` — Add Certification tab
- `apps/web/src/app/admin/courses/[id]/_components/CertificationTab.tsx` — NEW
- `apps/web/src/app/student/_views/_comps/CertificationExamView.tsx` — NEW
- `apps/web/src/app/student/_views/CourseContentView.tsx` — Show certification module

## Open Questions

1. Should regular module completion be REQUIRED before taking the certification exam? (Recommended: Yes)
2. Should there be a retry limit on the certification exam? (Recommended: Unlimited, with cooldown)
3. Should the certification exam have a time limit? (Recommended: Yes, configurable)
4. Should the assignment part be optional? (Recommended: Yes, admin can toggle)

## Success Criteria

- [ ] Admin can create/enable certification exam for a course
- [ ] Certification exam appears at the end of course content
- [ ] Student can take timed exam with MCQ + assignment
- [ ] Certificate auto-issues when student passes (60%+)
- [ ] Existing courses without certification exams continue to work
- [ ] Package-level special exams still work as before
