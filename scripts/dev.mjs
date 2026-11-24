// Menjalankan backend (mode pantau) dan Expo sekaligus dari root repo.
// Ctrl+C menghentikan keduanya. Kalau output terasa campur aduk,
// jalankan `npm run dev:backend` dan `npm run dev:mobile` di dua terminal.
import { spawn } from 'node:child_process';

const jobs = [
  { name: 'backend', cmd: 'npm --prefix apps/backend run start:dev' },
  { name: 'mobile', cmd: 'npm --prefix apps/mobile run start' },
];

const children = jobs.map(({ name, cmd }) => {
  const child = spawn(cmd, { shell: true, stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`[${name}] berhenti (kode ${code ?? 0})`);
    stopAll();
  });
  return child;
});

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
