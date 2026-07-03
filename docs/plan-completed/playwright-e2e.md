# Playwright E2E Test Suite

**Plan approved**: 2026-07-03
**Status**: In Progress

## Summary
Install Playwright with Chromium-only browser, configure the test runner, and create a comprehensive E2E test suite covering all LMS features with mixed coverage (smoke tests for all pages + deep functional tests for critical flows).

## Wave Plan
1. **Setup**: Install Playwright deps + configure playwright.config.ts
2. **Auth + Smoke**: Auth helper, auth deep tests, student/instructor/admin smoke tests
3. **Deep flows**: Course creation, batch creation, assignment submission
4. **Final verification**: Run full suite, verify, commit

## Key decisions
- Chromium-only (`@playwright/browser-chromium`)
- API-based auth setup (not UI login for every test)
- Per-role test files (auth.spec.ts, student.spec.ts, instructor.spec.ts, admin.spec.ts)
- Mixed smoke + deep coverage as requested
