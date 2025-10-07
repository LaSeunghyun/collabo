#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const MIGRATOR = (process.env.DB_MIGRATOR || 'prisma').toLowerCase();
const isDrizzle = MIGRATOR === 'drizzle';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);
    console.error(`Exit code: ${result.status}, Signal: ${result.signal}`);
    throw new Error(`Command failed with status ${result.status || 'null'} and signal ${result.signal || 'none'}`);
  }

  return result;
}

function tryRun(command, args, options = {}) {
  try {
    run(command, args, options);
    return true;
  } catch (error) {
    console.warn(`[build] Optional command failed: ${command} ${args.join(' ')}`);
    console.warn(`[build] Continuing with build. Reason: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  console.warn('[build] DATABASE_URL is not set. Skipping database migration step.');
} else {
  const sanitizedUrl = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@');
  console.log(`[build] DATABASE_URL is set. Using ${isDrizzle ? 'Drizzle' : 'Prisma'} migrator.`);
  console.log('[build] Database URL:', sanitizedUrl);

  if (isDrizzle) {
    console.log('[build] Running drizzle-kit push...');
    tryRun('npx', ['drizzle-kit', 'push']);
  } else {
    console.log('[build] Running prisma migrate deploy...');
    tryRun('npx', ['prisma', 'migrate', 'deploy']);
  }
}

if (isDrizzle) {
  const shouldSkipGenerate = process.env.SKIP_DRIZZLE_GENERATE === '1';

  if (shouldSkipGenerate) {
    console.log('[build] SKIP_DRIZZLE_GENERATE is set. Skipping drizzle-kit generate.');
  } else {
    console.log('[build] Generating Drizzle artifacts...');
    tryRun('npx', ['drizzle-kit', 'generate']);
  }
} else {
  console.log('[build] Generating Prisma client...');
  run('npx', ['prisma', 'generate']);
  console.log('[build] Prisma client generated successfully');
}

console.log('[build] Building Next.js application...');
run('next', ['build']);
console.log('[build] Next.js build completed successfully');
