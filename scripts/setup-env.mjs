// Membuat apps/backend/.env dan apps/mobile/.env dari .env.example bila belum ada.
// - JWT_ACCESS_SECRET diisi string acak 64 karakter hex.
// - EXPO_PUBLIC_API_URL diisi IP LAN laptop supaya bisa dibuka dari Expo Go di HP.
// File .env yang sudah ada tidak ditimpa.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { lanIps } from './lan-ip.mjs';

function createEnv(dir, transform) {
  const example = `${dir}/.env.example`;
  const target = `${dir}/.env`;
  if (existsSync(target)) {
    console.log(`- ${target} sudah ada, tidak diubah.`);
    return;
  }
  const content = transform(readFileSync(example, 'utf8'));
  writeFileSync(target, content);
  console.log(`- ${target} dibuat dari ${example}.`);
}

createEnv('apps/backend', (text) =>
  text.replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET="${randomBytes(32).toString('hex')}"`),
);

const ip = lanIps()[0]?.address;
createEnv('apps/mobile', (text) => {
  if (!ip) {
    console.log('  IP LAN tidak ketemu. Isi EXPO_PUBLIC_API_URL di apps/mobile/.env secara manual.');
    return text;
  }
  console.log(`  EXPO_PUBLIC_API_URL diisi http://${ip}:3000`);
  return text.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=http://${ip}:3000`);
});

console.log('\nCek DATABASE_URL di apps/backend/.env (user, sandi, nama database), lalu jalankan: npm run db:migrate');
