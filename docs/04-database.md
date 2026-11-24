# 04 · Database: KosKita

> Pemilik dokumen: Fitri (Database) · Versi 1.0 · 24 November 2026
> Acuan: [`contracts/openapi.yaml`](../contracts/openapi.yaml) v1.1.0 · [`docs/02-arsitektur.md`](02-arsitektur.md) · [`docs/01-produk.md`](01-produk.md)
> Skema: [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma) · Migrasi awal: [`apps/backend/prisma/migrations/20261124000000_init/migration.sql`](../apps/backend/prisma/migrations/20261124000000_init/migration.sql)

Tujuan utama skema ini: **data tidak dobel**. Tiap fakta disimpan sekali (3NF), duplikat dicegah oleh unique constraint di database (bukan cuma di kode), dan aturan angka yang paling penting dijaga lagi oleh CHECK constraint.

---

## 1. Ringkasan

| Hal | Pilihan |
|---|---|
| Database | PostgreSQL lokal (13 ke atas, karena memakai `gen_random_uuid()` bawaan) |
| ORM | Prisma **6.x** (`prisma` dan `@prisma/client` versi 6). Prisma 7 memindahkan `url` ke `prisma.config.ts`, jadi jangan naik versi tanpa menyesuaikan skema. |
| Primary key | `id` UUID (`@default(uuid())`, kolom `uuid`) di semua tabel |
| Waktu | `created_at`, `updated_at` di semua tabel, tipe `timestamptz(3)` (UTC) |
| Uang | `Int` rupiah utuh. Nilai input dibatasi 1..100.000.000 lewat CHECK. Total agregat dihitung saat query, tidak disimpan. |
| Tanggal transaksi | `date` (tanpa jam, kalender WIB) |
| Bulan anggaran | `char(7)` format `YYYY-MM`, sama dengan skema `Month` di kontrak |
| Jam kuliah | `smallint` menit sejak 00:00 WIB (08:00 = 480) |
| Penamaan | Model PascalCase di Prisma, tabel dan kolom snake_case di PostgreSQL (`@@map`/`@map`) |
| Soft delete | Tidak dipakai. Tidak ada fitur MVP yang butuh "pulihkan data terhapus". |

## 2. Diagram relasi (ER)

```mermaid
erDiagram
  users ||--o{ refresh_tokens : "punya"
  users ||--o{ transactions : "mencatat"
  users ||--o{ budgets : "mengatur"
  wallet_categories ||--o{ transactions : "mengelompokkan"
  users ||--o{ group_members : "ikut"
  groups ||--o{ group_members : "beranggota"
  groups ||--o{ bills : "punya"
  users ||--o{ bills : "membayar (payer_id)"
  users ||--o{ bills : "membuat (created_by_id)"
  bills ||--|{ bill_shares : "dibagi jadi"
  users ||--o{ bill_shares : "menanggung"
  users ||--o{ class_schedules : "punya"
  users ||--o{ study_tasks : "punya"
  class_schedules |o--o{ study_tasks : "ditaut (opsional)"

  users {
    uuid id PK
    varchar email UK "huruf kecil"
    varchar password_hash
    varchar name
    varchar campus "nullable"
    timestamptz created_at
    timestamptz updated_at
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK
    char token_hash UK "SHA-256 hex"
    timestamptz expires_at
    timestamptz used_at "nullable"
    timestamptz revoked_at "nullable"
  }
  wallet_categories {
    uuid id PK
    CategoryCode code UK
    TransactionType type
    varchar label
    smallint sort_order
  }
  transactions {
    uuid id PK
    uuid user_id FK
    CategoryCode category FK "ke wallet_categories.code"
    int amount
    date date
    varchar note "nullable"
  }
  budgets {
    uuid id PK
    uuid user_id FK
    char month "YYYY-MM"
    int amount
  }
  groups {
    uuid id PK
    varchar name
    char invite_code UK
  }
  group_members {
    uuid id PK
    uuid group_id FK
    uuid user_id FK
    timestamptz joined_at
  }
  bills {
    uuid id PK
    uuid group_id FK
    varchar title
    int total_amount
    SplitMethod split_method
    uuid payer_id FK
    uuid created_by_id FK
    BillStatus status
  }
  bill_shares {
    uuid id PK
    uuid bill_id FK
    uuid user_id FK
    int amount
    ShareStatus status
  }
  class_schedules {
    uuid id PK
    uuid user_id FK
    varchar course_name
    smallint day_of_week
    smallint start_minute
    smallint end_minute
    varchar room "nullable"
  }
  study_tasks {
    uuid id PK
    uuid user_id FK
    uuid schedule_id FK "nullable"
    varchar title
    timestamptz deadline
    varchar note "nullable"
    TaskStatus status
    timestamptz completed_at "nullable"
  }
```

