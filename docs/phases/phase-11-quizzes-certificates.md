# Phase 11 — Quizzes & Certificates

> ⏱️ **Duration**: Weeks 18–19 (2 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 8

---

## 🎯 Objective

Build a per-module quiz engine with auto-grading, and auto-issue PDF certificates when students complete 100% of a course.

---

## ✅ Tasks

### 10.1 — Quiz Data Model

- [ ] Create database tables:
  - `Quiz` — id, moduleId, title, description, passingScore (%), timeLimit (minutes, optional), isPublished
  - `Question` — id, quizId, type (multiple_choice/short_answer/true_false), text, options (JSON array), correctAnswer, points, order
  - `QuizAttempt` — id, userId, quizId, score, totalPoints, passed, startedAt, completedAt
  - `QuestionResponse` — id, attemptId, questionId, selectedAnswer, isCorrect, pointsEarned
- [ ] **🆕 Question types**:
  - **Multiple Choice** — single correct answer from 4 options
  - **Multiple Select** — multiple correct answers from options
  - **True/False** — binary choice
  - **Short Answer** — text input, matched against correct answer (case-insensitive)
  - **Fill in the Blank** — sentence with blank, match answer

### 10.2 — Quiz Builder (Instructor)

- [ ] Quiz builder page (part of course editor):
  - Create quiz linked to a module
  - Add/edit/delete/reorder questions
  - Set passing score (default: 70%)
  - Set time limit (optional)
  - Preview quiz as student would see it
  - Publish/unpublish quiz
- [ ] Question editor:
  - Question text (rich text, supports images)
  - Option editor (for multiple choice):
    - Add/remove options (min 2, max 6)
    - Mark correct answer(s)
    - Optional: explanation for each option (shown after submission)
  - Points per question (default: 1)
  - **🆕 Question bank**: Save questions to reuse across quizzes
- [ ] API endpoints:
  - `POST /api/quizzes` — create quiz
  - `PATCH /api/quizzes/:id` — update quiz
  - `DELETE /api/quizzes/:id` — delete quiz
  - `POST /api/quizzes/:id/questions` — add question
  - `PATCH /api/questions/:id` — update question
  - `DELETE /api/questions/:id` — delete question
  - `PATCH /api/quizzes/:id/questions/reorder` — reorder questions

### 10.3 — Quiz Taking (Student)

- [ ] Quiz page: `/quiz/[quizId]`
  - Display questions one at a time or all at once (configurable)
  - Timer countdown (if time limit set)
  - Progress indicator (question X of Y)
  - Navigation: next/previous, jump to question
  - "Submit Quiz" button with confirmation
- [ ] Quiz logic:
  - Record start time
  - Prevent multiple submissions
  - Auto-submit when timer expires
  - Calculate score immediately on submission
- [ ] Results page:
  - Score display: X/Y points (percentage)
  - Pass/fail indicator
  - Per-question review:
    - Show correct/incorrect for each question
    - Show correct answer if incorrect
    - Show explanation (if provided by instructor)
  - **🆕 Retry policy**: configurable retries per quiz (unlimited / 3 / 1)
  - "Retake Quiz" button (if retries remaining)

### 10.4 — Auto-Grading

- [ ] Grade immediately on submission:
  - **Multiple choice**: Exact match with correct answer
  - **Multiple select**: Partial credit (correct selections / total correct answers)
  - **True/False**: Exact match
  - **Short answer**: Case-insensitive string match (with trimming)
  - **Fill in the blank**: Case-insensitive match
- [ ] Calculate total score as percentage
- [ ] Determine pass/fail against passing score threshold
- [ ] Store attempt results in `QuizAttempt` + `QuestionResponse`
- [ ] **🆕 Grade analytics for instructor**:
  - Average score per quiz
  - Pass rate
  - Most commonly missed questions
  - Score distribution chart

### 10.5 — Certificate Generation

- [ ] Certificate issuance logic:
  - Trigger when course completion = 100% (all recordings watched + all quizzes passed)
  - Check if certificate already issued (prevent duplicates)
  - Generate certificate
  - Store record in `Certificate` table with unique `verificationCode`
  - Send email with certificate attached
- [ ] PDF certificate design:
  - Use **PDFKit** or **@react-pdf/renderer** for generation
  - Include:
    - Student name
    - Course title
    - Instructor name
    - platform/organisation name and logo
    - Completion date
    - Unique verification code (6-char alphanumeric)
    - **🆕 QR code** linking to verification page
  - Professional design with border, watermark, signatures
- [ ] Certificate storage:
  - Store generated PDF on cloud storage (S3/R2)
  - Store URL in `Certificate` table
  - Allow student to download from dashboard

### 10.6 — Certificate Verification

- [ ] Public verification page: `/verify/[verificationCode]`
  - No authentication required (public URL)
  - Display: student name, course title, issued date, platform name
  - "This certificate is valid" or "Certificate not found"
  - **🆕 Anti-fraud**: Show certificate image preview to match visual design
- [ ] API endpoint: `GET /api/certificates/verify/:code`
  - Returns certificate data if valid
  - Returns 404 if not found

### 10.7 — 🆕 Certificate Background Job

- [ ] Create Bull job: `certificateIssue.job.ts`
  - Triggered when progress reaches 100%
  - Generates PDF
  - Uploads to storage
  - Updates `Certificate` record with URL
  - Sends email notification
  - Retry: 3 times with backoff (PDF generation can fail)
- [ ] Also triggered by quiz completion (check if all course requirements now met)

### 10.8 — 🆕 Student Achievement Page

- [ ] Student certificates page: `/certificates`
  - Grid of earned certificates with course thumbnails
  - Download PDF button for each
  - Share button (copy verification URL)
  - **LinkedIn share** button (deep link to add certification)

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Quiz builder | Instructor creates quiz with multiple question types |
| Quiz taking experience | Student completes quiz with timer |
| Auto-grading | Score calculated immediately on submission |
| Quiz results review | Student sees correct/incorrect answers |
| Certificate generation | PDF generated on 100% completion |
| Certificate verification | Public URL validates certificate |
| Certificate download | Student downloads from dashboard |
| Grade analytics | Instructor sees quiz performance stats |
| Achievement page | Student sees all earned certificates |

---

## 🧪 Tests to Write

- [ ] Unit: Multiple choice grading (correct/incorrect)
- [ ] Unit: Multiple select partial credit calculation
- [ ] Unit: Short answer case-insensitive matching
- [ ] Unit: Score percentage calculation
- [ ] Unit: Pass/fail threshold logic
- [ ] Unit: Certificate verification code generation (uniqueness)
- [ ] Integration: Quiz submission creates attempt + responses
- [ ] Integration: 100% completion triggers certificate job
- [ ] Integration: Certificate PDF generated with correct data
- [ ] Integration: Verification endpoint returns valid certificate
- [ ] E2E: Student takes quiz → sees results → retakes if failed
- [ ] E2E: Student completes all course content → certificate generated → downloads

