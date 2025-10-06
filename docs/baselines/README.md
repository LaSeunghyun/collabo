# Prisma Schema Baselines

This directory stores generated SQL snapshots of the Prisma datamodel. Use `npm run db:baseline` to refresh `prisma-schema-baseline.sql` before generating Drizzle migrations so we can diff the new SQL accurately.

Artifacts in this folder are ephemeral and should be regenerated whenever `prisma/schema.prisma` changes.
