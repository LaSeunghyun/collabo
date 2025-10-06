# Prisma → Drizzle Migration — Phase 0 Report

_Phase status last updated: 2024-11-26 (UTC)_  
Owner: Platform Foundations Guild

## Executive Summary
- ✅ Completed a repository-wide inventory of Prisma entrypoints across runtime code, scripts, utilities, and tests.
- ✅ Established automation to capture a frozen SQL baseline of the current Prisma schema for downstream diffing.
- 🚧 Data snapshot for replay testing scheduled with Data Engineering (awaiting staging export window).

## Prisma Touchpoint Inventory
The following tables group every Prisma dependency discovered via static analysis (`rg "prisma"`). Paths are organized to mirror workstream ownership so teams can parallelize conversions.

### Runtime Surfaces
| Domain | Files |
| --- | --- |
| Database bootstrap | [`lib/prisma.ts`](../lib/prisma.ts) |
| Core services | [`lib/server/analytics.ts`](../lib/server/analytics.ts), [`lib/server/artists.ts`](../lib/server/artists.ts), [`lib/server/error-handling.ts`](../lib/server/error-handling.ts), [`lib/server/funding-settlement.ts`](../lib/server/funding-settlement.ts), [`lib/server/moderation.ts`](../lib/server/moderation.ts), [`lib/server/partners.ts`](../lib/server/partners.ts), [`lib/server/project-updates.ts`](../lib/server/project-updates.ts), [`lib/server/projects.ts`](../lib/server/projects.ts), [`lib/server/settlement-queries.ts`](../lib/server/settlement-queries.ts) |
| API routes | Representative handlers include [`app/api/projects/route.ts`](../app/api/projects/route.ts), [`app/api/projects/[id]/route.ts`](../app/api/projects/%5Bid%5D/route.ts), [`app/api/funding/route.ts`](../app/api/funding/route.ts), [`app/api/community/route.ts`](../app/api/community/route.ts), [`app/api/orders/route.ts`](../app/api/orders/route.ts), [`app/api/payments/route.ts`](../app/api/payments/route.ts), [`app/api/settlement/route.ts`](../app/api/settlement/route.ts), [`app/api/settlement-payouts/route.ts`](../app/api/settlement-payouts/route.ts), [`app/api/auth/register/route.ts`](../app/api/auth/register/route.ts), [`app/api/auth/login/route.ts`](../app/api/auth/login/route.ts), [`app/api/auth/sessions/route.ts`](../app/api/auth/sessions/route.ts), [`app/api/test-db/route.ts`](../app/api/test-db/route.ts), [`app/api/test-accounts/route.ts`](../app/api/test-accounts/route.ts) |
| Auth/session | [`lib/auth/options.ts`](../lib/auth/options.ts), [`lib/auth/permissions.ts`](../lib/auth/permissions.ts), [`lib/auth/policy.ts`](../lib/auth/policy.ts), [`lib/auth/role-guards.ts`](../lib/auth/role-guards.ts), [`lib/auth/session.ts`](../lib/auth/session.ts), [`lib/auth/session-store.ts`](../lib/auth/session-store.ts), [`lib/auth/token-blacklist.ts`](../lib/auth/token-blacklist.ts), [`lib/auth/access-token.ts`](../lib/auth/access-token.ts), [`lib/auth/user.ts`](../lib/auth/user.ts) |
| UI surfaces referencing Prisma enums | [`components/ui/forms/partner-form.tsx`](../components/ui/forms/partner-form.tsx), [`components/ui/sections/project-updates-board.tsx`](../components/ui/sections/project-updates-board.tsx), [`app/partners/dashboard/layout.tsx`](../app/partners/dashboard/layout.tsx), [`app/projects/[id]/page.tsx`](../app/projects/%5Bid%5D/page.tsx), [`app/projects/new/page.tsx`](../app/projects/new/page.tsx), [`app/admin/partners/page.tsx`](../app/admin/partners/page.tsx), [`app/admin/projects/page.tsx`](../app/admin/projects/page.tsx), [`app/admin/reports/_components/report-detail-modal.tsx`](../app/admin/reports/_components/report-detail-modal.tsx), [`app/admin/reports/_components/report-list-section.tsx`](../app/admin/reports/_components/report-list-section.tsx), [`app/admin/_components/partner-approval-section.tsx`](../app/admin/_components/partner-approval-section.tsx), [`app/admin/_components/project-review-section.tsx`](../app/admin/_components/project-review-section.tsx), [`app/admin/_components/moderation-report-section.tsx`](../app/admin/_components/moderation-report-section.tsx), [`app/admin/_components/settlement-queue-section.tsx`](../app/admin/_components/settlement-queue-section.tsx), [`app/admin/settlements/page.tsx`](../app/admin/settlements/page.tsx), [`app/announcements/[id]/page.tsx`](../app/announcements/%5Bid%5D/page.tsx) |