(Kolom `created_at` dan `updated_at` ada di semua tabel; di diagram hanya ditulis di `users` supaya ringkas.)

## 3. Enum

| Enum Prisma | Nilai | Skema kontrak |
|---|---|---|
| `TransactionType` | `income`, `expense` | `TransactionType` |
| `CategoryCode` | `food`, `transport`, `housing_bills`, `study`, `leisure`, `other_expense`, `allowance`, `side_job`, `scholarship`, `other_income` | `Category` |
| `SplitMethod` | `equal`, `manual` | `SplitMethod` |
| `BillStatus` | `open`, `settled` | `BillStatus` |
| `ShareStatus` | `belum_bayar`, `menunggu_konfirmasi`, `lunas` | `ShareStatus` |
| `TaskStatus` | `belum`, `selesai` | `TaskStatus` |

Nilai enum sama persis dengan kontrak, jadi mapper cukup meneruskan nilainya tanpa tabel konversi. Bahasa nilai mengikuti K17 di arsitektur.

## 4. Keputusan normalisasi (supaya data tidak dobel)

| # | Keputusan | Alasan |
|---|---|---|
| N1 | **Tipe transaksi tidak disimpan di `transactions`.** Tipe (`income`/`expense`) diturunkan dari `wallet_categories.type` lewat relasi `category → code`. | Kategori menentukan tipe. Kalau tipe disimpan juga di tiap transaksi, ada ketergantungan transitif (melanggar 3NF) dan bisa muncul baris "Makan" bertipe `income`. Dengan cara ini `CATEGORY_TYPE_MISMATCH` mustahil tersimpan. Backend tetap mengecek `type` dari request terhadap kategori untuk membalas 422. |
| N2 | **Label kategori disimpan sekali** di `wallet_categories`, diisi oleh migrasi (bukan seed). | `listWalletCategories` dan `CategoryTotal.label` membaca tabel ini. Label tidak diulang di tiap transaksi. Karena diisi di migrasi, FK `transactions.category` selalu punya pasangan di database mana pun yang sudah dimigrasi. |
| N3 | **Total dan saldo tidak disimpan.** `MonthSummary`, `BudgetStatus.totalExpense`, `DailyAllowance`, `GroupBalances`, `SplitTotals`, `memberCount` dihitung saat request. | Angka turunan yang disimpan bisa basi kalau satu transaksi/bagian berubah. Data per user kecil, jadi query agregat dengan index di bawah sudah cepat. |
| N4 | **`GroupMember` hanya menyimpan anggota aktif.** Keluar grup = baris dihapus. Gabung lagi = baris baru dengan `joined_at` baru. | Sesuai Review Focus no. 4: gabung ulang tidak membuat duplikat (unik `group_id + user_id`) dan `joinedAt` baru. Tagihan lama tetap utuh karena `bill_shares.user_id` menunjuk ke `users`, bukan ke `group_members`. `memberCount` = `COUNT(*)` tanpa filter tambahan. |
| N5 | **`bill_shares.user_id` ke `users`**, bukan ke `group_members`. | Bagian tagihan harus tetap ada walau pemiliknya keluar grup setelah lunas. |
| N6 | **`bills.status` disimpan** walau sebenarnya bisa diturunkan dari bagian. Ini satu-satunya denormalisasi yang disengaja. | `listGroupBills?status=` butuh filter plus paginasi kursor yang cepat, dan arsitektur K15 sudah mewajibkan status bagian dan status tagihan diubah dalam satu transaksi Prisma. Aturan: setiap perubahan `bill_shares.status` → di transaksi yang sama hitung ulang `bills.status` (`settled` jika semua bagian `lunas`, selain itu `open`). |
| N7 | **`bills.total_amount` disimpan** bersama bagian. | Total adalah input pengguna dan muncul di kontrak (`Bill.totalAmount`). Jumlah `bill_shares.amount` = `total_amount` dijaga use case `createBill` (bagi rata menghasilkan jumlah tepat; manual dicek `SHARES_SUM_MISMATCH`). Bagian tidak bisa diubah setelah tagihan dibuat, jadi tidak bisa menyimpang. |
| N8 | **`StudyTask.courseName` tidak disimpan.** Diambil dari `class_schedules.course_name` lewat `schedule_id`. | Kalau nama mata kuliah diubah di jadwal, tugas otomatis ikut. Hapus jadwal → `schedule_id` jadi `NULL` (`onDelete: SetNull`), `courseName` di respons jadi `null` sesuai kontrak. |
| N9 | **Email disimpan huruf kecil** (CHECK `email = lower(email)`). | Unique `users.email` jadi tidak bisa diakali dengan `Ani@x.id` vs `ani@x.id`. Backend wajib `toLowerCase()` + trim sebelum simpan dan sebelum cari saat login. |

