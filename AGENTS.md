# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js app router; nest route groups with colocated loaders and UI.
- Shared UI lives in `components/`, domain logic in `lib/`, reusable state in `hooks/`, and TypeScript defs in `types/`.
- Data and migrations stay under `prisma/`; automation lives in `scripts/`; localized copy in `locales/`.
- Tests use mirrored folders: high-level flows in `tests/`, component specs in `__tests__/`, mocks in `__mocks__/`. Docs sit in `docs/` and `DEPLOYMENT.md`.

## Build, Test, and Development Commands
- `npm run dev` spins up the dev server with hot reload.
- `npm run build` runs `prisma generate` then compiles the production bundle.
- `npm run start` serves the built app; `npm run lint` executes Next/ESLint rules.
- `npm run test` runs Jest; append `--watch` for iterative runs.
- `npm run db:push` syncs Prisma schema; `npm run create-accounts` seeds demo users.

## Coding Style & Naming Conventions
- TypeScript + React functional components only; keep hooks prefixed with `use`.
- Two-space indentation, trailing semicolons, and sorted imports match existing files.
- Use `@/` path aliases from `tsconfig.json` and prefer PascalCase component files, camelCase utilities.
- Tailwind classes stay inline, ordered from layout → spacing → color; lint before pushing.

## Testing Guidelines
- Jest with `@testing-library/react` drives unit specs; name files `*.test.ts(x)` beside the target module or under `__tests__/`.
- Exercise cross-route flows (artist onboarding, checkout) in `tests/` and document gaps in PRs.
- Centralize doubles in `__mocks__/` and reset side effects via `jest.setup.ts`.

## Commit & Pull Request Guidelines
- Follow conventional commit prefixes (`feat:`, `fix:`, `refactor:`) as in `git log`.
- Keep PRs focused, link issues, list validation (`npm run test`, screenshots for UI), and call out schema or env changes.
- Request reviews from data owners when touching `prisma/` and ping localization reviewers for `locales/` edits.

## Security & Configuration Tips
- Copy `env.example` to `.env.local`, populate secrets locally, and keep `.env*` files ignored.
- After schema edits, run `npm run db:push` and re-run `prisma generate`; review `PRISMA_GROUND_RULES.md` before altering models.
