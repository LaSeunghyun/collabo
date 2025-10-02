# Repository Guidelines

## Project Structure & Module Organization
`app/` hosts Next.js route modules with colocated loaders, actions, and UI per feature. Shared UI lives in `components/`, domain logic in `lib/`, hooks in `hooks/`, and reusable types in `types/`. Data assets sit under `prisma/` (schema, migrations, seeds). Automation scripts belong in `scripts/`, locale strings in `locales/`, and docs under `docs/` plus `DEPLOYMENT.md`. Tests mirror sources: browser flows in `tests/`, component specs in `__tests__/`, doubles in `__mocks__/`. Inspect generated reports in `playwright-report/` and `test-results/`.

## Build, Test, and Development Commands
Run `npm run dev` for the hot-reloading Next.js server. Use `npm run build` to generate Prisma client and compile the production bundle, then `npm run start` to serve it. Execute `npm run lint` before submitting changes to apply ESLint + Next formatting. Validate the Jest suite with `npm run test`; append `--watch` for focused runs. For database schema updates, pair `npm run db:push` with `npm run create-accounts` to seed demo users.

## Coding Style & Naming Conventions
Favor TypeScript function components and named exports. Keep two-space indentation, trailing semicolons, and sorted imports (external modules before `@/` aliases). Tailwind classes remain inline in layout -> spacing -> typography -> color order. Let ESLint/Prettier autofix deviations.

## Testing Guidelines
Rely on Jest with `@testing-library/react`; name specs `*.test.tsx` beside their modules or inside `__tests__/`. Reset doubles through `__mocks__/` and `jest.setup.ts`. Cover critical flows (artist onboarding and checkout) via Playwright (`npx playwright test`) and review artifacts under `playwright-report/`.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `refactor:`) and keep diffs scoped. Each PR links relevant issues, lists validation steps (e.g., `npm run test`), and attaches screenshots when UI changes. Flag schema or localization updates and request data-owner or localization review as appropriate.

## Security & Configuration Tips
Copy `env.example` to `.env.local` for local secrets and never commit `.env*`. After editing `prisma/schema.prisma`, run `npm run db:push` and regenerate the client if needed. Store credentials in approved vaults and rotate shared API keys before distributing datasets.
