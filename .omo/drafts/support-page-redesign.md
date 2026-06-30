---
slug: support-page-redesign
status: completed
intent: clear
pending-action: write .omo/plans/support-page-redesign.md
approach: Extract monolithic page into components, add status filters + search, use shared components, fix navigation
deliverable: .omo/plans/support-page-redesign.md (written)
---

# Draft: support-page-redesign

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
1 | support/page.tsx → _comps/SupportTicketList.tsx, SupportTicketDetail.tsx, CreateTicketForm.tsx | active | extract and compose
2 | Status filter tabs (All/Open/In Progress/Resolved/Closed) | active | add to TicketList
3 | Search by title/description | active | add to TicketList
4 | Shared components usage (PageHeader, StatusBadge) | active | replace inline
5 | Navigation fix (/instructor → /instructor/dashboard) | active | fix back link
6 | Loading/empty states improvement | active | match card layout
7 | FAQ/Knowledge base section | deferred | Phase 2
8 | File upload for messages | deferred | Phase 2
9 | Rich text support | deferred | Phase 2

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
1. Use status filter tabs (like Inbox tab pattern) | default: tabs below page header | follows existing inbox.tsx pattern | easy to change
2. Search is simple text filter (client-side) | default: client-side filter on title+description | data is paginated, small list | easy to extract to API later
3. Component directory: _comps/ | default: follows assignments pattern (assignments/_comps/) | consistent with instructor panel convention | trivial to rename
4. New Ticket button → inline form (not modal) | default: keep as inline form | current UX uses toggle, no modal infrastructure needed | easy to change to modal later

## Findings (cited - path:lines)

### Current page structure
- `apps/web/src/app/instructor/support/page.tsx` — 299 lines, monolithic, handles list view, detail view, and create form
- Single `"use client"` component with all state in one function
- Three states managed by `selectedTicket` and `showCreate` booleans

### API endpoints
- `GET /api/tickets?type=SUPPORT` — list tickets (`apps/api/src/modules/support/support.routes.ts:24`)
- `GET /api/tickets/:id` — get single ticket with messages (`apps/api/src/modules/tickets/ticket.controller.ts:64`)
- `POST /api/tickets` — create ticket with type=SUPPORT (`support.routes.ts:23`)
- `POST /api/tickets/:id/messages` — add reply (`ticket.controller.ts:141`)
- `PATCH /api/tickets/:id/status` — admin-only status update (`ticket.controller.ts:168`)
- `GET /api/tickets/stats?type=SUPPORT` — ticket counts (`ticket.service.ts:289`)

### Data model
- `SupportTicket` — id, userId, title, description, status (OPEN|IN_PROGRESS|RESOLVED|CLOSED), createdAt, updatedAt, resolvedAt (`apps/api/prisma/schema.prisma:265-277`)
- `SupportMessage` — id, ticketId, senderId, message, createdAt (`schema.prisma:279-287`)
- API returns `_count: { messages: number }` in list endpoint

### Existing shared components
- `PageHeader` — role label + title + description + action (`apps/web/src/components/shared/PageHeader.tsx:1-22`)
- `EmptyState` — icon + title + description + action (`apps/web/src/components/shared/EmptyState.tsx:1-22`)
- `Skeleton` — animated placeholder, multi-line mode (`apps/web/src/components/shared/Skeleton.tsx:1-19`)
- `StatusBadge` — dynamic label + color classes (`apps/web/src/components/shared/StatusBadge.tsx:1-15`)

### Instructor panel conventions
- Sidebar: `InstructorSidebar.tsx` (line 76: Support link with IconHelp)
- Layout: `InstructorShell` → `AppShell` with sidebar + header + main content (`layout.tsx:1-14`)
- Other pages use `_comps/` directory for page-specific components (e.g., assignments/_comps/)
- Other pages also use `_components/` variant — `_comps` is the dominant pattern in instructor
- Sessions page (685 lines) demonstrates CRUD modals, search, filter tabs
- Inbox page uses tab-based navigation for Notifications/Messages
- Design tokens: `glass-card`, `border-border/60`, `bg-card`, `btn-primary`, `field`, `text-muted-foreground`, `text-violet-400` (instructor accent)

### Problems identified
1. 299-line monolithic file — hard to maintain, test, reason about
2. No status filtering — user sees all tickets (OPEN/IN_PROGRESS/RESOLVED/CLOSED) mixed together
3. No search — must scroll through everything
4. Back link href="/instructor" instead of "/instructor/dashboard" — inconsistent
5. Page header is inline HTML — doesn't use `PageHeader` shared component
6. STATUS_CONFIG defined inline — should be extracted to a shared location
7. Skeleton uses `Skeleton lines={4}` — doesn't match card layout visually
8. Empty state is functional but basic — could use the `EmptyState` component better
9. No pagination — hidden problem if tickets grow

## Decisions (with rationale)

1. **Component extraction** — Split into `_comps/SupportTicketList.tsx`, `_comps/SupportTicketDetail.tsx`, `_comps/CreateTicketForm.tsx`. Rationale: follows assignments/_comps pattern, each component focused on one state, page.tsx becomes thin orchestrator.

2. **Status filter tabs** — Add tab bar under page header with All | Open | In Progress | Resolved | Closed. Rationale: follows Inbox page tab pattern, most intuitive way to filter tickets.

3. **Client-side search** — Add search input that filters by title and description client-side. Rationale: ticket data is already loaded, simple string match is instant. API doesn't support search param.

4. **Keep STATUS_CONFIG as shared constant in the support module** — Extract to `_comps/constants.ts`. Rationale: both list and detail views need it, avoids prop drilling, keeps it colocated with the feature.

5. **No pagination in Phase 1** — Instructors won't have thousands of support tickets. Addressed via search + filters.

6. **Phase 2 deferred** — FAQ/knowledge base, file uploads, rich text. Rationale: Phase 1 addresses core UX issues with minimal risk.

## Scope IN

1. Split page.tsx into _comps/ directory (SupportTicketList, SupportTicketDetail, CreateTicketForm, constants)
2. Add status filter tabs (All / Open / In Progress / Resolved / Closed)
3. Add search input (client-side filter on title + description)
4. Use PageHeader component instead of inline header
5. Fix back link to /instructor/dashboard
6. Better loading skeleton matching card layout
7. Consistent empty states using EmptyState component
8. Lint/typecheck clean on changed files

## Scope OUT (Must NOT have)

1. No Prisma schema changes — data model stays exactly as-is
2. No new API routes — all data flows through existing endpoints
3. No FAQ / knowledge base section
4. No file upload or attachment support
5. No rich text / markdown in messages or descriptions
6. No real-time updates / WebSocket integration
7. No pagination — not needed at this scale
8. No test coverage (tests are not a pattern in this codebase for page components)
9. No modification to Sidebar, AppShell, InstructorShell, or other shared components

## Open questions

None — all explored and resolved.

## Approval gate
status: drafting
<!-- When exploration is exhausted and unknowns are answered, set status: completed. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
