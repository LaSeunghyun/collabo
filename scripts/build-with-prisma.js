#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);
    console.error(`Exit code: ${result.status}, Signal: ${result.signal}`);
    throw new Error(`Command failed with status ${result.status || 'null'} and signal ${result.signal || 'none'}`);
  }
  return result;
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
const prismaResult = spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit' });
if (prismaResult.status !== 0) {
  console.error('[build] Prisma generate failed with status:', prismaResult.status);
  console.error('[build] Signal:', prismaResult.signal);
  process.exit(1);
}
console.log('[build] Prisma client generated successfully');

console.log('[build] Building Next.js application...');
const buildResult = spawnSync('next', ['build'], { stdio: 'inherit' });
if (buildResult.status !== 0) {
  console.error('[build] Next.js build failed with status:', buildResult.status);
  console.error('[build] Signal:', buildResult.signal);
  process.exit(1);
}
console.log('[build] Next.js build completed successfully');
