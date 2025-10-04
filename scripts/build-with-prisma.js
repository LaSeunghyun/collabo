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
  console.log('[build] DATABASE_URL is set. Attempting prisma migrate deploy...');
  console.log('[build] Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  
  // Set timeout for database operations
  const timeout = 30000; // 30 seconds
  const startTime = Date.now();
  
  try {
    console.log('[build] Running prisma migrate deploy...');
    const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { 
      stdio: 'inherit',
      timeout: timeout
    });
    
    if (result.status !== 0) {
      console.warn('[build] Prisma migrate deploy failed with status:', result.status);
      console.warn('[build] Continuing with build...');
    } else {
      console.log('[build] Prisma migrate deploy completed successfully');
    }
  } catch (error) {
    console.warn('[build] Prisma migrate deploy failed:', error.message);
    console.warn('[build] Continuing with build...');
  }
}

console.log('[build] Generating Prisma client...');
run('npx', ['prisma', 'generate']);

console.log('[build] Building Next.js application...');
run('next', ['build']);
