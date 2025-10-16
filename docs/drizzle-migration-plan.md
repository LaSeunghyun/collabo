# Drizzle Migration Plan

This document captures the groundwork required to replace the existing Prisma ORM layer
with Drizzle across the Collaborium platform. It highlights the current blockers that were
observed while auditing the codebase, and lays out an actionable path for the migration.

## Current State Overview

* Prisma client is instantiated in `lib/prisma.ts` and re-exported throughout the codebase.
* Data access relies on nested `prisma.<model>` calls in API routes, server modules, and tests.
* Domain types and enums are re-exported from `@prisma/client` in `types/prisma.ts`.
* Database schema is managed in `prisma/schema.prisma` with seeds and scripts depending on
  Prisma migrations.

## Key Challenges Identified

1. **Surface area of Prisma usage** – nearly every API handler and server utility depends on
   Prisma-specific query helpers (`include`, `select`, transactions, nested writes, etc.).
2. **Shared enum/types contract** – front-end code and shared modules import enum definitions
   straight from `@prisma/client`, so a drop-in replacement must provide equivalent exports.
3. **Testing and scripts** – unit tests, seed scripts, and various maintenance scripts spin up
   Prisma clients directly, so the migration must cover those entry points as well.
4. **Complex relations** – features such as funding settlements, community posts, and partner
   matching rely on nested relations and aggregations that will require carefully modelled
   Drizzle schemas and relation helpers.

## Proposed Migration Strategy

1. **Establish Drizzle Infrastructure**
   * Add `drizzle-orm`, a PostgreSQL driver (e.g., `postgres`), and `drizzle-kit` to the project.
   * Create `drizzle.config.ts` pointing at the existing database connection string.
   * Generate a Drizzle schema (`db/schema.ts`) that mirrors the Prisma models, enumerations,
     and relations. Start by scripting a conversion from `schema.prisma` to Drizzle table
     definitions to minimise manual mistakes.
   * Introduce a central `lib/db/client.ts` that exports the Drizzle database instance and
     helper methods for handling transactions.

2. **Type & Enum Bridging**
   * Replace the `@prisma/client` enum re-exports in `types/prisma.ts` with equivalents sourced
     from the Drizzle schema (using `pgEnum` and derived TypeScript types).
   * Ensure any public types consumed on the client are re-created (e.g., using `InferSelectModel`).

3. **Incremental Query Migration**
   * Start with core domains (projects, funding, settlements, partners) by rewriting the
     server modules to call Drizzle query builders or custom repository functions.
   * Replace transactional logic (`prisma.$transaction`) with Drizzle's `db.transaction` API.
   * Gradually update API routes to consume the new repository layer, deleting Prisma imports
     as each route is migrated.

4. **Tests & Scripts**
   * Update seed and maintenance scripts to use the new Drizzle helpers.
   * Refactor unit/integration tests to seed data via Drizzle or dedicated repository utilities.
   * Remove Prisma-specific test mocks once the migration is complete.

5. **Clean-Up & Verification**
   * Remove the `prisma/` directory, Prisma dependencies, and related NPM scripts once all
     modules have been migrated.
   * Run full regression tests (Jest, Playwright) and execute database smoke tests to ensure the
     new Drizzle layer produces identical results.

## Immediate Next Steps

* Finalise the Drizzle schema definition and set up the database client factory.
* Introduce repository utilities for projects and funding to validate the schema and connection.
* Incrementally port the settlement and partner modules, which surfaced the encoding issues
  corrected in this patch, to establish the migration pattern.

By following these steps we can transition from Prisma to Drizzle while preserving the existing
business logic and keeping risk contained through incremental updates.
