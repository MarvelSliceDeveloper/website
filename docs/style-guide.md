# LMS Style Guide

This document defines the current UI system used in the redesigned core flow.

## 1. Scope

Applied to:
- `/login`
- `/student/dashboard`
- `/admin/mentorship`
- Shared shell: `Header`, `Sidebar`, `AdminSidebar`, student/admin layouts

## 2. Design Tokens (Source of Truth)

Defined in: `apps/web/src/app/globals.css`

- Colors: `--background`, `--foreground`, `--card`, `--border`, `--primary`, `--accent`, `--success`, `--warning`, `--danger`, `--muted`
- Radius: `--radius`
- Typography variables: `--font-display`, `--font-body`

Use Tailwind semantic tokens (`bg-background`, `text-foreground`, etc.) instead of hardcoded colors in page components.

## 3. Typography

- Headings: display font (`--font-display`)
- Body/UI text: body font (`--font-body`)
- Hierarchy pattern:
  - Section label: small uppercase tracking
  - Page title: bold, high contrast
  - Supporting copy: muted foreground

## 4. Layout Rules

- App shell:
  - Desktop sidebar width: `w-64`
  - Content offset: `lg:ml-64`
- Main content container:
  - `max-w-7xl`
  - `p-4 md:p-6`
- Prefer responsive wrap patterns:
  - `flex flex-wrap ... gap-3` for page headers and toolbars

## 5. Reusable UI Primitives

- `.glass-card`: primary panel surface
- `.panel`: compact bordered sub-panel
- `.field`: standard text input/select/textarea style
- `.btn-primary`: primary action button
- `.btn-secondary`: neutral/secondary button

Do not create one-off button/input styles inside pages unless needed for a specific exception.

## 6. Interaction & Accessibility

- Keep visible focus states (`:focus-visible`) on all interactive controls
- Ensure text contrast remains readable on card/background layers
- Keep action labels explicit (`Refresh`, `Request Session`, `Sign in`)

## 7. Page Composition Pattern

Recommended page structure:
1. Header block (label + title + helper text + top action)
2. KPI/stat row
3. Primary content block
4. Secondary/supporting blocks

## 8. Documentation Links

- Redesign summary: `docs/DesignUIUX.md`
- Docs index: `docs/README.md`
