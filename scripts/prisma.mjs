// Menjalankan Prisma CLI milik backend dengan folder kerja apps/backend,
// supaya prisma/schema.prisma dan apps/backend/.env terbaca.
// Contoh: node scripts/prisma.mjs migrate status
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], {
  cwd: 'apps/backend',
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exitCode = result.status ?? 1;
