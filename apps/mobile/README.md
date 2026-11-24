# KosKita Mobile

Aplikasi Expo (React Native, TypeScript, expo-router) untuk KosKita: Dompet, Patungan, Kuliah, dan Beranda.
Semua angka (jatah harian, bagi rata, saldo, label deadline, bentrok jadwal) datang dari API; aplikasi hanya menampilkan.

## Menjalankan

1. Pastikan backend lokal menyala (`apps/backend`, lihat `docs/cara-menjalankan.md`).
2. Salin `.env.example` menjadi `.env`, isi `EXPO_PUBLIC_API_URL`:
   - emulator Android: `http://10.0.2.2:3000`
   - HP fisik di Wi-Fi yang sama: `http://<IP-LAN-laptop>:3000`
3. Dari root repo:

   ```bash
   npm --prefix apps/mobile install
   npm --prefix apps/mobile run start
   ```

4. Pindai QR dengan Expo Go. Tidak memakai EAS Build atau layanan berbayar.

## Cek kode

```bash
npx tsc --noEmit -p apps/mobile
npm --prefix apps/mobile run lint
```

Tipe API dibuat dari kontrak (jangan diedit tangan):

```bash
npx openapi-typescript contracts/openapi.yaml -o apps/mobile/src/data/api/schema.d.ts
```

## Struktur

```
app/                      rute expo-router (file tipis, hanya re-export layar)
  (auth)/masuk, daftar    A1, A2
  (tabs)/index, dompet, patungan, kuliah   B1, D1, P1, K1
  profil, anggaran, ringkasan/[month], transaksi/*, grup/*, tagihan/[id], jadwal/*, tugas/*
src/
  domain/<modul>/         entity, interface repository, use case, aturan murni (tanpa React/Expo)
  data/<modul>/           repository HTTP + mapper DTO ke entity
  data/api/               client.ts (bearer, refresh otomatis, ErrorResponse), schema.d.ts, token-storage.ts
  data/container.ts       merakit repository dan use case
  presentation/<modul>/   layar, form (react-hook-form + zod), hook TanStack Query
  shared/                 tema (token desain), format Rupiah/tanggal WIB, komponen UI
```

Modul: `auth` (termasuk profil), `home`, `wallet`, `split-bill`, `study`.

## Keputusan penting

- Token disimpan di `expo-secure-store` (di web hanya di memori).
- `401 TOKEN_EXPIRED` memicu satu kali `refreshTokens` lalu request diulang; gagal = kembali ke Masuk dengan pesan "Sesi berakhir, silakan masuk lagi".
- Pesan error dipilih dari `error.code` (tabel desain 9.2), bukan dari `error.message`.
- Setelah mutasi transaksi, tagihan, atau tugas, query `['home','today']` ikut dimuat ulang.
- Semua animasi mati saat pengaturan kurangi gerakan aktif.
