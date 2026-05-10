# Phase 4 — Batch & Enrollment Management

> ⏱️ **Duration**: Weeks 6–7 (2 weeks)  
> 📌 **Status**: Pending  
> 🔗 **Depends on**: Phase 3

---

## 🎯 Objective

Implement the core logic for cohorts (Batches) and the enrollment approval workflow. In this model, students self-enroll (creating a pending request), and Admins manually approve and assign them to a specific Batch.

---

## ✅ Tasks

### 4.1 — Batch CRUD Operations

- [ ] Create API endpoints for Batch management (Admin only):
  - `POST /api/batches` (Create a batch for a specific course)
  - `GET /api/batches` (List batches)
  - `PUT /api/batches/:id` (Update batch dates/details)
- [ ] Connect batches to Courses and Instructors in Prisma schema
- [ ] Implement Admin UI for creating and managing batches

### 4.2 — Instructor Assignment

- [ ] Allow Admin to assign a Mentor/Instructor to a newly created batch
- [ ] Create Instructor Dashboard view: `GET /api/instructor/batches`
- [ ] Instructor UI to view their assigned batches and the students within them

### 4.3 — Enrollment Requests Workflow

- [ ] Update enrollment logic: When Student clicks "Enroll", create an `EnrollmentRequest` with `status: PENDING`
- [ ] Admin UI: Enrollment Requests dashboard to view all pending applications
- [ ] Admin approval flow:
  - Admin verifies manual payment
  - Admin clicks "Approve"
  - Admin selects which Batch to assign the student to
  - Update `EnrollmentRequest` to `status: APPROVED` and set `batchId`

### 4.4 — Student Batch Access

- [ ] Once approved, update the Student Dashboard to grant access to the Batch materials
- [ ] Ensure students can only see sessions and materials for the batch they are assigned to (Role/Batch Guard)

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Batch Management | Admin can create batches and assign instructors |
| Enrollment Workflow | Student applies → Admin approves → Student assigned to Batch |
| Access Control | Student only sees content for their assigned Batch |

---

## 🧪 Tests to Write

- [ ] Unit: Enrollment request is created with PENDING status
- [ ] Unit: Admin approval successfully assigns student to a Batch
- [ ] Integration: Student cannot access batch materials before approval
- [ ] E2E: Full enrollment flow from request to admin approval and dashboard access
