# Cara menjalankan KosKita di laptop

Panduan ini untuk laptop Windows. Semuanya gratis dan jalan lokal: PostgreSQL di laptop, backend NestJS di laptop, dan aplikasi dibuka lewat **Expo Go** di HP. Tidak ada layanan cloud, EAS Build, atau API key.

Semua perintah dijalankan dari **folder root repo** (folder yang berisi `package.json` dan `apps/`), di PowerShell atau Command Prompt.

## Ringkasan cepat

Kalau PostgreSQL sudah terpasang dan database sudah dibuat (langkah 1):

```powershell
npm run setup        # pasang dependensi backend dan mobile
npm run setup:env    # buat apps/backend/.env dan apps/mobile/.env
npm run db:migrate   # buat tabel di database
npm run doctor       # cek kesiapan
npm run dev:backend  # terminal 1: API di http://localhost:3000/v1
npm run dev:mobile   # terminal 2: Expo, pindai QR dengan Expo Go
```

## Yang perlu dipasang

| Program | Versi | Sumber |
|---|---|---|
| Node.js | LTS 22 (minimal 20.19) | https://nodejs.org |
| PostgreSQL | 16 atau 17 | https://www.postgresql.org/download/windows/ (installer resmi EDB) |
| Git | terbaru | https://git-scm.com |
| Expo Go | terbaru, versi yang mendukung Expo SDK 58 | Play Store / App Store di HP |

Cek Node: `node -v`.

## 1. Pasang PostgreSQL dan buat database

1. Unduh installer PostgreSQL untuk Windows dari tautan di atas, lalu jalankan.
2. Saat instalasi:
   - Komponen: centang **PostgreSQL Server** dan **Command Line Tools** (pgAdmin opsional).
   - Isi sandi untuk user `postgres`. Catat sandinya.
   - Port biarkan **5432**.
3. Setelah selesai, PostgreSQL berjalan otomatis sebagai service Windows (`postgresql-x64-17` atau sejenisnya). Kalau mati, buka `services.msc` lalu Start service itu.
4. Buka **SQL Shell (psql)** dari Start Menu (tekan Enter untuk semua isian bawaan, lalu masukkan sandi `postgres`). Jalankan:

   ```sql
   CREATE USER koskita WITH PASSWORD 'koskita' CREATEDB;
   CREATE DATABASE koskita OWNER koskita;
   ```

   Nilai `koskita`/`koskita` cocok dengan contoh `DATABASE_URL`. Kalau memakai sandi lain, ubah juga di `apps/backend/.env` nanti. Izin `CREATEDB` dibutuhkan Prisma untuk database bayangan saat membuat migrasi baru.

   Kalau `psql` dipanggil dari terminal biasa dan tidak dikenali, pakai path lengkap, misalnya `"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres`.

## 2. Pasang dependensi

```powershell
npm run setup
```

Perintah ini menjalankan `npm install` di `apps/backend` (sekaligus `prisma generate`) lalu di `apps/mobile`. Pertama kali bisa beberapa menit.

Repo ini sengaja **tidak** memakai npm workspaces. Backend memakai TypeScript 5.8 dan mobile memakai TypeScript 6 (Expo SDK 58), dan masing-masing punya `package-lock.json` sendiri. Jadi jangan jalankan `npm install` di root untuk memasang paket aplikasi. Pakai `npm run setup` atau `npm --prefix apps/<app> install`.

## 3. Isi file .env dan jalankan migrasi

```powershell
npm run setup:env
```

Skrip ini menyalin `.env.example` menjadi `.env` di `apps/backend` dan `apps/mobile`, **tanpa menimpa** `.env` yang sudah ada:

- `apps/backend/.env`: `JWT_ACCESS_SECRET` langsung diisi string acak 64 karakter.
- `apps/mobile/.env`: `EXPO_PUBLIC_API_URL` diisi `http://<IP-Wi-Fi-laptop>:3000`.

Cara manual (kalau mau):

```powershell
copy apps\backend\.env.example apps\backend\.env
copy apps\mobile\.env.example apps\mobile\.env
npm run secret       # salin hasilnya ke JWT_ACCESS_SECRET di apps/backend/.env
```

Backend menolak start kalau `JWT_ACCESS_SECRET` kurang dari 32 karakter atau masih nilai contoh (mengandung "ganti").

Isi `apps/backend/.env` yang penting:

| Variabel | Arti | Contoh |
|---|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL lokal | `postgresql://koskita:koskita@localhost:5432/koskita?schema=public` |
| `PORT` | Port API | `3000` |
| `JWT_ACCESS_SECRET` | Rahasia tanda tangan token, minimal 32 karakter acak | hasil `npm run secret` |
| `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS` | Umur token | `900`, `30` |
| `BCRYPT_ROUNDS` | Cost hash sandi (4 sampai 15) | `10` |
| `AUTH_THROTTLE_*`, `JOIN_THROTTLE_*` | Batas percobaan login/daftar dan gabung grup per IP | `10` per `60000` ms |
| `CORS_ORIGINS` | Origin browser yang diizinkan, pisahkan koma. Kosong = semua | kosong |

Lalu buat tabel:

```powershell
npm run db:migrate   # prisma migrate deploy
npm run db:status    # cek: "Database schema is up to date!"
```

## 4. Jalankan backend

```powershell
npm run dev:backend
```

Tunggu sampai muncul `KosKita API jalan di http://localhost:3000/v1`. Cek di browser: http://localhost:3000/v1/health.

Backend mendengarkan di `0.0.0.0`, jadi bisa dibuka dari HP di Wi-Fi yang sama.

Mode build (tanpa pantau perubahan): `npm run build` lalu `npm run start:backend`.

## 5. Buka aplikasi di HP dengan Expo Go

