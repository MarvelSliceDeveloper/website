# UI/UX Design System Components Implementation

## Objective

Implement missing UI components to achieve full design system compliance across the LMS platform.

## Scope

### P0 - Critical (Must Fix)

1. **DataTable radius fix** - Change `rounded-none` → `rounded-xl`
2. **Toast system** - Wrap sonner with consistent API

### P1 - High Priority

3. **Modal** - Generic modal with overlay, close, animation
4. **Tabs** - Tabs component with active state indicator
5. **SearchInput** - Search input with icon and debounce
6. **FilterDropdown** - Filter dropdown with multi-select
7. **ErrorState** - Error state component with retry button

### P2 - Medium Priority

8. **Breadcrumb** - Breadcrumb navigation
9. **Tooltip** - Tooltip component
10. **Avatar** - Avatar with fallback initials
11. **Switch** - Toggle switch component
12. **Checkbox** - Checkbox component
13. **RadioGroup** - Radio group component
14. **DatePicker** - Date picker component
15. **FileUpload** - File upload with drag-drop

## Technical Decisions

### Component Location

- All new components → `apps/web/src/components/ui/`
- Shared utilities → `apps/web/src/components/shared/`

### Styling Approach

- Use existing CSS variables (`--primary`, `--border`, `--radius`, etc.)
- Follow existing `.glass-card`, `.btn-primary`, `.field` patterns
- Tailwind CSS utility classes
- No new dependencies (use native HTML + Tailwind)

### TypeScript

- No `any` types
- Proper interfaces for all props
- Export named types for consumer use

## Testing

- Run `pnpm typecheck` after implementation
- Run `pnpm lint` to verify code quality
- Visual verification via dev server

## Success Criteria

- All 15 components implemented
- Zero TypeScript errors
- Consistent with existing design tokens
- No breaking changes to existing pages
