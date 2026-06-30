# support-page-redesign - Work Plan

## TL;DR (For humans)

**What you'll get:** The instructor support page goes from a single 299-line file to a clean, component-based page with status filter tabs (All/Open/In Progress/Resolved/Closed), a search bar to find tickets by title or description, consistent styling using the same shared components as the rest of the instructor panel, and a fixed back link that actually goes back to the dashboard.

**Why this approach:** The current page has all the code (list, detail, create form, state management) crammed into one file. Splitting it into focused components makes it maintainable, and adding filters + search fixes the biggest UX gap — instructors currently can't find specific tickets.

**What it will NOT do:** No database changes, no new API endpoints, no file uploads, no FAQ/knowledge base, no rich text editing, no real-time updates. Pure UX and code structure improvements.

**Effort:** Short (4-5 hours)
**Risk:** Low — all changes are client-side extraction + addition; backend untouched; existing behavior preserved
**Decisions to sanity-check:** None — all defaults follow existing patterns in the codebase (tabs from inbox, _comps/ from assignments, PageHeader from shared)

Your next move: Approve this plan, and I'll execute it.

---

> TL;DR (machine): Short effort, low risk. Extract 299-line page into 4 focused components + add status filter tabs + search. Backend untouched.

## Scope
### Must have
1. Split `apps/web/src/app/instructor/support/page.tsx` into components under `_comps/`:
   - `constants.ts` — types, STATUS_CONFIG, API helpers
   - `CreateTicketForm.tsx` — create ticket form
   - `SupportTicketDetail.tsx` — ticket conversation thread + reply input
   - `SupportTicketList.tsx` — ticket list with filter tabs + search
2. Page header uses `PageHeader` shared component
3. Status filter tabs: All / Open / In Progress / Resolved / Closed
4. Search input filtering by title and description (client-side)
5. Back link href → `/instructor/dashboard` (was `/instructor`)
6. Loading skeleton matches card layout
7. Empty states use `EmptyState` component
8. Lint + typecheck pass on all changed files

### Must NOT have (guardrails, anti-slop, scope boundaries)
1. No Prisma schema changes
2. No new API routes or query params
3. No FAQ / knowledge base section
4. No file upload or attachment support
5. No rich text / markdown
6. No real-time / WebSocket
7. No pagination
8. No test files
9. No changes to sidebar, AppShell, InstructorShell, or other shared components
10. No new npm dependencies

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none (no test pattern exists for page components in this codebase)
- Evidence: lsp_diagnostics clean, pnpm lint passes, pnpm typecheck passes

## Execution strategy
### Parallel execution waves

**Wave 0 — Base (constants file):** Create `_comps/constants.ts` with types + STATUS_CONFIG. This unblocks all component extraction.

**Wave 1 — Components (3 parallel agents):** Extract `CreateTicketForm`, `SupportTicketDetail`, `SupportTicketList` from the monolithic page. Each is independent and builds on constants.ts.

**Wave 2 — Orchestration + polish (1 agent):** Rewrite `page.tsx` as thin orchestrator using the 3 components. Fix back link, ensure PageHeader usage, fix loading/empty states.

**Wave 3 — Verification:** Run lint + typecheck.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. constants.ts | — | 2, 3, 4 | — |
| 2. CreateTicketForm | 1 | 5 | 3, 4 |
| 3. SupportTicketDetail | 1 | 5 | 2, 4 |
| 4. SupportTicketList | 1 | 5 | 2, 3 |
| 5. page.tsx rewrite | 2, 3, 4 | 6 | — |
| 6. Lint + typecheck | 5 | — | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. `_comps/constants.ts`: Create shared types + STATUS_CONFIG for support module
  What to do / Must NOT do: Extract all TypeScript types (SupportTicket, SupportMessage, etc.) and STATUS_CONFIG from page.tsx into a new `_comps/constants.ts` file. Export everything. Must NOT modify page.tsx yet — just create the file. Status tabs: ["all", "open", "in_progress", "resolved", "closed"] with labels ["All", "Open", "In Progress", "Resolved", "Closed"].
  Parallelization: Wave 0 | Blocked by: — | Blocks: 2, 3, 4
  References (executor has NO interview context - be exhaustive):
    - `apps/web/src/app/instructor/support/page.tsx`:20-55 (types + STATUS_CONFIG)
    - `apps/api/src/modules/tickets/ticket.service.ts`:95-108 (type enum values)
  Acceptance criteria (agent-executable): File exists at `apps/web/src/app/instructor/support/_comps/constants.ts`; all types and STATUS_CONFIG exported; no imports from page.tsx
  QA scenarios: Check file exists, verify export list, verify STATUS_CONFIG has exactly 4 entries (OPEN, IN_PROGRESS, RESOLVED, CLOSED), verify tabs array has 5 entries
  Commit: N

