# Prisma → Drizzle Migration Plan

## Goals & Success Criteria
- Replace Prisma ORM usages across the Artist Funding Platform with Drizzle ORM while keeping all business capabilities intact.
- Maintain production parity: identical database schema, migrations, seed data, and runtime behaviors.
- Ensure DX parity or better: reproducible local setup, automated tests, CI, and developer scripts continue to work without regressions.

Success is achieved when no Prisma runtime dependency remains (`@prisma/client`, `prisma` CLI, Prisma-specific adapters) and all CRUD surfaces pass regression tests with Drizzle.

## Phase 0 – Discovery & Preparation
1. **Inventory Prisma touchpoints**
   - Source runtime: `lib/prisma.ts`, modules under `app/`, `components/`, `lib/server/`, API route handlers, and middleware call into `prisma`.
   - Tooling: scripts (`scripts/build-with-drizzle.mjs`, `scripts/create-test-accounts.ts`, maintenance scripts in repo root), testing helpers (`__tests__/helpers/prisma-mock.ts`), and validation utilities (`schema-validation.js`, `fix-vercel-db-schema.js`).
   - Schema assets: `prisma/schema.prisma`, any raw SQL helpers (e.g., `database_setup.sql`).
2. **Freeze database shape**
   - Run `npm run db:push` and export the current schema via `prisma migrate diff` so we can diff generated Drizzle migrations later.
   - Capture baseline data snapshots (staging dump) for replay testing.
3. **Align stakeholders & timelines**
   - Identify owners for API, data, auth (NextAuth), analytics, and DevOps to review their respective surfaces.

## Phase 1 – Tooling Bootstrap
1. **Introduce Drizzle dependencies**
   - Add `drizzle-orm`, `drizzle-kit`, and the Postgres driver layer we rely on (`pg` or `@neondatabase/serverless` depending on deployment).
   - Replace Prisma-specific adapters: swap `@next-auth/prisma-adapter` for `@auth/drizzle-adapter` or a custom Drizzle adapter once schema parity exists.
2. **Scaffold configuration**
   - Create `drizzle.config.ts` with connection options mirroring `lib/prisma.ts` normalization (Data Proxy, pgbouncer params).
   - Establish a `drizzle/` directory for migrations and generated SQL snapshots; update `tsconfig.json` and `eslint` path aliases if needed.
3. **Developer workflow**
   - Replace `npm run db:push`/`db:generate` scripts with Drizzle equivalents (`drizzle-kit generate`, `drizzle-kit push`).
   - Update `scripts/build-with-prisma.js` to a generalized database deploy script (`scripts/build-with-drizzle.mjs`).

## Phase 2 – Schema Translation
1. **Model conversion**
   - Translate each Prisma model in `prisma/schema.prisma` into Drizzle schema modules under `lib/db/schema/`.
     - Enum mapping: convert `enum` definitions (e.g., `UserRole`, `ProjectStatus`, `FundingStatus`, etc.) to `pgEnum` exports for reuse across tables and type inference.
     - Relation mapping: re-create relations using `pgTable`, `relations`, and explicit foreign key constraints, ensuring join tables (e.g., `ProjectCollaborator`, `UserFollow`) preserve composite keys.
     - Default values and unique constraints must mirror Prisma definitions (e.g., `@default(now())`, `@unique`, composite indexes).
2. **Migrations**
   - Use `drizzle-kit introspect` against the current database to bootstrap SQL, then hand-tune to exactly match the Prisma schema (diff with the baseline from Phase 0).
   - Organize migrations chronologically, ensuring idempotence so that deploy pipelines can run `drizzle-kit push` safely.
3. **Type exports**
   - Replace `@/types/prisma` with generated Drizzle types (e.g., `InferModel<typeof users>`). Provide a compatibility layer so existing modules can progressively migrate.

## Phase 3 – Runtime Integration
1. **Database client abstraction**
   - Introduce `lib/db/client.ts` to encapsulate Drizzle initialization (connection pooling, edge runtime support, pgbouncer normalization currently handled in `lib/prisma.ts`).
   - Provide helper factories for Node (`pg`) and serverless (HTTP fetch driver) runtimes mirroring deployment targets (Vercel, Playwright tests).
