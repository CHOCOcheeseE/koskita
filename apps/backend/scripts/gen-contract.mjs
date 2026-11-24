// Membuat ulang src/contract/schema.d.ts dari contracts/openapi.yaml.
// Jalankan: npm --prefix apps/backend run gen:contract
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../../contracts/openapi.yaml');
const target = resolve(here, '../src/contract/schema.d.ts');

const ast = await openapiTS(pathToFileURL(source));
const header = [
  '/**',
  ' * Tipe dari contracts/openapi.yaml (openapi-typescript).',
  ' * Jangan diedit tangan: jalankan `npm --prefix apps/backend run gen:contract` setelah kontrak berubah.',
  ' */',
  '',
].join('\n');
const body = astToString(ast);
await writeFile(target, header + body, 'utf8');

const check = await readFile(target, 'utf8');
console.log(`schema.d.ts ditulis (${check.length} karakter)`);