- [ ] 2. `_comps/CreateTicketForm.tsx`: Extract create ticket form from page.tsx
  What to do / Must NOT do: Extract the create-ticket form section (lines 223-257) into its own component. Import types from `./constants`. Props: `onSuccess: () => void`, `onCancel: () => void`. Uses api.post("/api/tickets", { type: "SUPPORT", ... }). Must NOT repeat inline types — import from constants. Must NOT include any list or detail logic.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5 | Can parallelize with: 3, 4
  References (executor has NO interview context - be exhaustive):
    - `apps/web/src/app/instructor/support/page.tsx`:90-106 (createTicket function)
    - `apps/web/src/app/instructor/support/page.tsx`:223-257 (JSX for create form)
    - `apps/web/src/app/instructor/support/_comps/constants.ts` (types)
  Acceptance criteria (agent-executable): File exists at `_comps/CreateTicketForm.tsx`; exports a default component; no inline type definitions for SupportTicket
  QA scenarios: Verify component renders form with title + description fields + cancel/submit buttons; verify form calls api.post with correct payload; verify onSuccess/onCancel callbacks fire
  Commit: N

- [ ] 3. `_comps/SupportTicketDetail.tsx`: Extract ticket conversation detail view from page.tsx
  What to do / Must NOT do: Extract the ticket detail view (lines 122-201) into its own component. Props: `ticketId: string`, `onBack: () => void`. Must fetch ticket via api.get(\`/api/tickets/${ticketId}\`), show conversation thread, send reply via api.post(\`/api/tickets/${ticketId}/messages\`). Imports types/STATUS_CONFIG from `./constants`. Must NOT include list or create logic. The "Back" button should call `onBack`. The close button should call `onBack`.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5 | Can parallelize with: 2, 4
  References (executor has NO interview context - be exhaustive):
    - `apps/web/src/app/instructor/support/page.tsx`:81-88 (openTicket function)
    - `apps/web/src/app/instructor/support/page.tsx`:108-120 (sendReply function)
    - `apps/web/src/app/instructor/support/page.tsx`:122-201 (detail view JSX)
    - `apps/web/src/components/shared/StatusBadge.tsx` (StatusBadge component)
  Acceptance criteria (agent-executable): File exists at `_comps/SupportTicketDetail.tsx`; exports a default component; fetches ticket by ID; shows conversation thread; sends replies
  QA scenarios: Verify component renders loading state, conversation thread, reply input; verify status badge shows; verify admin vs user message alignment differs; verify closed tickets hide reply input
  Commit: N

- [ ] 4. `_comps/SupportTicketList.tsx`: Extract ticket list with status filter tabs + search
  What to do / Must NOT do: Extract the ticket list view (lines 204-298) into its own component. Add a filter tab bar with tabs: All, Open, In Progress, Resolved, Closed. Add a search input that filters tickets by title and description (client-side, case-insensitive). Props: `onSelectTicket: (ticketId: string) => void`, `onNewTicket: () => void`. Must show ticket count badge on each filter tab. Must show ticket cards with title, status badge, description excerpt, time ago, message count. Uses `EmptyState` and `Skeleton` shared components. Must NOT include create form or detail view.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5 | Can parallelize with: 2, 3
  References (executor has NO interview context - be exhaustive):
    - `apps/web/src/app/instructor/support/page.tsx`:259-297 (list view JSX)
    - `apps/web/src/app/instructor/inbox/page.tsx`:44-61 (tab bar pattern)
    - `apps/web/src/app/instructor/support/_comps/constants.ts` (types + STATUS_CONFIG + TABS)
    - `apps/web/src/components/shared/EmptyState.tsx` (EmptyState component)
    - `apps/web/src/components/shared/Skeleton.tsx` (Skeleton component)
  Acceptance criteria (agent-executable): File exists at `_comps/SupportTicketList.tsx`; exports a default component; renders 5 filter tabs; search input filters tickets; calls onSelectTicket and onNewTicket callbacks
  QA scenarios: Verify tabs filter the list correctly; verify search narrows by title match; verify search narrows by description match; verify empty state shows when no tickets; verify skeleton shows during loading
  Commit: N

- [ ] 5. `page.tsx`: Rewrite as thin orchestrator using the 3 extracted components
  What to do / Must NOT do: Rewrite `apps/web/src/app/instructor/support/page.tsx` to import and compose:
    - `CreateTicketForm` (from `./_comps/CreateTicketForm`)
    - `SupportTicketDetail` (from `./_comps/SupportTicketDetail`)
    - `SupportTicketList` (from `./_comps/SupportTicketList`)
    - `PageHeader` (from `@/components/shared/PageHeader`)
  States: list (default), detail (selectedTicketId set), create (showCreate=true). Use `PageHeader` component with role="Instructor", title="Support", description="Report issues or ask questions." The "New Ticket" button goes in the `action` prop of PageHeader. Fix the back link: remove the `<Link href="/instructor">` — PageHeader doesn't need it (detail view handles its own back). Must NOT duplicate any component logic — all functionality lives in the extracted components.
  Parallelization: Wave 2 | Blocked by: 2, 3, 4 | Blocks: 6
  References (executor has NO interview context - be exhaustive):
    - `apps/web/src/app/instructor/support/page.tsx` (current file — replace entirely)
    - `apps/web/src/app/instructor/support/_comps/constants.ts`
    - `apps/web/src/app/instructor/support/_comps/CreateTicketForm.tsx`
    - `apps/web/src/app/instructor/support/_comps/SupportTicketDetail.tsx`
    - `apps/web/src/app/instructor/support/_comps/SupportTicketList.tsx`
    - `apps/web/src/components/shared/PageHeader.tsx`
  Acceptance criteria (agent-executable): File is <60 lines (imports + state + conditional render); lsp_diagnostics clean; all 3 components compose correctly
  QA scenarios: Verify page renders in list mode by default; verify clicking a ticket opens detail view; verify clicking New Ticket shows create form; verify back from detail returns to list; verify all states transition correctly
  Commit: N

- [ ] 6. Lint + typecheck: Verify all changes
  What to do / Must NOT do: Run `pnpm lint` and `pnpm typecheck` from repo root. Fix any errors in the changed files. Must NOT fix pre-existing errors in unrelated files.
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: —
  References: All changed files under `apps/web/src/app/instructor/support/`
  Acceptance criteria (agent-executable): `pnpm lint` exit 0, `pnpm typecheck` exit 0
  QA scenarios: Run the commands and check exit codes
  Commit: N

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit — all Must have delivered, no Must NOT have violations
- [ ] F2. Code quality review — no AI slop, no inline types where constants exist, no duplication
- [ ] F3. Real manual QA — open each state (list, detail, create, empty, loading, filtered), verify everything works
- [ ] F4. Scope fidelity — compared against Scope section

## Commit strategy
No commits — user didn't request them. Changes ready for review when done.

## Success criteria
1. `apps/web/src/app/instructor/support/` now has: `page.tsx` (<60 lines), `_comps/constants.ts`, `_comps/CreateTicketForm.tsx`, `_comps/SupportTicketDetail.tsx`, `_comps/SupportTicketList.tsx`
2. Status filter tabs present and functional
3. Search input filters tickets by title/description
4. Page header uses PageHeader component
5. Back link points to `/instructor/dashboard`
6. `pnpm lint` and `pnpm typecheck` pass