1. Pastikan **HP dan laptop tersambung ke Wi-Fi yang sama**.
2. Pastikan `EXPO_PUBLIC_API_URL` di `apps/mobile/.env` berisi IP laptop, **bukan** `localhost` (di HP, `localhost` berarti HP itu sendiri). Lihat IP laptop dengan `npm run doctor` atau `ipconfig` (bagian "Wireless LAN adapter Wi-Fi", baris IPv4 Address). Contoh: `EXPO_PUBLIC_API_URL=http://192.168.1.10:3000`.
3. Cek dari browser HP bahwa http://IP-laptop:3000/v1/health bisa dibuka. Kalau tidak bisa, lihat bagian Masalah umum (firewall).
4. Di terminal kedua:

   ```powershell
   npm run dev:mobile
   ```

5. Pindai QR yang muncul:
   - Android: buka Expo Go lalu pilih "Scan QR code".
   - iPhone: pakai aplikasi Kamera, lalu ketuk tautan Expo Go.
6. Setelah mengubah `.env` mobile, hentikan Expo (Ctrl+C) lalu jalankan `npm --prefix apps/mobile run start -- -c` supaya cache dibersihkan dan nilai baru terbaca.

Opsi lain:
- Emulator Android: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`, lalu tekan `a` di terminal Expo.
- Web (cek cepat di laptop): tekan `w`, dan `EXPO_PUBLIC_API_URL=http://localhost:3000` cukup.
- Jaringan kampus/kos yang memblokir koneksi antar perangkat: aktifkan hotspot dari HP, sambungkan laptop ke hotspot itu, jalankan `npm run doctor` untuk IP barunya, ubah `.env` mobile, lalu ulangi langkah 4.

`npm run dev` menjalankan backend dan Expo sekaligus di satu terminal. Outputnya bercampur, jadi dua terminal terpisah biasanya lebih nyaman.

## Skrip di root

| Skrip | Fungsi |
|---|---|
| `npm run setup` | `npm install` di backend dan mobile |
| `npm run setup:env` | Buat `.env` backend dan mobile dari contoh (tidak menimpa) |
| `npm run doctor` | Cek Node, dependensi, `.env`, PostgreSQL, IP LAN, dan status backend |
| `npm run secret` | Cetak string acak untuk `JWT_ACCESS_SECRET` |
| `npm run db:migrate` | Terapkan migrasi Prisma ke database |
| `npm run db:status` | Lihat status migrasi |
| `npm run dev` | Backend + Expo dalam satu terminal |
| `npm run dev:backend` | Backend mode pantau |
| `npm run dev:mobile` | Expo (QR untuk Expo Go) |
| `npm run start:backend` | Jalankan hasil build backend |
| `npm run build` | Build backend ke `apps/backend/dist` + typecheck mobile |
| `npm test` | Tes backend (unit + e2e, tanpa database) lalu tes mobile |
| `npm run test:backend` / `test:mobile` | Tes salah satu aplikasi saja |
| `npm run lint` | Typecheck backend dan mobile + ESLint mobile |
| `npm run audit:backend` / `audit:mobile` | `npm audit` dependensi produksi |

Aplikasi mobile tidak di-build jadi APK di sini. Selama pengembangan cukup Expo Go, dan EAS Build tidak dipakai.

## Masalah umum

| Gejala | Penyebab dan solusi |
|---|---|
| `npm run doctor`: PostgreSQL tidak menjawab | Service PostgreSQL mati. Buka `services.msc`, lalu Start `postgresql-x64-…`. |
| `P1001: Can't reach database server at localhost:5432` | Sama dengan di atas: PostgreSQL belum terpasang atau service-nya mati. |
| `P1000: Authentication failed` saat migrasi | User/sandi di `DATABASE_URL` salah. Samakan dengan langkah 1. |
| `P1003: Database koskita does not exist` | Database belum dibuat. Ulangi `CREATE DATABASE` di langkah 1. |
| Backend berhenti: `JWT_ACCESS_SECRET ...` | Isi dengan hasil `npm run secret`. |
| `EADDRINUSE :3000` | Port terpakai. Tutup proses lain atau ganti `PORT` (dan port di `EXPO_PUBLIC_API_URL`). |
| Expo Go: "Network request failed" / tidak bisa masuk | `EXPO_PUBLIC_API_URL` masih `localhost`, IP berubah, beda Wi-Fi, atau firewall. Jalankan `npm run doctor`. |
| HP tidak bisa membuka `http://IP-laptop:3000/v1/health` | Windows Firewall memblokir Node. Saat muncul dialog izin pertama kali, centang **Private networks**. Atau jalankan PowerShell sebagai Administrator: `New-NetFirewallRule -DisplayName "KosKita API 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private`. Pastikan profil Wi-Fi diatur **Private**. |
| QR tidak tersambung ke Metro (port 8081) | Sama seperti di atas untuk port 8081, atau jalankan `npm --prefix apps/mobile run start -- --tunnel` (gratis, tapi lebih lambat). |
| Expo Go bilang versi SDK tidak cocok | Perbarui Expo Go dari Play Store / App Store. |

## Docker (opsional, untuk nanti)

`infra/docker-compose.yml` berisi PostgreSQL dan backend dalam container. Ini **tidak** dibutuhkan untuk jalan lokal di atas. Kalau nanti Docker Desktop terpasang:

```powershell
copy .env.example .env     # isi JWT_ACCESS_SECRET dengan hasil npm run secret
docker compose --env-file .env -f infra/docker-compose.yml up --build
```

PostgreSQL container dibuka di port `5433` (supaya tidak bentrok dengan PostgreSQL yang dipasang langsung) dan API di port `3000`. Migrasi dijalankan otomatis setiap backend start.
