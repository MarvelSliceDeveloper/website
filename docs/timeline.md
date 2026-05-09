# LMS Portal — Timeline & Milestones

---

## 📊 Revised Timeline Overview

> ⚠️ The original plan estimated **17 weeks**. After detailed task analysis, the realistic estimate is **23 weeks (~5.5 months)** including Phase 0 and buffers for complex integration phases.

| # | Phase | Weeks | Duration | Original |
|---|-------|-------|----------|----------|
| 0 | **Pre-Build Foundation** (🆕) | 0 | 1 week | *not in original* |
| 1 | Foundation & Setup | 1 | 1 week | 1 week ✓ |
| 2 | Authentication | 2–4 | 3 weeks | 2 weeks ⬆️ |
| 3 | Multi-Tenancy | 4–5 | 2 weeks | 2 weeks ✓ |
| 4 | Azure AD & Graph API Setup | 5–7 | 3 weeks | 2 weeks ⬆️ |
| 5 | Calendar Sync & UI | 7–8 | 2 weeks | 2 weeks ✓ |
| 6 | Live Sessions | 9–11 | 3 weeks | 2 weeks ⬆️ |
| 7 | Recordings | 11–12 | 2 weeks | 2 weeks ✓ |
| 8 | LMS Core | 13–16 | 4 weeks | 2 weeks ⬆️⬆️ |
| 9 | Payments (Razorpay) | 16–17 | 2 weeks | 1 week ⬆️ |
| 10 | Quizzes & Certificates | 18–19 | 2 weeks | 2 weeks ✓ |
| 11 | Admin Panel & Launch | 20–23 | 4 weeks | 2 weeks ⬆️⬆️ |
| | **Total** | | **23 weeks** | **17 weeks** |

### Why the Extensions?

| Phase | Added Time | Reason |
|-------|-----------|--------|
| Phase 0 | +1 week | CI/CD, testing, monitoring setup — not in original plan |
| Phase 2 | +1 week | MS OAuth + MSAL + NextAuth + token encryption + role middleware + refresh jobs |
| Phase 4 | +1 week | Azure AD debugging, admin consent flows, Graph API client with retry logic |
| Phase 6 | +1 week | Webhook debugging, ngrok, subscription renewal, attendance tracking |
| Phase 8 | +2 weeks | This is the entire LMS: 6+ pages, courses, enrollment, dashboard, catalog, search, uploads |
| Phase 9 | +1 week | 3 monetisation models, webhook verification, refunds, invoices |
| Phase 11 | +2 weeks | Full deployment, monitoring, security hardening, load testing, email system, forums |

---

## 📈 Gantt Chart (Text)

```
Week  0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23
      ├──┤
 P0   █████  Pre-Build Foundation
         ├──┤
 P1      █████  Foundation & Setup
            ├────────┤
 P2         ██████████████  Authentication
                     ├──────┤
 P3                  █████████  Multi-Tenancy
                        ├──────────┤
 P4                     ████████████████  Azure AD + Graph
                                 ├──────┤
 P5                              █████████  Calendar Sync
                                       ├──────────┤
 P6                                    ████████████████  Live Sessions
                                                ├──────┤
 P7                                             █████████  Recordings
                                                      ├──────────────┤
 P8                                                   ████████████████████  LMS Core
                                                                     ├──────┤
 P9                                                                  █████████  Payments
                                                                           ├──────┤
 P10                                                                       █████████  Quizzes+Certs
                                                                                 ├──────────────┤
 P11                                                                             ████████████████████  Admin+Launch
```

---

## 🏁 Key Milestones

| # | Milestone | Target | Verification Criteria |
|---|-----------|--------|----------------------|
| M1 | **Dev Infrastructure Ready** | End of Week 0 | CI/CD pipeline running, tests configured, Sentry active |
| M2 | **Auth + Tenant Shell Live** | End of Week 5 | Users can register/login (email + MS OAuth), routed to their tenant |
| M3 | **MS Calendar Integrated** | End of Week 8 | Calendar page shows events synced from MS Calendar, "Live Now" badge works |
| M4 | **Live Sessions + Recordings E2E** | End of Week 12 | Instructors schedule meetings, students join live and watch recordings after |
| M5 | **Full LMS Core Working** | End of Week 16 | Courses, modules, enrollment, progress, dashboard, catalog — all functional |
| M6 | **Payments Live** | End of Week 17 | Students purchase via Razorpay, auto-enrolled on payment |
| M7 | **Production Launch** 🚀 | End of Week 23 | Full platform deployed, admin panels live, monitored, hardened |

---

## 🔄 Phase Dependencies

```
Phase 0 (Pre-Build)
  └──▶ Phase 1 (Foundation)
         ├──▶ Phase 2 (Auth)
         │      └──▶ Phase 3 (Multi-Tenancy)
         │             └──▶ Phase 4 (Azure AD + Graph)
         │                    ├──▶ Phase 5 (Calendar)
         │                    │      └──▶ Phase 6 (Live Sessions)
         │                    │             └──▶ Phase 7 (Recordings)
         │                    │                    └──▶ Phase 8 (LMS Core)
         │                    │                           ├──▶ Phase 9 (Payments)
         │                    │                           └──▶ Phase 10 (Quizzes + Certs)
         │                    │                                  └──▶ Phase 11 (Admin + Launch)
         │                    └──▶ (Graph client used by Phases 5, 6, 7)
         └──▶ (Schema used by all phases)
```

---

## ⚠️ Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| MS Graph API changes / deprecations | High | Pin API version (`v1.0`), monitor MS Graph changelogs |
| Azure AD admin consent delays | Medium | Start consent process early (Phase 4), have test tenant ready |
| Razorpay webhook failures in production | High | Idempotent processing, dead-letter queue, manual retry endpoint |
| SharePoint URL expiry edge cases | Medium | Always re-fetch on play, Redis cache with 50-min TTL |
| Multi-tenancy data leak | Critical | RLS + Prisma middleware + extensive testing |
| Scope creep (new features during build) | High | Stick to phase plan, park new ideas in backlog |
| Single developer bottleneck | Medium | Document everything, keep code modular, write tests |

---

## 📝 Progress Tracking

Use this section to track actual progress against the plan:

| Phase | Planned Start | Actual Start | Planned End | Actual End | Status |
|-------|-------------|-------------|------------|-----------|--------|
| 0 | Week 0 | — | Week 0 | — | ⬜ Not Started |
| 1 | Week 1 | — | Week 1 | — | ⬜ Not Started |
| 2 | Week 2 | — | Week 4 | — | ⬜ Not Started |
| 3 | Week 4 | — | Week 5 | — | ⬜ Not Started |
| 4 | Week 5 | — | Week 7 | — | ⬜ Not Started |
| 5 | Week 7 | — | Week 8 | — | ⬜ Not Started |
| 6 | Week 9 | — | Week 11 | — | ⬜ Not Started |
| 7 | Week 11 | — | Week 12 | — | ⬜ Not Started |
| 8 | Week 13 | — | Week 16 | — | ⬜ Not Started |
| 9 | Week 16 | — | Week 17 | — | ⬜ Not Started |
| 10 | Week 18 | — | Week 19 | — | ⬜ Not Started |
| 11 | Week 20 | — | Week 23 | — | ⬜ Not Started |

