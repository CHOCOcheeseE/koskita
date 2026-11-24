# QA KosKita

## Menjalankan tes

```bash
# Backend: unit + e2e (termasuk tes kasus tepi QA di test/qa-edge.e2e-spec.ts)
npm --prefix apps/backend test

# Hanya tes QA backend
npm --prefix apps/backend run test:e2e -- --testPathPattern qa-edge

# Mobile: aturan domain murni + ApiClient (memakai Jest milik backend, mobile tidak punya runner sendiri)
npx --prefix apps/backend jest --config apps/mobile/test/jest.config.json

# Typecheck dan lint mobile
npm --prefix apps/mobile run typecheck
npm --prefix apps/mobile run lint
```

Catatan:

- `apps/mobile/test/jest-globals.d.ts` berisi deklarasi minimal `describe`/`it`/`expect` supaya `tsc` mobile tetap hijau tanpa `@types/jest`.
- Tes bertanda `it.failing` adalah bug yang sudah dilaporkan. Tes itu hijau selama bug masih ada dan akan merah setelah bug diperbaiki. Setelah itu, ganti `it.failing` menjadi `it`.
- Tes e2e backend memakai repository in-memory. Repository Prisma (`apps/backend/src/*/data/prisma-*.ts`) belum pernah dijalankan ke PostgreSQL asli.

## Laporan

- [2026-11-24: review mobile dan backend](./2026-11-24-review.md)