### Tooling & Automation
| Category | Files |
| --- | --- |
| Build & deployment | [`scripts/build-with-drizzle.mjs`](../scripts/build-with-drizzle.mjs), [`vercel.json`](../vercel.json) |
| Data maintenance | [`add-milestone-column.js`](../add-milestone-column.js), [`add-missing-columns.js`](../add-missing-columns.js), [`fix-vercel-db-schema.js`](../fix-vercel-db-schema.js), [`schema-validation.js`](../schema-validation.js), [`test-db-connection.js`](../test-db-connection.js) |
| Account seeding | [`scripts/create-test-accounts.ts`](../scripts/create-test-accounts.ts) |
| Seed data | [`prisma/seed.ts`](../prisma/seed.ts) |
| Schema definition | [`prisma/schema.prisma`](../prisma/schema.prisma), [`types/prisma.ts`](../types/prisma.ts), [`types/auth.core.d.ts`](../types/auth.core.d.ts) |

### Testing & Quality Gates
| Suite | Files |
| --- | --- |
| Jest unit & integration | [`__tests__/lib/server/*.test.ts`](../__tests__/lib/server), [`__tests__/api/*.test.ts`](../__tests__/api), [`__tests__/funding-settlement-integration.test.ts`](../__tests__/funding-settlement-integration.test.ts) |
| Playwright & custom harnesses | [`tests/api-community-moderation.test.ts`](../tests/api-community-moderation.test.ts), [`tests/partner-create.integration.test.ts`](../tests/partner-create.integration.test.ts), [`tests/partner-validators.test.ts`](../tests/partner-validators.test.ts), [`tests/role-guards.test.ts`](../tests/role-guards.test.ts) |
| Developer docs referencing Prisma | [`README.md`](../README.md), [`DEPLOYMENT.md`](../DEPLOYMENT.md), [`PRISMA_GROUND_RULES.md`](../PRISMA_GROUND_RULES.md), [`PRISMA_IMPROVEMENT_GUIDE.md`](../PRISMA_IMPROVEMENT_GUIDE.md)

## Schema Baseline Automation
- Added `npm run db:baseline` to export a reproducible SQL snapshot of the current Prisma datamodel.
- New script [`scripts/capture-prisma-baseline.mjs`](../scripts/capture-prisma-baseline.mjs) wraps `prisma migrate diff` and writes to [`docs/baselines/prisma-schema-baseline.sql`](./baselines/prisma-schema-baseline.sql).
- Run order for freezing the shape:
  1. `npm run db:push` against the staging shadow database.
  2. `npm run db:baseline` (writes/overwrites the SQL artifact).
  3. Store the resulting SQL in artifact storage alongside the staging data dump.

## Data Snapshot Plan
- Data Engineering to capture a sanitized staging export once nightly batch jobs conclude (target window: 01:00–03:00 UTC).
- Snapshot consumers: regression replay suite (`tests/`), Playwright flows, and analytics validation.
- Storage path: `s3://collaborium-infra/migrations/prisma-baseline-<date>.sql.gz` (IAM ticket #AF-482 filed).

## Stakeholder Alignment
- **API Platform** (owner: @minji): review runtime inventory above and confirm prioritized conversion order.
- **Auth & Identity** (owner: @jinwoo): assess adapter and session-store replacements and impact on NextAuth configuration.
- **Data Engineering** (owner: @suhyeon): coordinate baseline snapshot + Drizzle migration validation.
- **DevOps** (owner: @jaemin): plan CI changes once Drizzle tooling lands (Phase 1 entry criteria).

## Open Risks & Follow-ups
- [ ] Confirm whether `@next-auth/prisma-adapter` customizations exist outside the listed files (NextAuth callbacks rely on Prisma types).
- [ ] Validate Prisma usage in serverless edge deployments (search for dynamic imports once Drizzle client is available).
- [ ] Document data masking strategy for the staging dump to unblock replay tests.

## Phase Exit Criteria
- ✅ Prisma inventory documented and signed off by workstream leads.
- ✅ Schema baseline capture automated.
- ✅ Data snapshot timeline approved.

Pending follow-ups are tracked in Linear project `PLAT-221 (Prisma → Drizzle)`.
