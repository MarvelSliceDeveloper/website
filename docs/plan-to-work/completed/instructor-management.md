# Plan: Instructor Management System

## Overview

Build full instructor management: profile model, admin CRUD, onboarding flow, super admin verification, assignment review queue.

---

## 1. Schema — InstructorProfile Model

```prisma
model InstructorProfile {
  id                       String   @id @default(cuid())
  userId                   String   @unique
  bio                      String?  @db.Text
  designation              String?  // e.g. "Senior Software Engineer"
  qualification            String?  // Highest degree
  experienceYears          Int?     // Years of experience
  skills                   Json?    // string[]
  currentlyEmployed        Boolean  @default(false)
  companyName              String?
  availableTime            String?  // e.g. "20 hrs/week", "Weekends"
  phone                    String?
  address                  String?  @db.Text
  city                     String?
  state                    String?
  country                  String?
  photoUrl                 String?
  resumeUrl                String?
  languages                Json?    // string[]
  socialLinks              Json?    // { linkedin, github, portfolio }
  bankName                 String?
  bankAccountNumber        String?  // Encrypted
  bankIfscCode             String?
  bankAccountHolderName    String?
  upiId                    String?
  joiningDate              DateTime?
  status                   InstructorStatus @default(PENDING) // PENDING | APPROVED | REJECTED | ACTIVE | INACTIVE
  rejectionReason          String?
  verifiedById             String?
  verifiedAt               DateTime?
  rating                   Float    @default(0)
  totalStudents            Int      @default(0)
  completedSessions        Int      @default(0)
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  verifiedBy User? @relation("InstructorVerifier", fields: [verifiedById], references: [id])
}

enum InstructorStatus {
  PENDING    // Profile created, awaiting verification
  APPROVED   // Verified by super admin, can work
  REJECTED   // Rejected with reason
  ACTIVE     // Currently active
  INACTIVE   // Temporarily inactive
}
```

### Instructor onboarding flag

- Add `instructorOnboardingComplete Boolean @default(false)` to User model
- When instructor logs in and profile is NOT filled, redirect to `/instructor/onboarding`
- After profile saved + super admin approves, set to true

---

## 2. Backend API Routes

### Admin Instructor Management (`/api/admin/instructors`)

| Method | Route                                      | Auth              | Description                                       |
| ------ | ------------------------------------------ | ----------------- | ------------------------------------------------- |
| GET    | `/api/admin/instructors`                   | ADMIN/SUPER_ADMIN | List instructors with workload (paginated)        |
| GET    | `/api/admin/instructors/:id`               | ADMIN/SUPER_ADMIN | Get instructor detail + profile                   |
| POST   | `/api/admin/instructors`                   | SUPER_ADMIN only  | Create instructor account (generates credentials) |
| PUT    | `/api/admin/instructors/:id`               | ADMIN/SUPER_ADMIN | Update instructor profile fields                  |
| PUT    | `/api/admin/instructors/:id/verify`        | SUPER_ADMIN only  | Approve/reject instructor profile                 |
| PUT    | `/api/admin/instructors/:id/status`        | SUPER_ADMIN only  | Activate/deactivate instructor                    |
| DELETE | `/api/admin/instructors/:id`               | SUPER_ADMIN only  | Soft-delete instructor                            |
| GET    | `/api/admin/instructors/:id/login-history` | ADMIN/SUPER_ADMIN | Login logs                                        |
| GET    | `/api/admin/instructors/:id/sessions`      | ADMIN/SUPER_ADMIN | Live sessions + attendance                        |
| GET    | `/api/admin/instructors/:id/assignments`   | ADMIN/SUPER_ADMIN | Assignment activity                               |
| GET    | `/api/admin/instructors/:id/mentorship`    | ADMIN/SUPER_ADMIN | Mentorship tickets                                |
| GET    | `/api/admin/instructors/:id/performance`   | ADMIN/SUPER_ADMIN | Performance metrics                               |

### Instructor Onboarding (`/api/instructor/profile`)

