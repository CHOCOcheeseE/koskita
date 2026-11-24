// Membuat ulang src/data/api/schema.d.ts dari contracts/openapi.yaml.
// Jalankan: npm --prefix apps/mobile run gen:api
// openapi-typescript dipanggil lewat npx (bukan dependensi) karena peer-nya belum mendukung TypeScript 6.
import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../../contracts/openapi.yaml');
const target = resolve(here, '../src/data/api/schema.d.ts');

execSync(`npx --yes openapi-typescript@7.13.0 "${source}" -o "${target}"`, { stdio: 'inherit' });

const header = [
  '/**',
  ' * Tipe dari contracts/openapi.yaml (openapi-typescript).',
  ' * Jangan diedit tangan: jalankan `npm --prefix apps/mobile run gen:api` setelah kontrak berubah.',
  ' */',
  '',
].join('\n');

const raw = await readFile(target, 'utf8');
// Buang blok komentar pembuka bawaan tool, ganti dengan header proyek.
const body = raw.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
await writeFile(target, header + '\n' + body, 'utf8');
console.log(`schema.d.ts ditulis (${(header + body).length} karakter)`);
