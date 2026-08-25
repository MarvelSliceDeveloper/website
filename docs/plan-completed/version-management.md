# Plan: Version Management — Project + Website + SuperAdmin Page

## Audit (Step 1)

**Current state:**

- `package.json:3` has `"version": "1.0.1"` — single source of truth, but not exposed via API or UI. `apps/web/package.json:3` is `0.1.0` (stale, not synced).
- No `/api/version` or `/health` version field — `apps/api/src/app.ts:263` `/health` returns `{status,timestamp}` only, no version/commit.
- `apps/web/src/app/admin/super-admin/page.tsx:59` super-admin is health+tools grid, no version tile/link.
- No `SystemSetting` for version — version is file-based only.
- `docs/changelog.md` has manual entries but no structured version linked to code.

**Critical / Quality issues:**

- Web `package.json` version drift (`0.1.0` vs root `1.0.1`) — should sync or derive from root.
- No build-time injection — prod build won't know git SHA or build date.
- No auth / caching consideration not needed (public version is safe, detailed version should be SUPER_ADMIN only).

## Proposal (Steps 2-3)

### Backend (`apps/api`)

1. **Version service** `src/modules/version/version.service.ts`
   - Reads `package.json` version at startup (import).
   - Returns `{ version, name, env, buildTime, commit }` — `commit` from `GIT_COMMIT` env or `unknown`, `buildTime` from `BUILD_TIME` env injected at Docker build.
   - No DB needed (stateless).

2. **Routes** `src/modules/version/version.routes.ts`
   - `GET /api/version` — public (no auth, CSRF-exempt like `/health`), returns `{ version, name }` + `commit` truncated.
   - `GET /api/admin/version` — `requireAuth + requireSuperAdmin`, returns full details + changelog tail (reads `docs/changelog.md` first 50 lines or SystemSetting).

3. Wire in `src/app.ts:250` — `app.use("/api/version", versionRouter)` and admin route; add to `csrfExemptPaths:157`.

4. **Dockerfile** injection — `apps/api/Dockerfile` / `apps/web/Dockerfile` `ARG GIT_COMMIT` + `ENV GIT_COMMIT` + `ARG BUILD_TIME`.

### Frontend (`apps/web`)

1. **SuperAdmin page** `src/app/admin/version/page.tsx` (new)
   - `useApiQuery(["admin","version"], "/api/admin/version")`
   - Cards: current version, env, build time, commit SHA (copy button), package name.
   - Changelog section (rendered from API).
   - "How to bump" guide: `pnpm version patch/minor/major` + commit.
   - Add link in `src/app/admin/super-admin/page.tsx:59` tools array → `{label:"Version", href:"/admin/version", desc:"App version & changelog"}`.
   - `loading.tsx` + `error.tsx` per route convention.

2. **Website footer** — show version on public site:
   - Option A (simple): `apps/web/src/components/Footer.tsx` or `AdminShell` footer — `GET /api/version` fetch at build time + display `v1.0.1`.
   - Option B: next.config `publicRuntimeConfig.version` from `package.json`. Recommend A (always fresh, no rebuild for display).

3. **Sync web version** — set `apps/web/package.json` version to `1.0.1` or remove and rely on root version.

### Docs (Step 4)

- Update `docs/changelog.md` on completion with this feature.
- `docs/SYSTEM_GUIDE.md` — add Version Management section.
- Plan file move: `docs/plan-to-work/version-management.md` → `docs/plan-completed/version-management.md` on done.

### Style (Step 3 + 5)

- Express modular routes under `modules/version/` (controller/service/routes split or single routes file like `health.routes.ts`).
- Next.js App Router `page.tsx` with `usePageTitle("Version")`, Tailwind cards, `AdminPageHeader`.
- No `any` types; use `unknown` + narrowing.

## Tasks

1. API: create `version.service.ts` + `version.routes.ts`, wire in `app.ts`, handle CSRF exempt, Dockerfile args
2. WEB: create `/admin/version` page + loading/error, link from super-admin, footer version badge
3. Sync versions, inject build args, update docs + changelog

## Open questions for user

- Should website footer show version to **all visitors** (public) or only to logged-in admins? (Plan assumes public `GET /api/version` safe, detailed superadmin page private)
- Do you want version bump to also write to `SystemSetting` or just `package.json` + git tag?
- Confirm superadmin-only or admin also can view version page?
