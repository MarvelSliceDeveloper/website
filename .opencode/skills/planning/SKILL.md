---
name: planning
description: Use when beginning work on a new task or feature. Provides a structured planning workflow that audits existing code for critical issues and improvements before writing any new code. Ensures consistency with project coding style, code documentation quality, and docs maintenance.
---

# Planning Mode Skill

## Step 1: Audit existing code for critical issues

Before proposing or writing any new code, first search the relevant parts of the codebase for:

- **Critical bugs / CRIT**: Logic errors, unhandled edge cases, missing error handling, security vulnerabilities (e.g., missing auth checks, unvalidated input), race conditions, memory leaks, or any issue that could cause incorrect behavior or crashes.
- **Code quality issues**: Dead code, unused imports, overly complex functions, missing null/undefined checks, improper TypeScript usage (e.g., `any` types), broken type safety.
- **Integration issues**: Mismatched API contracts, incorrect Prisma queries, broken database relations, improper middleware usage, misconfigured routes.

Report each issue clearly with the file path, line reference, and a brief description.

## Step 2: Suggest improvements

After auditing, propose improvements for:

- **Performance**: N+1 queries, missing indexes, unnecessary re-renders, large bundle imports.
- **Maintainability**: Extract reusable logic, simplify complex conditionals, improve naming, add proper typing.
- **Consistency**: Align with patterns already used elsewhere in the codebase (e.g., same error handling approach, same component structure).

## Step 3: Follow the project coding style

Before writing code, review how similar existing code is structured. Adhere to:

- **TypeScript**: No `any` types. Use proper interfaces/types from `@lms/types` or `packages/types`.
- **API (Express)**: Modular structure — controllers, services, routes in separate files under `modules/<name>/`. Use named exports. Follow existing error handling patterns (try/catch + Zod validation).
- **Web (Next.js)**: App Router with `page.tsx` files. Function components. Use Tailwind CSS utility classes. Small reusable UI components in `components/ui/`. View components in `app/<route>/_views/`.
- **Formatting**: Run `pnpm format` before completing. Follow Prettier rules.

## Step 4: Maintain documentation

- Update `docs/` files when behavior changes (e.g., `API.md` for endpoint changes, `SYSTEM_GUIDE.md` for workflow changes).
- If adding new features, update or create documentation explaining the feature purpose, usage, and relevant code references.
- Keep existing doc structure and tone consistent.

## Step 5: Document code with simple inline explanations

- Add a brief one-line comment for each logical block or non-trivial function explaining what it does.
- Keep comments concise — no essays. Focus on the "why" not the "what" when the code is already clear.
- Use JSDoc-style comments for exported functions describing purpose, params, and return values.

## step 6: Use the planning workflow for all new tasks
-when the plan start add it under docs 'docs/plan-to-work/<task-name>.md' and and when the plan is completed add it under 'docs/plan-completed/<task-name>.md'
-and if any important thing also mention below the plan in the same file

