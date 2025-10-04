#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  console.warn('[build] DATABASE_URL is not set. Skipping `prisma migrate deploy`.');
} else {
  try {
    console.log('[build] Running prisma migrate deploy...');
    run('npx', ['prisma', 'migrate', 'deploy']);
  } catch (error) {
    console.warn('[build] Prisma migrate deploy failed, continuing with build...');
    console.warn(error.message);
  }
}

console.log('[build] Generating Prisma client...');
run('npx', ['prisma', 'generate']);

console.log('[build] Building Next.js application...');
run('next', ['build']);
