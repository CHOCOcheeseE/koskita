// Cek cepat kesiapan laptop untuk menjalankan KosKita secara lokal.
// Tidak mengubah apa pun. Jalankan: npm run doctor
import { existsSync, readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { lanIps } from './lan-ip.mjs';

let problems = 0;
const ok = (msg) => console.log(`  OK    ${msg}`);
const bad = (msg) => {
  problems += 1;
  console.log(`  GAGAL ${msg}`);
};
const info = (msg) => console.log(`  INFO  ${msg}`);

function readEnv(path) {
  if (!existsSync(path)) return null;
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function canConnect(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

console.log('Node.js');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major > 20 || (major === 20 && minor >= 19)) ok(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node}, butuh minimal 20.19 (pasang Node LTS dari nodejs.org)`);

console.log('Dependensi');
for (const app of ['backend', 'mobile']) {
  if (existsSync(`apps/${app}/node_modules`)) ok(`apps/${app}/node_modules ada`);
  else bad(`apps/${app}/node_modules belum ada, jalankan: npm run setup`);
}

console.log('Backend (.env)');
const be = readEnv('apps/backend/.env');
if (!be) {
  bad('apps/backend/.env belum ada, jalankan: npm run setup:env');
} else {
  const secret = be.JWT_ACCESS_SECRET ?? '';
  if (secret.length >= 32 && !secret.toLowerCase().includes('ganti')) ok('JWT_ACCESS_SECRET terisi');
  else bad('JWT_ACCESS_SECRET kosong, terlalu pendek, atau masih contoh. Buat dengan: npm run secret');

  let dbUrl = null;
  try {
    dbUrl = new URL(be.DATABASE_URL ?? '');
  } catch {
    bad('DATABASE_URL tidak valid');
  }
  if (dbUrl) {
    const host = dbUrl.hostname || 'localhost';
    const port = Number(dbUrl.port || 5432);
    if (await canConnect(host, port)) ok(`PostgreSQL menjawab di ${host}:${port}`);
    else bad(`PostgreSQL tidak menjawab di ${host}:${port}. Pastikan service postgresql-x64 berjalan.`);
  }
}

console.log('Mobile (.env)');
const mo = readEnv('apps/mobile/.env');
if (!mo) {
  bad('apps/mobile/.env belum ada, jalankan: npm run setup:env');
} else {
  const api = mo.EXPO_PUBLIC_API_URL ?? '';
  if (/localhost|127\.0\.0\.1/.test(api)) {
    bad(`EXPO_PUBLIC_API_URL=${api} tidak bisa dibuka dari HP. Ganti dengan IP LAN laptop.`);
  } else if (api) {
    ok(`EXPO_PUBLIC_API_URL=${api}`);
  } else {
    bad('EXPO_PUBLIC_API_URL kosong');
  }
}

console.log('Jaringan');
const ips = lanIps();
if (ips.length === 0) info('IP LAN tidak ketemu. Sambungkan laptop ke Wi-Fi.');
for (const { name, address } of ips) info(`${name}: http://${address}:3000`);

const port = Number(be?.PORT || 3000);
if (await canConnect('127.0.0.1', port, 1000)) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/health`);
    if (res.ok) ok(`backend menyala: http://localhost:${port}/v1/health`);
    else info(`port ${port} terpakai, tapi /v1/health membalas ${res.status}`);
  } catch {
    info(`port ${port} terpakai oleh program lain`);
  }
} else {
  info(`backend belum menyala di port ${port} (jalankan: npm run dev:backend)`);
}

console.log(problems === 0 ? '\nSemua siap.' : `\nAda ${problems} hal yang perlu dibereskan.`);
process.exitCode = problems === 0 ? 0 : 1;
