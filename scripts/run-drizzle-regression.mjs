#!/usr/bin/env node
import { spawn } from 'node:child_process';

const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });
  });

const main = async () => {
  const steps = [
    { label: 'Lint', command: 'npm', args: ['run', 'lint'] },
    { label: 'Unit & Integration Tests', command: 'npm', args: ['run', 'test', '--', '--runInBand'] },
  ];

  for (const step of steps) {
    console.log(`\n[drizzle-regression] ▶ ${step.label}`);
    const code = await run(step.command, step.args);

    if (code !== 0) {
      console.error(`\n[drizzle-regression] ✖ ${step.label} 실패 (exit code ${code}).`);
      process.exit(code);
    }
  }

  console.log('\n[drizzle-regression] ✅ 모든 회귀 검증이 통과했습니다.');
};

main().catch((error) => {
  console.error('\n[drizzle-regression] 예기치 못한 오류가 발생했습니다.', error);
  process.exit(1);
});
