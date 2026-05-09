# Contributing to LMS Portal

First off, thanks for taking the time to contribute!

## 1. Local Setup
1. Install dependencies: `pnpm install`
2. Start containers: `docker-compose up -d`
3. Setup env: `cp .env.example .env`
4. Apply migrations (when ready): `pnpm prisma:migrate`
5. Run dev server: `pnpm dev`

## 2. Branching Strategy
- `main` is protected and represents production.
- `develop` is the integration branch.
- Prefix your feature branches: `feature/your-feature`, `fix/your-fix`, `hotfix/critical-issue`.

## 3. Pull Request Guidelines
- Ensure `pnpm test:all` passes.
- Ensure `pnpm lint` and `pnpm typecheck` pass.
- Link the PR to the relevant issue.
- Provide a summary of your changes in the PR description.
- Follow the conventional commits format (`feat:`, `fix:`, `docs:`, etc.).

## 4. Code Style
- Use `pnpm format` before committing.
- Do not use `any` types.
- We use ESLint, Prettier, and Husky pre-commit hooks to enforce style.