## 5. Unique constraint dan alasannya

| Constraint | Kolom | Mencegah |
|---|---|---|
| `users_email_key` | `users.email` | Dua akun dengan email sama (`409 EMAIL_TAKEN`). Backend menangkap error Prisma `P2002` dan membalas 409, jadi aman juga saat dua request daftar datang bersamaan. |
| `refresh_tokens_token_hash_key` | `refresh_tokens.token_hash` | Satu token terdaftar dua kali; juga jadi index pencarian saat `refreshTokens`/`logout`. |
| `wallet_categories_code_key` | `wallet_categories.code` | Kategori ganda; jadi target FK `transactions.category`. |
| `wallet_categories_type_sort_order_key` | `type, sort_order` | Dua kategori dengan urutan tampil sama dalam satu tipe. |
| `budgets_user_id_month_key` | `user_id, month` | Dua anggaran untuk bulan yang sama. `setBudget` (PUT) memakai `upsert` dengan kunci ini. |
| `groups_invite_code_key` | `groups.invite_code` | Dua grup dengan kode undangan sama. Jika `createInviteCode` kebetulan menghasilkan kode yang sudah ada, backend menangkap `P2002` lalu membuat kode baru (coba ulang maks 5 kali). |
| `group_members_group_id_user_id_key` | `group_id, user_id` | Anggota ganda. `joinGroup` yang idempoten memakai kunci ini: sudah ada → kembalikan grup tanpa insert. |
| `bill_shares_bill_id_user_id_key` | `bill_id, user_id` | Satu orang punya dua bagian di tagihan yang sama (misal `shares` manual berisi userId ganda). |

## 6. Index dan alasannya

Semua foreign key punya index (sendiri atau sebagai kolom pertama dari index gabungan).