| Method | Route                                   | Auth                     | Description             |
| ------ | --------------------------------------- | ------------------------ | ----------------------- |
| GET    | `/api/instructor/profile`               | requireAuth + INSTRUCTOR | Get own profile         |
| PUT    | `/api/instructor/profile`               | requireAuth + INSTRUCTOR | Save/update own profile |
| POST   | `/api/instructor/profile/upload-photo`  | requireAuth + INSTRUCTOR | Upload profile photo    |
| POST   | `/api/instructor/profile/upload-resume` | requireAuth + INSTRUCTOR | Upload resume PDF       |

### Assignment Review Queue (`/api/admin/assignments/review`)

| Method | Route                                 | Auth              | Description                                         |
| ------ | ------------------------------------- | ----------------- | --------------------------------------------------- |
| GET    | `/api/admin/assignments/review`       | ADMIN/SUPER_ADMIN | List all pending submissions across all instructors |
| GET    | `/api/admin/assignments/review/stats` | ADMIN/SUPER_ADMIN | Review queue stats (pending/total/graded)           |

---

## 3. Frontend Pages

### Admin Pages

| Route                           | Page          | Description                                                                                      |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `/admin/instructors`            | List/Workload | Table of all instructors with workload info                                                      |
| `/admin/instructors/new`        | Create Form   | Create instructor account form                                                                   |
| `/admin/instructors/:id`        | Profile Page  | Tabbed profile: Overview, Login History, Sessions, Courses, Assignments, Mentorship, Performance |
| `/admin/instructors/:id/edit`   | Edit Form     | Edit instructor profile fields                                                                   |
| `/admin/instructors/:id/verify` | Verify        | Super admin verification modal/page                                                              |
| `/admin/assignments/review`     | Review Queue  | All pending submissions across instructors                                                       |

### Instructor Pages

| Route                    | Page              | Description                               |
| ------------------------ | ----------------- | ----------------------------------------- |
| `/instructor/onboarding` | Profile Form      | First-time profile creation (after login) |
| `/instructor/profile`    | View/Edit Profile | Settings tab for profile management       |

---

## 4. Instructor Onboarding Flow

1. Admin creates instructor → sends welcome email with credentials
2. Instructor logs in → `instructorOnboardingComplete === false` → redirect to `/instructor/onboarding`
3. Onboarding page: profile form with all fields (bio, skills, experience, bank details, etc.)
4. Instructor submits → creates `InstructorProfile` with status `PENDING`
5. Super Admin sees pending instructor in admin panel → reviews profile → approves/rejects
6. If approved → `status = APPROVED`, `instructorOnboardingComplete = true`, instructor can now access all features
7. If rejected → `status = REJECTED`, instructor sees rejection reason, can resubmit

---

## Implementation Order

1. Schema changes + prisma push
2. InstructorProfile backend (admin CRUD + instructor onboarding)
3. Assignment review backend
4. Admin instructor list page
5. Admin instructor profile page (tabs)
6. Admin create/edit instructor form
7. Admin assignment review queue page
8. Instructor onboarding page
9. Sidebar updates (admin + instructor)
10. Tests

## Files to Create

| File                                                           | Purpose                      |
| -------------------------------------------------------------- | ---------------------------- |
| `apps/api/src/modules/admin/instructors/instructors.routes.ts` | Admin instructor API         |
| `apps/api/src/modules/instructor/profile.routes.ts`            | Instructor own profile API   |
| `apps/web/src/app/admin/instructors/page.tsx`                  | Instructor list              |
| `apps/web/src/app/admin/instructors/new/page.tsx`              | Create instructor            |
| `apps/web/src/app/admin/instructors/[id]/page.tsx`             | Instructor profile with tabs |
| `apps/web/src/app/admin/instructors/[id]/edit/page.tsx`        | Edit instructor              |
| `apps/web/src/app/admin/assignments/review/page.tsx`           | Assignment review queue      |
| `apps/web/src/app/instructor/onboarding/page.tsx`              | Onboarding form              |