2. **Repository/service updates**
   - Module-by-module replacement of Prisma calls:
     - API routes under `app/api/**` and server utilities in `lib/server/**` should swap `.findMany`, `.create`, transactions, etc., for Drizzle query builders.
     - Scheduled jobs and scripts (`scripts/create-test-accounts.ts`, `check-users.js`, `add-milestone-column.js`, `fix-vercel-db-schema.js`) need Drizzle rewrites or retirement if redundant post-migration.
   - Leverage Drizzle relations and `eq`, `and`, `sql` helpers for complex filters currently using Prisma nested conditions.
3. **Auth integration**
   - Replace `@next-auth/prisma-adapter` usage in the NextAuth configuration (likely under `app/api/auth/[...nextauth]/route.ts`) with the Drizzle adapter. Align session callbacks with the new schema types.
4. **Validation & serialization**
   - Audit modules referencing `@/types/prisma` enums (e.g., tests, UI forms) and convert to Drizzle enum exports to avoid drift.

## Phase 4 – Testing & QA
1. **Update test harnesses**
   - Rewrite Jest mocks in `__tests__/helpers/prisma-mock.ts` and related specs to use Drizzle repositories or to mock the new data layer abstraction.
   - Adjust integration tests (`tests/*.test.ts`, Playwright flows) to seed via Drizzle. Provide new seeding utilities using raw SQL or Drizzle insert helpers.
2. **Regression suite**
   - Run `npm run test`, `npm run test:e2e`, and smoke tests against staging using Drizzle to ensure API and UI parity.
   - Monitor critical flows: funding checkout, community posts, partner matching, settlements.
3. **Performance & observability**
   - Validate query plans on heavy endpoints (community feeds, dashboards) with Drizzle-generated SQL. Compare logs with current Prisma telemetry.

## Phase 5 – Rollout & Cleanup
1. **Cut over environments**
   - Deploy feature branches behind a toggle or environment variable allowing rollback to Prisma if necessary (e.g., maintain both clients temporarily via `lib/db` abstraction).
   - Once validated, remove Prisma packages from `package.json`, delete `prisma/` directory, and archive Prisma-specific docs (`PRISMA_GROUND_RULES.md`, etc.) with updated Drizzle equivalents.
2. **Documentation & onboarding**
   - Update `README.md`, `DEPLOYMENT.md`, and internal guides to reflect Drizzle workflows (schema evolution, migrations, seeding).
   - Provide a quick-start for contributors: how to introspect, generate migrations, seed data, and mock the database in tests using Drizzle.
3. **Post-migration audit**
   - Verify no Prisma imports remain (`rg "@prisma/client"`, `rg "prisma"`).
   - Monitor production metrics for at least one full release cycle, watching for query anomalies, connection saturation, or regression reports.

## Suggested Milestones & Sequencing
1. **Week 1 – 2:** Complete Phase 0 discovery, add Drizzle tooling, and land initial schema translation in parallel with compatibility layer.
2. **Week 3 – 4:** Replace critical path services (auth, funding, community) and backfill tests. Maintain dual-run harness to compare Prisma vs Drizzle outputs.
3. **Week 5:** Execute end-to-end regression, finalize documentation, and plan production cutover.
4. **Week 6:** Remove Prisma code, monitor post-launch, and schedule retrospective for learnings and future enhancements.

## Risk Mitigation & Contingencies
- **Schema drift:** keep Prisma migrations frozen post-cutover to avoid divergent schemas; enforce Drizzle migrations as the single source of truth.
- **Adapter parity:** audit NextAuth session and account models early to ensure the Drizzle adapter matches our schema (custom composite keys for `Account`, etc.).
- **Transaction semantics:** Drizzle’s transaction API differs from Prisma’s `$transaction`. Abstract transaction handling in a shared utility to reduce surface changes.
- **Developer ramp-up:** pair program on early conversions, record Loom walkthroughs, and update lint rules to flag deprecated Prisma imports.

## Deliverables Checklist
- [ ] Drizzle configuration (`drizzle.config.ts`, migration folders) committed.
- [ ] Schema modules + generated types replacing `@/types/prisma`.
- [ ] Updated database client abstraction consumed by runtime code.
- [ ] Scripts/tests refactored and green.
- [ ] Documentation refreshed and Prisma assets archived.
- [ ] Monitoring dashboards confirming stable post-migration performance.