| Index | Kolom | Dipakai oleh |
|---|---|---|
| `refresh_tokens_user_id_idx` | `user_id` | FK; cabut semua token user bila diperlukan. |
| `refresh_tokens_expires_at_idx` | `expires_at` | Bersih-bersih token kedaluwarsa (`DELETE ... WHERE expires_at < now()`). |
| `transactions_user_id_date_created_at_id_idx` | `user_id, date DESC, created_at DESC, id DESC` | `listTransactions` (filter bulan + urutan + kursor `(date, created_at, id)`), `getMonthSummary`, jatah harian (`spentBeforeToday`, `spentToday`), Beranda. Juga menutup FK `user_id`. |
| `transactions_category_idx` | `category` | FK ke `wallet_categories.code`. |
| `budgets_user_id_month_key` | `user_id, month` (unik) | `getBudgetStatus`, Beranda. Menutup FK `user_id`. |
| `group_members_group_id_joined_at_idx` | `group_id, joined_at` | `getGroup` (anggota urut `joinedAt` menaik), `splitEqually` (urutan sisa Rp1), `assertMember`, `memberCount`. |
| `group_members_user_id_joined_at_idx` | `user_id, joined_at DESC` | `listMyGroups` (urut `joinedAt` menurun), Beranda `hasGroups`. |
| `bills_group_id_created_at_id_idx` | `group_id, created_at DESC, id DESC` | `listGroupBills` tanpa filter + kursor. Menutup FK `group_id`. |
| `bills_group_id_status_created_at_id_idx` | `group_id, status, created_at DESC, id DESC` | `listGroupBills?status=open|settled`. |
| `bills_payer_id_idx`, `bills_created_by_id_idx` | `payer_id`, `created_by_id` | FK. |
| `bill_shares_bill_id_status_idx` | `bill_id, status` | Detail tagihan, cek `BILL_HAS_PAYMENTS`, hitung ulang `bills.status`, saldo grup (join `bills` per grup lalu filter status belum lunas). |
| `bill_shares_user_id_status_idx` | `user_id, status` | FK; bagian saya yang belum lunas (Beranda, `leaveGroup`). |
| `class_schedules_user_id_day_of_week_start_minute_idx` | `user_id, day_of_week, start_minute` | `listSchedules` (urut hari lalu jam), `?dayOfWeek=`, `classesToday`, `findConflicts` (jadwal lain di hari sama). |
| `study_tasks_user_id_status_deadline_id_idx` | `user_id, status, deadline, id` | `listTasks?status=belum` (urut deadline menaik + kursor), Beranda `upcomingTasks` (3 teratas). |
| `study_tasks_user_id_status_completed_at_id_idx` | `user_id, status, completed_at DESC, id DESC` | `listTasks?status=selesai` (urut `completedAt` menurun + kursor). |
| `study_tasks_schedule_id_idx` | `schedule_id` | FK; `SET NULL` saat jadwal dihapus. |

## 7. Aturan di level database (CHECK constraint)

Prisma belum bisa menulis CHECK di `schema.prisma`, jadi ditulis tangan di akhir `migration.sql`. Ini lapis terakhir: validasi utama tetap di backend supaya error yang keluar berbentuk kontrak (400/422). Kalau CHECK sampai kena, itu tanda ada bug di backend.

| Constraint | Aturan | Sumber |
|---|---|---|
| `users_email_lowercase_chk` | `email = lower(email)` | N9 |
| `refresh_tokens_token_hash_chk` | 64 karakter hex huruf kecil | K4 (simpan hash SHA-256) |
| `transactions_amount_chk`, `budgets_amount_chk`, `bills_total_amount_chk` | 1..100.000.000 | `PositiveRupiah` |
| `bill_shares_amount_chk` | 0..100.000.000 | `ShareInput.amount` = `Rupiah` (boleh 0, misal tagihan Rp1 dibagi 3) |
| `budgets_month_chk` | `^[0-9]{4}-(0[1-9]|1[0-2])$` | `Month` |
| `groups_invite_code_chk` | `^[A-HJ-NP-Z2-9]{6}$` | `InviteCode` |
| `class_schedules_day_of_week_chk` | 1..7 | `DayOfWeek` |
| `class_schedules_minutes_chk` | 0..1439 | `Time` |
| `class_schedules_time_range_chk` | `end_minute > start_minute` | `TIME_RANGE_INVALID` |
| `study_tasks_completed_at_chk` | `completed_at` terisi jika dan hanya jika `status = 'selesai'` | KLH-02 (centang selesai / batal) |

