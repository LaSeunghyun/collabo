#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  console.warn('[build] DATABASE_URL is not set. Skipping `prisma migrate deploy`.');
} else {
  run('npx', ['prisma', 'migrate', 'deploy']);
}

run('npx', ['prisma', 'generate']);
run('next', ['build']);
