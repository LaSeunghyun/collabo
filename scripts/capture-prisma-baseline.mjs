#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outputDir = resolve(projectRoot, 'docs/baselines');
const outputFile = join(outputDir, 'prisma-schema-baseline.sql');

try {
  mkdirSync(outputDir, { recursive: true });

  console.log('> Generating Prisma schema baseline (diff from empty)...');
  const diff = execSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    {
      cwd: projectRoot,
      stdio: 'pipe',
      env: {
        ...process.env,
        // Ensure prisma uses Node-API engine for deterministic output
        PRISMA_CLIENT_ENGINE_TYPE: 'library',
      },
    }
  );

  writeFileSync(outputFile, diff);
  const relativePath = relative(projectRoot, outputFile) || outputFile;
  console.log(`> Prisma schema baseline written to ${relativePath}`);
} catch (error) {
  console.error('! Failed to generate Prisma schema baseline.');
  if (error.stdout) {
    console.error(error.stdout.toString());
  }
  if (error.stderr) {
    console.error(error.stderr.toString());
  }
  process.exitCode = 1;
}