## 8. Aturan hapus (onDelete)

| Relasi | Aksi | Alasan |
|---|---|---|
| `users` → `refresh_tokens`, `transactions`, `budgets`, `class_schedules`, `study_tasks`, `group_members` | `Cascade` | Data pribadi ikut pemiliknya. (Hapus akun belum ada di MVP; ini hanya untuk kebersihan data tes.) |
| `users` → `bills.payer_id`, `bills.created_by_id`, `bill_shares.user_id` | `Restrict` | Catatan patungan menyangkut orang lain; user tidak boleh terhapus diam-diam dan membuat utang hilang. |
| `groups` → `group_members`, `bills` | `Cascade` | Hapus grup belum ada di MVP; kalau nanti ada, isinya ikut. |
| `bills` → `bill_shares` | `Cascade` | `deleteBill` cukup hapus baris tagihan; bagiannya ikut terhapus. |
| `class_schedules` → `study_tasks.schedule_id` | `SetNull` | Kontrak `deleteSchedule`: tugas jadi tanpa mata kuliah. |
| `wallet_categories` → `transactions` | `Restrict` | Kategori yang dipakai tidak boleh hilang. |

## 9. Pemetaan tabel ke skema kontrak

| Skema kontrak | Sumber data | Catatan mapper |
|---|---|---|
| `User` | `users` | `passwordHash` **tidak pernah** ikut respons. `campus` null tetap null. String kosong dari `updateMyProfile` disimpan sebagai `NULL`. |
| `AuthTokens.refreshToken` | `refresh_tokens` | Token asli (acak, mis. 32 byte base64url) hanya dikirim ke klien. DB menyimpan `sha256(token)` hex. Rotasi: cari hash → harus `used_at IS NULL`, `revoked_at IS NULL`, `expires_at > now()` → isi `used_at`, buat baris baru. Gagal → `401 SESSION_EXPIRED`. `logout` mengisi `revoked_at` (tetap 204 walau tidak ketemu). |
| `CategoryInfo` | `wallet_categories` | Urut `type` (`expense` dulu) lalu `sort_order`. |
| `Transaction` | `transactions` + `wallet_categories` | `type` = `categoryInfo.type` (pakai `include: { categoryInfo: true }`). `date` kolom `date` → string `YYYY-MM-DD` (ambil bagian tanggal UTC dari objek Date Prisma; jangan dikonversi ke WIB lagi). |
| `TransactionPage` | `transactions` | Kursor = base64 `(date, createdAt, id)`; filter `date` di antara hari pertama dan terakhir bulan. |
| `MonthSummary`, `CategoryTotal` | `transactions` `groupBy category` + `wallet_categories` | `totalIncome`/`totalExpense` = jumlah per tipe kategori. Hasil `_sum` dari Prisma bisa melebihi `Int` 32-bit di level agregat; PostgreSQL mengembalikan `bigint` untuk `SUM(integer)`, Prisma mengubahnya ke `number`, aman di bawah 2^53 (K8). |
| `BudgetStatus`, `DailyAllowance` | `budgets` + jumlah `transactions` pengeluaran | `budgets.amount` → `amount`; sisanya dari rumus domain. |
| `GroupSummary` | `group_members` (milik saya) + `groups` + hitung anggota + saldo | `memberCount` = `_count.members`. `myNetBalance`, `isSettledForMe` dari `computeNetBalances`. |
| `GroupDetail`, `GroupMember` | `groups` + `group_members` + `users` | Anggota urut `joined_at` menaik. `campus` dari `users`. |
| `BalanceEntry`, `GroupBalances` | `bill_shares` (status `belum_bayar`/`menunggu_konfirmasi`, `user_id <> bills.payer_id`) join `bills` (per `group_id`) | Satu baris = `user_id` utang `amount` ke `bills.payer_id`. Netto per pasangan di domain. |
| `SplitTotals` | Sama, untuk semua grup yang saya ikuti | `hasGroups` = ada baris `group_members` untuk saya. |
| `Bill`, `BillShare`, `MemberRef` | `bills` + `bill_shares` + `users` (payer, createdBy, pemilik bagian) | Bagian urut `joined_at` peserta di grup (join `group_members`); peserta yang sudah keluar ditaruh di akhir, urut `bill_shares.created_at`. `canDelete` dari `canDeleteBill`. |
| `ClassSchedule`, `ScheduleConflict` | `class_schedules` | `startTime`/`endTime` = menit → `HH:mm` (`480` → `08:00`). Input `HH:mm` → menit. `conflictsWith` dari `findConflicts`. |
| `StudyTask` | `study_tasks` + `class_schedules` | `courseName` = `schedule?.courseName ?? null`. `deadlineLabel` dihitung saat request. Status `selesai` → isi `completed_at = now()`; kembali `belum` → `completed_at = NULL`. |
| `HomeSummary` | Gabungan query di atas | Tidak ada tabel sendiri (arsitektur bagian 1). |

