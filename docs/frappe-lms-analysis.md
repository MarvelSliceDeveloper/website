# Frappe LMS Analysis — Feature Comparison & Porting Guide

**Source**: https://github.com/frappe/lms
**Stack**: Python (Frappe Framework) + Vue.js + MariaDB
**Our Stack**: Node.js/Express + Next.js/React + PostgreSQL + Prisma

**Key finding**: Different stack entirely — no code is copy-pasteable, but feature concepts and UX patterns are transferable.

---

## 1. Architecture Comparison

| Aspect    | Frappe LMS                                | Our LMS                                         |
| --------- | ----------------------------------------- | ----------------------------------------------- |
| Backend   | Frappe Framework (Python, WSGI, meta-DB)  | Express.js (TypeScript, Prisma ORM, PostgreSQL) |
| Frontend  | Vue 3 + Frappe UI + Vite                  | Next.js 16 (React 19, Tailwind 4, App Router)   |
| State     | Pinia stores                              | React hooks + URL hash-based routing            |
| API       | Frappe RPC `call()` (auto-generated CRUD) | RESTful Express routes with Zod validation      |
| Auth      | Frappe session-based                      | JWT + cookies, bcrypt                           |
| DB Schema | JSON doctype files → MariaDB              | Prisma schema → PostgreSQL                      |

---

## 2. Data Model Mapping

### Course Hierarchy

| Frappe LMS        | Our LMS                               | Notes                                           |
| ----------------- | ------------------------------------- | ----------------------------------------------- |
| LMS Course        | Course                                | Similar (title, description, thumbnail, status) |
| Course Chapter    | Module                                | Same concept, different name                    |
| Chapter Reference | contentOrder (JSON)                   | Bridge table pattern vs JSON ordering           |
| Course Lesson     | Lesson                                | Both support video, description                 |
| —                 | Quiz (separate model)                 | Frappe links quizzes into lessons as blocks     |
| —                 | Assignment (separate model)           | Same pattern                                    |
| LMS Batch         | Batch                                 | Both support                                    |
| LMS Enrollment    | EnrollmentRequest / PackageEnrollment | Different but equivalent                        |

### Content Types

| Frappe LMS                                     | Our LMS                            |
| ---------------------------------------------- | ---------------------------------- |
| Lesson body (rich text + video + block editor) | Lesson (video only)                |
| Quiz (inline block or standalone)              | Quiz model (separate module-level) |
| Assignment (file upload)                       | Assignment model (file upload)     |
| Programming Exercise                           | Not present                        |
| SCORM                                          | Not present                        |

---

## 3. Notable Features Worth Porting

### High Priority

| Feature                                                                                    | Frappe Implementation                                                           | Porting Complexity                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Block Editor** — unified lesson content (text, video, quiz, upload blocks in one editor) | `BlockEditor.vue` + `RichTextEditor.vue` + `QuizBlock.vue` + `UploadPlugin.vue` | **High** — requires new data model, editor component, API routes |
| **Per-lesson discussions** — threaded Q&A per lesson                                       | `Discussions.vue` + `DiscussionReplies.vue`                                     | **Medium** — new model + API + frontend                          |
| **Per-lesson notes** — private student notes                                               | `LMS Lesson Note` doctype                                                       | **Low** — similar to your notes page                             |

### Medium Priority

| Feature                                                          | Porting Complexity                    |
| ---------------------------------------------------------------- | ------------------------------------- |
| **Chapter-based URLs** (`/courses/:slug/learn/:chapter-:lesson`) | **Medium** — routing refactor         |
| **Command palette** (Cmd+K global search)                        | **Medium** — new component            |
| **Programs / course bundles**                                    | **Medium** — similar to your packages |
| **Batch/cohort timetable**                                       | **Medium** — schedule view            |
| **Evaluator scheduling** (1:1 evaluation)                        | **High** — new workflow               |

### Low Priority

| Feature                     | Porting Complexity |
| --------------------------- | ------------------ |
| Course card gradient colors | **Low**            |
| PWA install prompt          | **Low**            |
| Programming exercises       | **High**           |
| SCORM support               | **High**           |
| Job board / recruitment     | **Medium**         |
| Data import (CSV)           | **Medium**         |
| Guest access mode           | **Low**            |

---

## 4. What Can Be "Copied" vs Re-implemented

### Can study + re-implement (same logic, different code):

- **Data model relationships** — Course → Module/Chapter → Lesson hierarchy, Quiz ↔ Question ↔ Options, Assignment ↔ Submission
- **Business logic patterns** — Enrollment flow, progress tracking, quiz scoring, certificate issuance
- **UX flows** — How the block editor works (drag-drop blocks), how discussions are threaded per lesson, how evaluations are scheduled
- **URL structure** — Clean chapter-based lesson navigation

### Cannot copy (different stack):

- **Backend code** (Python → TypeScript)
- **Frontend components** (Vue SFCs → React TSX)
- **Database queries** (Frappe ORM → Prisma)
- **API definitions** (auto-generated → hand-crafted Express routes)

---

## 5. Suggested Implementation Order

1. **Block Editor** — Biggest UX win. Combines lesson text, video, quiz, and assignment into one unified editor
2. **Per-lesson discussions** — Highest engagement feature gap
3. **Chapter-based URLs** — Cleanest navigation improvement
4. **Per-lesson notes** — Low effort, high impact
5. **Command palette** — Navigation polish
6. **Evaluator scheduling** — Certification workflow improvement
