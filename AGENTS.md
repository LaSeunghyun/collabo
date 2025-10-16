# Repository Guidelines
Use this guide to ramp quickly on the Artist Funding Platform codebase.

## Project Structure & Module Organization
Source routes live under `app/` with colocated loaders, actions, and UI per feature. Shared UI sits in `components/`, reusable hooks in `hooks/`, and domain logic in `lib/`. Types belong in `types/`. Data assets and Prisma schema changes live in `prisma/` (migrations, seeds). Browser automation resides in `tests/`, while unit specs mirror their modules in `__tests__/`. Playwright artifacts appear in `playwright-report/` and `test-results/`.

## Build, Test, and Development Commands
Run `npm run dev` for the hot-reloading Next.js server. Use `npm run build` to compile the production bundle and regenerate the Prisma client. Serve the built app with `npm run start`. Execute `npm run lint` to apply ESLint and Next formatting. Validate Jest suites via `npm run test` (append `--watch` for focused runs). For database updates, pair `npm run db:push` with `npm run create-accounts` to seed demo users.

## Coding Style & Naming Conventions
Favor TypeScript function components with named exports. Keep two-space indentation, trailing semicolons, and sorted imports, with external modules before `@/` aliases. Tailwind classes stay inline in layout -> spacing -> typography -> color order. Defer to ESLint/Prettier fixes before commit.

## Testing Guidelines
Unit and integration tests use Jest with `@testing-library/react`; name specs `*.test.tsx` beside the module or in `__tests__/`. Reset doubles through `__mocks__/` and `jest.setup.ts`. Cover critical flows (artist onboarding, checkout) with Playwright via `npx playwright test`, and inspect results in `playwright-report/`.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`) and stay tightly scoped. Every PR links relevant issues, lists validation steps (e.g., `npm run test`), and attaches screenshots for UI updates. Flag database schema or localization edits so data or localization owners can review.

## Security & Configuration Tips
Copy `env.example` to `.env.local` and never commit secrets. After editing `prisma/schema.prisma`, run `npm run db:push` and regenerate the client if needed. Store credentials in the approved vault and rotate shared API keys before distributing datasets.
