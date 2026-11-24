# KosKita Backend

API NestJS untuk KosKita. Acuan tunggal: `contracts/openapi.yaml` (v1.1.0). Semua rute diawali `/v1`.

## Menjalankan

Semua perintah dijalankan dari root repo.

```bash
npm --prefix apps/backend install          # sekaligus prisma generate
cp apps/backend/.env.example apps/backend/.env   # lalu isi DATABASE_URL dan JWT_ACCESS_SECRET
npx --prefix apps/backend prisma migrate deploy --schema apps/backend/prisma/schema.prisma
npm --prefix apps/backend run start:dev    # http://localhost:3000/v1/health
```

Build produksi lokal: `npm --prefix apps/backend run build` lalu `npm --prefix apps/backend run start`.

## Skrip

| Skrip | Fungsi |
|---|---|
| `build` | `prisma generate` + kompilasi TypeScript ke `dist/` |
| `start` / `start:dev` | Jalankan hasil build / mode pantau |
| `typecheck` | Cek tipe termasuk tes |
| `test` | Semua tes (unit + e2e) |
| `test:unit` / `test:e2e` | Hanya unit (rumus dan use case) / hanya e2e (HTTP) |
| `gen:contract` | Buat ulang `src/contract/schema.d.ts` dari kontrak |

## Struktur

```
src/
  main.ts, app.module.ts, app.setup.ts   # prefix v1, ValidationPipe, filter error
  config/env.ts                          # validasi env saat start
  contract/schema.d.ts                   # tipe dari kontrak (jangan diedit tangan)
  common/
    domain/       AppError, Clock, format rupiah
    time/wib.ts   helper kalender WIB (Asia/Jakarta)
    pagination/   kursor base64url { v, i }
    presentation/ guard JWT + @Public + @CurrentUser, filter error, validasi, pipe UUID
    data/         PrismaService
  <modul>/                                # health, auth, profile, wallet, split-bill, study, home
    domain/       rumus murni, port repository, use case (tanpa import Nest/Prisma)
    data/         repository Prisma
    presentation/ controller, DTO class-validator, mapper ke tipe kontrak
test/
  support/        app tes + repository in-memory + validator kontrak (Ajv)
  *.e2e-spec.ts   Supertest per modul + contract.e2e-spec.ts
```

## Aturan penting

- **Error** selalu `{ "error": { "code", "message", "details?" } }`. 400 = validasi field (`details` per field), 422 = aturan bisnis.
- **Data pribadi orang lain** (transaksi, jadwal, tugas) selalu 404. Grup/tagihan yang ada tapi bukan anggota: 403 `NOT_GROUP_MEMBER`.
- **ID di path yang bukan UUID** dibalas 404 `NOT_FOUND` (pasti tidak ada).
- **Waktu**: semua "hari ini" dan "bulan berjalan" dihitung di WIB lewat `Clock` yang di-inject, jadi tes bisa memakai tanggal tetap.
- **Token**: access JWT HS256 15 menit (`TOKEN_EXPIRED` saat habis), refresh token buram 30 hari yang disimpan hash SHA-256-nya dan dirotasi sekali pakai.
- **Kata sandi**: bcrypt cost 10 (`bcryptjs`, tanpa build native).
- **Throttle**: `login` dan `register` dibatasi `AUTH_THROTTLE_LIMIT` per `AUTH_THROTTLE_TTL_MS` per IP, balas 429 `TOO_MANY_REQUESTS`.

## Tes

Tes e2e memakai repository in-memory (`test/support/in-memory.ts`) yang meniru perilaku repository Prisma. Jadi tes bisa jalan tanpa PostgreSQL. `test/contract.e2e-spec.ts` memanggil ke-34 operasi kontrak. Setiap respons (sukses dan error) divalidasi dengan Ajv terhadap skema OpenAPI, dan field di luar kontrak juga ditolak.

Repository Prisma (`*/data/prisma-*.ts`) tidak ikut dites di sini. Untuk mengujinya, jalankan backend dengan PostgreSQL lokal (lihat `docs/cara-menjalankan.md`).