## 10. Cara menjalankan migrasi

Prasyarat: PostgreSQL lokal jalan (disiapkan Indah di `infra/`) dan `DATABASE_URL` terisi, contoh `postgresql://koskita:koskita@localhost:5432/koskita?schema=public`.

```bash
# terapkan migrasi yang sudah ada (dev/tes)
npx prisma@6.19.0 migrate deploy --schema apps/backend/prisma/schema.prisma

# saat skema berubah, buat migrasi baru
npx prisma@6.19.0 migrate dev --name <nama-perubahan> --schema apps/backend/prisma/schema.prisma

# cek dan rapikan skema
npx prisma@6.19.0 validate --schema apps/backend/prisma/schema.prisma
npx prisma@6.19.0 format --schema apps/backend/prisma/schema.prisma

# buat Prisma Client untuk backend
npx prisma@6.19.0 generate --schema apps/backend/prisma/schema.prisma
```

Setelah `apps/backend/package.json` ada dan memasang `prisma@6`, perintah di atas cukup ditulis `npx prisma ...` tanpa versi.

Penting saat membuat migrasi baru: `migrate dev` membandingkan skema dengan database, dan CHECK constraint tidak dikenal Prisma. Prisma **tidak** akan menghapusnya, tapi jangan pernah mengedit `20261124000000_init/migration.sql` yang sudah diterapkan. Perubahan CHECK ditulis di migrasi baru (`migrate dev --create-only`, lalu tambah SQL tangan).

## 11. Asumsi

1. Prisma dipin di versi 6.x karena skill proyek mewajibkan `url = env("DATABASE_URL")` di `schema.prisma`, dan itu sudah tidak didukung di Prisma 7 ke atas.
2. Refresh token disimpan sebagai SHA-256 (bukan bcrypt) karena token sudah acak panjang dan perlu dicari lewat index unik. Kata sandi tetap bcrypt (K5).
3. Jam kuliah disimpan sebagai menit, bukan `time`, supaya Prisma tidak memaksa tipe `Date` dan cek bentrok cukup membandingkan angka.
4. Tidak ada `createdBy` di `groups` karena kontrak tidak memakainya dan semua anggota setara di MVP.
5. Kategori diisi di migrasi awal. Kalau nanti label berubah, ubah lewat migrasi baru (`UPDATE wallet_categories ...`), bukan seed.
6. Pembersihan token kedaluwarsa belum dijadwalkan. Backend boleh menghapus token kedaluwarsa milik user saat login.
