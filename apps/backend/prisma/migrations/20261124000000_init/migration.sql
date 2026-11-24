-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "CategoryCode" AS ENUM ('food', 'transport', 'housing_bills', 'study', 'leisure', 'other_expense', 'allowance', 'side_job', 'scholarship', 'other_income');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('equal', 'manual');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('open', 'settled');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('belum_bayar', 'menunggu_konfirmasi', 'lunas');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('belum', 'selesai');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "campus" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_categories" (
    "id" UUID NOT NULL,
    "code" "CategoryCode" NOT NULL,
    "type" "TransactionType" NOT NULL,
    "label" VARCHAR(30) NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wallet_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "CategoryCode" NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "note" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "month" CHAR(7) NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "invite_code" CHAR(6) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "title" VARCHAR(60) NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "split_method" "SplitMethod" NOT NULL,
    "payer_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_shares" (
    "id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'belum_bayar',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bill_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_name" VARCHAR(60) NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_minute" SMALLINT NOT NULL,
    "end_minute" SMALLINT NOT NULL,
    "room" VARCHAR(30),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "schedule_id" UUID,
    "title" VARCHAR(80) NOT NULL,
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "note" VARCHAR(300),
    "status" "TaskStatus" NOT NULL DEFAULT 'belum',
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_categories_code_key" ON "wallet_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_categories_type_sort_order_key" ON "wallet_categories"("type", "sort_order");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_created_at_id_idx" ON "transactions"("user_id", "date" DESC, "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_month_key" ON "budgets"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");

-- CreateIndex
CREATE INDEX "group_members_group_id_joined_at_idx" ON "group_members"("group_id", "joined_at");

-- CreateIndex
CREATE INDEX "group_members_user_id_joined_at_idx" ON "group_members"("user_id", "joined_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "bills_group_id_created_at_id_idx" ON "bills"("group_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "bills_group_id_status_created_at_id_idx" ON "bills"("group_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "bills_payer_id_idx" ON "bills"("payer_id");

-- CreateIndex
CREATE INDEX "bills_created_by_id_idx" ON "bills"("created_by_id");

-- CreateIndex
CREATE INDEX "bill_shares_bill_id_status_idx" ON "bill_shares"("bill_id", "status");

-- CreateIndex
CREATE INDEX "bill_shares_user_id_status_idx" ON "bill_shares"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bill_shares_bill_id_user_id_key" ON "bill_shares"("bill_id", "user_id");

-- CreateIndex
CREATE INDEX "class_schedules_user_id_day_of_week_start_minute_idx" ON "class_schedules"("user_id", "day_of_week", "start_minute");

-- CreateIndex
CREATE INDEX "study_tasks_user_id_status_deadline_id_idx" ON "study_tasks"("user_id", "status", "deadline", "id");

-- CreateIndex
CREATE INDEX "study_tasks_user_id_status_completed_at_id_idx" ON "study_tasks"("user_id", "status", "completed_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "study_tasks_schedule_id_idx" ON "study_tasks"("schedule_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_fkey" FOREIGN KEY ("category") REFERENCES "wallet_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_shares" ADD CONSTRAINT "bill_shares_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_shares" ADD CONSTRAINT "bill_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "class_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CHECK constraint (ditulis tangan; Prisma belum bisa menuliskannya di schema.prisma).
-- Lapis terakhir: validasi utama tetap di backend (class-validator + domain).
-- Lihat docs/04-database.md bagian "Aturan di level database".
-- ---------------------------------------------------------------------------

-- users: email selalu huruf kecil supaya unik tanpa beda kapital.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_chk" CHECK ("email" = lower("email"));

-- refresh_tokens: hash SHA-256 dalam hex huruf kecil.
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_chk" CHECK ("token_hash" ~ '^[0-9a-f]{64}$');

-- transactions & budgets: PositiveRupiah 1..100.000.000.
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_chk" CHECK ("amount" BETWEEN 1 AND 100000000);
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_amount_chk" CHECK ("amount" BETWEEN 1 AND 100000000);

-- budgets: bulan format YYYY-MM.
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_month_chk" CHECK ("month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- groups: kode undangan 6 karakter tanpa O, 0, I, 1.
ALTER TABLE "groups" ADD CONSTRAINT "groups_invite_code_chk" CHECK ("invite_code" ~ '^[A-HJ-NP-Z2-9]{6}$');

-- bills: totalAmount PositiveRupiah.
ALTER TABLE "bills" ADD CONSTRAINT "bills_total_amount_chk" CHECK ("total_amount" BETWEEN 1 AND 100000000);

-- bill_shares: bagian boleh 0 (bagi rata Rp1 ke 3 orang), tidak boleh negatif.
ALTER TABLE "bill_shares" ADD CONSTRAINT "bill_shares_amount_chk" CHECK ("amount" BETWEEN 0 AND 100000000);

-- class_schedules: hari ISO 1..7, jam dalam menit 0..1439, selesai setelah mulai.
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_day_of_week_chk" CHECK ("day_of_week" BETWEEN 1 AND 7);
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_minutes_chk" CHECK ("start_minute" BETWEEN 0 AND 1439 AND "end_minute" BETWEEN 0 AND 1439);
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_time_range_chk" CHECK ("end_minute" > "start_minute");

-- study_tasks: completed_at terisi jika dan hanya jika status selesai.
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_completed_at_chk" CHECK (("status" = 'selesai') = ("completed_at" IS NOT NULL));

-- ---------------------------------------------------------------------------
-- Data acuan kategori dompet (sama dengan skema `Category` di kontrak).
-- Diisi di migrasi, bukan seed, supaya FK transactions.category selalu punya pasangan.
-- gen_random_uuid() bawaan PostgreSQL 13+.
-- ---------------------------------------------------------------------------
INSERT INTO "wallet_categories" ("id", "code", "type", "label", "sort_order", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'food',          'expense', 'Makan',           1, now(), now()),
  (gen_random_uuid(), 'transport',     'expense', 'Transport',       2, now(), now()),
  (gen_random_uuid(), 'housing_bills', 'expense', 'Kos & Tagihan',   3, now(), now()),
  (gen_random_uuid(), 'study',         'expense', 'Kuliah',          4, now(), now()),
  (gen_random_uuid(), 'leisure',       'expense', 'Jajan & Hiburan', 5, now(), now()),
  (gen_random_uuid(), 'other_expense', 'expense', 'Lainnya',         6, now(), now()),
  (gen_random_uuid(), 'allowance',     'income',  'Kiriman',         1, now(), now()),
  (gen_random_uuid(), 'side_job',      'income',  'Kerja Sampingan', 2, now(), now()),
  (gen_random_uuid(), 'scholarship',   'income',  'Beasiswa',        3, now(), now()),
  (gen_random_uuid(), 'other_income',  'income',  'Lainnya',         4, now(), now());
