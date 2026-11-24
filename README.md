# Super App

Monorepo untuk aplikasi super app: aplikasi mobile, backend API, dan database.

## Struktur

| Folder | Isi |
|---|---|
| `apps/mobile` | Aplikasi mobile (Expo, React Native, TypeScript) |
| `apps/backend` | API backend (NestJS, TypeScript) dan skema database (Prisma) |
| `contracts/openapi.yaml` | Kontrak API, acuan bersama mobile dan backend |
| `docs/` | Dokumen produk, arsitektur, desain, database, dan cara menjalankan |
| `infra/` | Konfigurasi build dan deploy |

## Menjalankan

Panduan lengkapnya ada di `docs/cara-menjalankan.md`. Ringkasnya, dari root repo:

```powershell
npm run setup        # dependensi backend + mobile
npm run setup:env    # buat file .env
npm run db:migrate   # butuh PostgreSQL lokal
npm run dev:backend  # API di http://localhost:3000/v1
npm run dev:mobile   # buka dengan Expo Go di HP
```

Cek kode: `npm run build`, `npm test`, `npm run lint`.
