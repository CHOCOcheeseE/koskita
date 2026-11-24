/**
 * Tipe dari contracts/openapi.yaml (openapi-typescript).
 * Jangan diedit tangan: jalankan `npm --prefix apps/mobile run gen:api` setelah kontrak berubah.
 */

export interface paths {
    "/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Cek backend dan koneksi database */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Daftar akun baru lalu langsung masuk (AKN-01) */
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Masuk dengan email dan kata sandi (AKN-02) */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tukar refresh token dengan pasangan token baru (rotasi)
         * @description Refresh token lama langsung tidak berlaku setelah dipakai.
         */
        post: operations["refreshTokens"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Keluar dan cabut refresh token di perangkat ini (AKN-02) */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lihat profil sendiri (AKN-03) */
        get: operations["getMyProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Ubah nama dan/atau kampus (AKN-03). Email tidak bisa diubah. */
        patch: operations["updateMyProfile"];
        trace?: never;
    };
    "/v1/home/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ringkasan Beranda hari ini (BRD-01) */
        get: operations["getHomeToday"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/wallet/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar kategori bawaan beserta label tampilan (DPT-01) */
        get: operations["listWalletCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/wallet/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daftar transaksi satu bulan, terbaru di atas (DPT-02)
         * @description Urutan `date` menurun, lalu `createdAt` menurun. Total bulan diambil dari `getMonthSummary`.
         */
        get: operations["listTransactions"];
        put?: never;
        /** Catat pemasukan atau pengeluaran (DPT-01) */
        post: operations["createTransaction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/wallet/transactions/{transactionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                transactionId: string;
            };
            cookie?: never;
        };
        /** Detail satu transaksi milik sendiri */
        get: operations["getTransaction"];
        put?: never;
        post?: never;
        /** Hapus transaksi (DPT-02) */
        delete: operations["deleteTransaction"];
        options?: never;
        head?: never;
        /** Ubah transaksi (DPT-02). Validasi sama dengan createTransaction. */
        patch: operations["updateTransaction"];
        trace?: never;
    };
    "/v1/wallet/months/{month}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthPath"];
            };
            cookie?: never;
        };
        /** Total bulan dan ringkasan pengeluaran per kategori (DPT-02, DPT-04) */
        get: operations["getMonthSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/wallet/budgets/{month}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthPath"];
            };
            cookie?: never;
        };
        /**
         * Anggaran bulan, sisa, dan jatah harian (DPT-03)
         * @description Jatah harian (`today`) hanya diisi untuk bulan berjalan; bulan lain bernilai `null`.
         */
        get: operations["getBudgetStatus"];
        /** Tetapkan atau ubah anggaran bulan berjalan (DPT-03) */
        put: operations["setBudget"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daftar grup yang saya ikuti
         * @description Tanpa paginasi karena jumlah grup per pengguna kecil. Urut `joinedAt` menurun.
         */
        get: operations["listMyGroups"];
        put?: never;
        /** Buat grup kos; pembuat jadi anggota pertama (PTG-01) */
        post: operations["createGroup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Gabung grup lewat kode undangan (PTG-01)
         * @description Idempoten. Jika sudah anggota, balas 200 dengan grup yang sama tanpa membuat anggota ganda.
         */
        post: operations["joinGroup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups/{groupId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        /** Detail grup dan anggota. Hanya anggota. */
        get: operations["getGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups/{groupId}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Keluar grup, hanya jika saya tidak punya utang/piutang di grup ini (PTG-01)
         * @description Boleh keluar hanya jika tidak ada BalanceEntry (lihat `getGroupBalances`) dengan `from` atau `to` = saya.
         *     Netto gabungan 0 tidak cukup: A utang ke B Rp10.000 dan C utang ke A Rp10.000 berarti A belum boleh keluar.
         */
        post: operations["leaveGroup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups/{groupId}/balances": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        /** Saldo netto per pasangan anggota (PTG-04) */
        get: operations["getGroupBalances"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/groups/{groupId}/bills": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        /** Daftar tagihan grup, terbaru di atas */
        get: operations["listGroupBills"];
        put?: never;
        /** Buat tagihan bersama, bagi rata atau manual (PTG-02) */
        post: operations["createBill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{billId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
            };
            cookie?: never;
        };
        /** Detail tagihan dan status tiap bagian (PTG-03) */
        get: operations["getBill"];
        put?: never;
        post?: never;
        /**
         * Hapus tagihan. Hanya pembuat, dan hanya jika belum ada bagian non-pembayar yang lunas (PTG-02)
         * @description Yang dicek hanya bagian milik peserta selain pembayar (`payer`). Bagian pembayar selalu `lunas` sejak dibuat
         *     dan tidak dihitung, baik pembayar itu pembuat atau bukan. Jadi tagihan yang `payerId`-nya orang lain tetap
         *     bisa dihapus pembuatnya selama bagian peserta lain belum ada yang `lunas`. Status `menunggu_konfirmasi`
         *     tidak menghalangi penghapusan.
         */
        delete: operations["deleteBill"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{billId}/shares/{shareId}/mark-paid": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Peserta menandai bagiannya sudah ditransfer (PTG-03)
         * @description Hanya pemilik bagian. Transisi `belum_bayar` ke `menunggu_konfirmasi`. Pembayar yang ingin langsung melunasi memakai `confirmShare`.
         */
        post: operations["markSharePaid"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{billId}/shares/{shareId}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pembayar mengonfirmasi bagian lunas (PTG-03)
         * @description Hanya pembayar tagihan. Transisi `menunggu_konfirmasi` atau `belum_bayar` (misal dibayar tunai) ke `lunas`. Tagihan jadi `settled` saat semua bagian lunas.
         */
        post: operations["confirmShare"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{billId}/shares/{shareId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pembayar menolak konfirmasi; status kembali ke belum_bayar (PTG-03)
         * @description Hanya pembayar tagihan. Transisi `menunggu_konfirmasi` ke `belum_bayar`.
         */
        post: operations["rejectShare"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/study/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Jadwal kuliah mingguan, urut hari lalu jam mulai (KLH-01)
         * @description Tanpa paginasi karena jadwal mingguan jumlahnya kecil.
         */
        get: operations["listSchedules"];
        put?: never;
        /**
         * Tambah jadwal kuliah (KLH-01)
         * @description Jadwal bentrok tetap disimpan; daftar bentrok ada di `conflictsWith`.
         */
        post: operations["createSchedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/study/schedules/{scheduleId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                scheduleId: string;
            };
            cookie?: never;
        };
        /** Detail satu jadwal */
        get: operations["getSchedule"];
        put?: never;
        post?: never;
        /** Hapus jadwal. Tugas yang menautnya jadi tanpa mata kuliah (`scheduleId` null). */
        delete: operations["deleteSchedule"];
        options?: never;
        head?: never;
        /** Ubah jadwal (KLH-01) */
        patch: operations["updateSchedule"];
        trace?: never;
    };
    "/v1/study/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daftar tugas (KLH-02)
         * @description `status=belum` (bawaan) urut `deadline` menaik. `status=selesai` urut `completedAt` menurun.
         */
        get: operations["listTasks"];
        put?: never;
        /** Tambah tugas. Deadline lampau boleh (KLH-02). */
        post: operations["createTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/study/tasks/{taskId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                taskId: string;
            };
            cookie?: never;
        };
        /** Detail satu tugas */
        get: operations["getTask"];
        put?: never;
        post?: never;
        /** Hapus tugas */
        delete: operations["deleteTask"];
        options?: never;
        head?: never;
        /** Ubah tugas, termasuk centang selesai lewat `status` (KLH-02) */
        patch: operations["updateTask"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorResponse: {
            error: {
                /**
                 * @description Kode error UPPER_SNAKE_CASE, stabil untuk logika mobile.
                 * @example VALIDATION_FAILED
                 */
                code: string;
                /**
                 * @description Pesan berbahasa Indonesia untuk pengguna.
                 * @example Nominal harus angka rupiah lebih dari 0
                 */
                message: string;
                /** @description Opsional, hanya pada VALIDATION_FAILED. Kunci = nama field, nilai = pesan. */
                details?: {
                    [key: string]: string;
                };
            };
        };
        /** Format: uuid */
        Uuid: string;
        /** @description Nominal rupiah utuh. */
        Rupiah: number;
        /** @description Nominal rupiah 1 sampai 100.000.000. Hanya untuk satu nilai yang diinput pengguna, bukan hasil jumlah. */
        PositiveRupiah: number;
        /** @description Hasil jumlah beberapa nominal rupiah (agregat), tanpa batas atas. */
        RupiahTotal: number;
        /** @example 2026-11 */
        Month: string;
        /**
         * @description Jam WIB format HH:mm.
         * @example 08:00
         */
        Time: string;
        /** @description Hari ISO, 1 = Senin sampai 7 = Minggu. */
        DayOfWeek: number;
        RegisterRequest: {
            /**
             * Format: email
             * @description Disimpan dalam huruf kecil.
             */
            email: string;
            password: string;
            /** @description Spasi di awal/akhir dibuang sebelum dicek panjangnya. */
            name: string;
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            password: string;
        };
        RefreshRequest: {
            refreshToken: string;
        };
        AuthTokens: {
            /** @description JWT, berlaku 15 menit. */
            accessToken: string;
            /** @description Token buram, berlaku 30 hari, sekali pakai. */
            refreshToken: string;
            /** Format: date-time */
            accessTokenExpiresAt: string;
        };
        AuthSession: {
            user: components["schemas"]["User"];
            tokens: components["schemas"]["AuthTokens"];
        };
        /** @description Kata sandi tidak pernah dikirim. */
        User: {
            id: components["schemas"]["Uuid"];
            /** Format: email */
            email: string;
            name: string;
            campus: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        UpdateProfileRequest: {
            name?: string;
            /** @description `null` atau string kosong menghapus kampus. */
            campus?: string | null;
        };
        HomeSummary: {
            /**
             * Format: date
             * @description Hari ini (WIB).
             */
            date: string;
            /** @description `null` jika belum ada anggaran bulan ini (tampilkan ajakan "Atur anggaran bulan ini"). */
            budget: components["schemas"]["BudgetStatus"] | null;
            split: components["schemas"]["SplitTotals"];
            /** @description Kelas hari ini (WIB), urut jam mulai. Kosong = tampilkan ajakan. */
            classesToday: components["schemas"]["ClassSchedule"][];
            /** @description Maksimal 3 tugas `belum`, urut deadline terdekat (yang terlambat ikut, paling atas). */
            upcomingTasks: components["schemas"]["StudyTask"][];
        };
        SplitTotals: {
            /** @description `false` = belum ikut grup; tampilkan ajakan buat/gabung grup. */
            hasGroups: boolean;
            /** @description Jumlah `GroupBalances.totalIOwe` saya di semua grup yang saya ikuti. Tidak dinettokan dengan totalOwedToMe. */
            totalIOwe: components["schemas"]["Rupiah"];
            /** @description Jumlah `GroupBalances.totalOwedToMe` saya di semua grup yang saya ikuti. Tidak dinettokan dengan totalIOwe. */
            totalOwedToMe: components["schemas"]["Rupiah"];
        };
        /** @enum {string} */
        TransactionType: "income" | "expense";
        /**
         * @description Kode kategori. Pengeluaran: food (Makan), transport (Transport), housing_bills (Kos & Tagihan),
         *     study (Kuliah), leisure (Jajan & Hiburan), other_expense (Lainnya).
         *     Pemasukan: allowance (Kiriman), side_job (Kerja Sampingan), scholarship (Beasiswa), other_income (Lainnya).
         * @enum {string}
         */
        Category: "food" | "transport" | "housing_bills" | "study" | "leisure" | "other_expense" | "allowance" | "side_job" | "scholarship" | "other_income";
        CategoryInfo: {
            code: components["schemas"]["Category"];
            type: components["schemas"]["TransactionType"];
            /** @example Makan */
            label: string;
        };
        Transaction: {
            id: components["schemas"]["Uuid"];
            type: components["schemas"]["TransactionType"];
            amount: components["schemas"]["PositiveRupiah"];
            category: components["schemas"]["Category"];
            /**
             * Format: date
             * @description Tanggal transaksi (WIB).
             */
            date: string;
            note: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        TransactionInput: {
            type: components["schemas"]["TransactionType"];
            amount: components["schemas"]["PositiveRupiah"];
            category: components["schemas"]["Category"];
            /**
             * Format: date
             * @description Tidak boleh setelah hari ini (WIB).
             */
            date: string;
            note?: string | null;
        };
        /** @description Field yang dikirim saja yang diubah. Hasil akhirnya divalidasi seperti TransactionInput. */
        TransactionPatch: {
            type?: components["schemas"]["TransactionType"];
            amount?: components["schemas"]["PositiveRupiah"];
            category?: components["schemas"]["Category"];
            /** Format: date */
            date?: string;
            note?: string | null;
        };
        TransactionPage: {
            items: components["schemas"]["Transaction"][];
            nextCursor: string | null;
        };
        CategoryTotal: {
            category: components["schemas"]["Category"];
            label: string;
            amount: components["schemas"]["RupiahTotal"];
            /** @description Persen dari total pengeluaran, dibulatkan ke bilangan bulat terdekat (Math.round). */
            percent: number;
        };
        MonthSummary: {
            month: components["schemas"]["Month"];
            totalIncome: components["schemas"]["Rupiah"];
            totalExpense: components["schemas"]["Rupiah"];
            /** @description Hanya kategori pengeluaran dengan nominal > 0, urut nominal terbesar. Kosong = "Belum ada pengeluaran bulan ini". */
            expenseByCategory: components["schemas"]["CategoryTotal"][];
        };
        BudgetInput: {
            amount: components["schemas"]["PositiveRupiah"];
        };
        BudgetStatus: {
            month: components["schemas"]["Month"];
            amount: components["schemas"]["PositiveRupiah"];
            totalExpense: components["schemas"]["Rupiah"];
            /** @description max(0, amount - totalExpense). */
            remainingBudget: components["schemas"]["Rupiah"];
            /** @description max(0, totalExpense - amount). > 0 berarti tampilkan "Anggaran terlampaui Rp…". */
            overBudgetAmount: components["schemas"]["Rupiah"];
            /** @description Hanya untuk bulan berjalan; selain itu `null`. */
            today: components["schemas"]["DailyAllowance"] | null;
        };
        /**
         * @description Dihitung backend dengan zona Asia/Jakarta:
         *     dailyAllowance = max(0, floor((amount - spentBeforeToday) / daysLeftIncludingToday))
         *     remainingToday = max(0, dailyAllowance - spentToday)
         *     overTodayAmount = max(0, spentToday - dailyAllowance)
         *     Contoh: anggaran 1.500.000, 21 November (sisa 10 hari), spentBeforeToday 1.000.000
         *     maka dailyAllowance 50.000; spentToday 20.000 maka remainingToday 30.000.
         */
        DailyAllowance: {
            /** Format: date */
            date: string;
            daysLeftIncludingToday: number;
            spentBeforeToday: components["schemas"]["Rupiah"];
            spentToday: components["schemas"]["Rupiah"];
            dailyAllowance: components["schemas"]["Rupiah"];
            remainingToday: components["schemas"]["Rupiah"];
            overTodayAmount: components["schemas"]["Rupiah"];
        };
        MemberRef: {
            userId: components["schemas"]["Uuid"];
            name: string;
        };
        GroupMember: {
            userId: components["schemas"]["Uuid"];
            name: string;
            campus: string | null;
            /** Format: date-time */
            joinedAt: string;
        };
        /**
         * @description 6 karakter huruf besar dan angka tanpa O, 0, I, 1. Input dari mobile boleh huruf kecil; backend menyamakan ke huruf besar.
         * @example K7QX2M
         */
        InviteCode: string;
        GroupSummary: {
            id: components["schemas"]["Uuid"];
            name: string;
            memberCount: number;
            /**
             * @description totalOwedToMe - totalIOwe saya di grup ini (lihat GroupBalances), satuan rupiah. Positif = netto orang lain
             *     utang ke saya; negatif = netto saya utang. Hanya untuk tampilan: nilai 0 TIDAK berarti boleh keluar,
             *     pakai `isSettledForMe`.
             */
            myNetBalance: number;
            /** @description `true` jika tidak ada BalanceEntry dengan `from` atau `to` = saya di grup ini (sama dengan `GroupBalances.canLeave`). */
            isSettledForMe: boolean;
        };
        GroupDetail: {
            id: components["schemas"]["Uuid"];
            name: string;
            inviteCode: components["schemas"]["InviteCode"];
            /** @description Urut `joinedAt` menaik (urutan ini dipakai pembagian sisa bagi rata). */
            members: components["schemas"]["GroupMember"][];
            /** Format: date-time */
            createdAt: string;
        };
        CreateGroupRequest: {
            name: string;
        };
        JoinGroupRequest: {
            inviteCode: string;
        };
        /** @description `from` berutang `amount` ke `to` (sudah netto antar pasangan). */
        BalanceEntry: {
            from: components["schemas"]["MemberRef"];
            to: components["schemas"]["MemberRef"];
            amount: components["schemas"]["RupiahTotal"];
        };
        /**
         * @description Dihitung dari bagian berstatus `belum_bayar` dan `menunggu_konfirmasi`. Bagian peserta X di tagihan
         *     yang dibayar Y = X utang ke Y. Netto hanya antar pasangan yang sama di grup yang sama (A ke B dikurangi
         *     B ke A); tidak ada netto lintas pasangan atau lintas grup.
         *     Contoh: A utang ke B Rp10.000 dan C utang ke A Rp10.000 menghasilkan dua entri;
         *     untuk A: totalIOwe 10.000, totalOwedToMe 10.000, canLeave false.
         */
        GroupBalances: {
            groupId: components["schemas"]["Uuid"];
            /** @description Semua pasangan dengan saldo netto > 0 di grup (termasuk yang tidak melibatkan saya). */
            entries: components["schemas"]["BalanceEntry"][];
            /** @description Jumlah `amount` entri dengan `from` = saya. */
            totalIOwe: components["schemas"]["Rupiah"];
            /** @description Jumlah `amount` entri dengan `to` = saya. */
            totalOwedToMe: components["schemas"]["Rupiah"];
            /** @description `true` jika tidak ada entri dengan `from` atau `to` = saya. Aturan yang sama dipakai `leaveGroup`. */
            canLeave: boolean;
            /** @description `true` jika `entries` kosong (seluruh grup beres); tampilkan "Semua patungan beres". */
            allSettled: boolean;
        };
        /** @enum {string} */
        SplitMethod: "equal" | "manual";
        /** @enum {string} */
        ShareStatus: "belum_bayar" | "menunggu_konfirmasi" | "lunas";
        /**
         * @description `settled` (tampil "Selesai") otomatis saat semua bagian `lunas`.
         * @enum {string}
         */
        BillStatus: "open" | "settled";
        ShareInput: {
            userId: components["schemas"]["Uuid"];
            amount: components["schemas"]["Rupiah"];
        };
        /**
         * @description - `payerId` bawaan = pengguna yang membuat.
         *     - Bagi rata: `participantIds` bawaan = semua anggota. bagian = floor(total / n); sisa (total mod n)
         *       ditambah Rp1 masing-masing ke peserta paling awal bergabung ke grup. Contoh 100.000 / 3 = 33.334, 33.333, 33.333.
         *     - Manual: `shares` wajib, peserta = daftar userId di `shares`, jumlah amount harus sama dengan `totalAmount`.
         *       `participantIds` diabaikan.
         */
        CreateBillRequest: {
            title: string;
            totalAmount: components["schemas"]["PositiveRupiah"];
            payerId?: components["schemas"]["Uuid"];
            splitMethod: components["schemas"]["SplitMethod"];
            participantIds?: components["schemas"]["Uuid"][];
            shares?: components["schemas"]["ShareInput"][];
        };
        BillShare: {
            id: components["schemas"]["Uuid"];
            user: components["schemas"]["MemberRef"];
            amount: components["schemas"]["Rupiah"];
            status: components["schemas"]["ShareStatus"];
            /** Format: date-time */
            updatedAt: string;
        };
        Bill: {
            id: components["schemas"]["Uuid"];
            groupId: components["schemas"]["Uuid"];
            title: string;
            totalAmount: components["schemas"]["PositiveRupiah"];
            splitMethod: components["schemas"]["SplitMethod"];
            payer: components["schemas"]["MemberRef"];
            createdBy: components["schemas"]["MemberRef"];
            status: components["schemas"]["BillStatus"];
            /** @description Urut `joinedAt` peserta di grup, menaik. */
            shares: components["schemas"]["BillShare"][];
            /** @description `true` jika pengguna saat ini pembuat (`createdBy`) dan tidak ada bagian milik peserta selain `payer` yang berstatus `lunas`. Bagian milik pembayar tidak dihitung. */
            canDelete: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        BillPage: {
            items: components["schemas"]["Bill"][];
            nextCursor: string | null;
        };
        ScheduleConflict: {
            id: components["schemas"]["Uuid"];
            courseName: string;
            startTime: components["schemas"]["Time"];
            endTime: components["schemas"]["Time"];
        };
        ClassSchedule: {
            id: components["schemas"]["Uuid"];
            courseName: string;
            dayOfWeek: components["schemas"]["DayOfWeek"];
            startTime: components["schemas"]["Time"];
            endTime: components["schemas"]["Time"];
            room: string | null;
            /** @description Jadwal lain di hari sama yang jamnya beririsan (start < other.end dan other.start < end). Tidak kosong = tampilkan "Bentrok dengan …". */
            conflictsWith: components["schemas"]["ScheduleConflict"][];
        };
        ScheduleInput: {
            courseName: string;
            dayOfWeek: components["schemas"]["DayOfWeek"];
            startTime: components["schemas"]["Time"];
            endTime: components["schemas"]["Time"];
            room?: string | null;
        };
        /** @description Field yang dikirim saja yang diubah. Hasil akhirnya divalidasi seperti ScheduleInput. */
        SchedulePatch: {
            courseName?: string;
            dayOfWeek?: components["schemas"]["DayOfWeek"];
            startTime?: components["schemas"]["Time"];
            endTime?: components["schemas"]["Time"];
            room?: string | null;
        };
        /** @enum {string} */
        TaskStatus: "belum" | "selesai";
        /**
         * @description Dihitung backend saat request, hanya untuk tugas `belum`:
         *     - overdue: deadline < sekarang (tampil merah "Terlambat").
         *     - due_soon: sekarang <= deadline <= sekarang + 24 jam (tampil "Hari ini" atau "Besok" sesuai tanggal WIB deadline).
         * @enum {string}
         */
        DeadlineLabel: "overdue" | "due_soon";
        StudyTask: {
            id: components["schemas"]["Uuid"];
            title: string;
            /** Format: uuid */
            scheduleId: string | null;
            /** @description Nama mata kuliah dari jadwal tertaut, `null` jika tidak tertaut. */
            courseName: string | null;
            /** Format: date-time */
            deadline: string;
            note: string | null;
            status: components["schemas"]["TaskStatus"];
            /** Format: date-time */
            completedAt: string | null;
            deadlineLabel: components["schemas"]["DeadlineLabel"] | null;
            /** Format: date-time */
            createdAt: string;
        };
        TaskInput: {
            title: string;
            /** Format: uuid */
            scheduleId?: string | null;
            /**
             * Format: date-time
             * @description Boleh di masa lalu.
             */
            deadline: string;
            note?: string | null;
        };
        TaskPatch: {
            title?: string;
            /** Format: uuid */
            scheduleId?: string | null;
            /** Format: date-time */
            deadline?: string;
            note?: string | null;
            status?: components["schemas"]["TaskStatus"];
        };
        TaskPage: {
            items: components["schemas"]["StudyTask"][];
            nextCursor: string | null;
        };
    };
    responses: {
        /** @description Request tidak valid (`VALIDATION_FAILED`). `details` berisi pesan per field. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Token tidak ada atau tidak valid (`UNAUTHENTICATED`), atau access token kedaluwarsa (`TOKEN_EXPIRED`, mobile memanggil `refreshTokens` lalu mengulang request sekali). */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Data tidak ada atau bukan milik pengguna (`NOT_FOUND`). Data pribadi milik orang lain (transaksi, anggaran, jadwal, tugas) selalu 404, bukan 403, supaya keberadaannya tidak bocor. Pengecualian: grup dan tagihan yang ada tapi saya bukan anggotanya dibalas 403 `NOT_GROUP_MEMBER`. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Bukan anggota grup (`NOT_GROUP_MEMBER`) */
        NotGroupMember: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Bukan pembayar tagihan (`NOT_BILL_PAYER`) atau bukan anggota grup (`NOT_GROUP_MEMBER`) */
        NotBillPayer: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Status bagian saat ini tidak mengizinkan aksi ini (`INVALID_SHARE_TRANSITION`) */
        InvalidShareTransition: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Jam selesai tidak setelah jam mulai (`TIME_RANGE_INVALID`) */
        TimeRangeInvalid: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description `scheduleId` tidak ada di jadwal milik pengguna (`SCHEDULE_NOT_FOUND`) */
        ScheduleNotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Terlalu banyak percobaan (`TOO_MANY_REQUESTS`). Coba lagi sebentar. */
        TooManyRequests: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description Kursor buram dari `nextCursor` halaman sebelumnya. Kosong = halaman pertama. */
        Cursor: string;
        Limit: number;
        /** @description Bulan WIB, format YYYY-MM. */
        MonthQuery: components["schemas"]["Month"];
        /** @description Bulan WIB, format YYYY-MM. */
        MonthPath: components["schemas"]["Month"];
        GroupId: string;
        BillId: string;
        ShareId: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Backend hidup */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {string} */
                        status: "ok";
                    };
                };
            };
        };
    };
    register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterRequest"];
            };
        };
        responses: {
            /** @description Akun dibuat */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSession"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Email sudah dipakai (`EMAIL_TAKEN`) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Berhasil masuk */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSession"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Email atau kata sandi salah (`INVALID_CREDENTIALS`). Pesan tidak menyebut mana yang salah. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    refreshTokens: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description Token baru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthTokens"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Refresh token tidak valid, sudah dipakai, atau kedaluwarsa (`SESSION_EXPIRED`). Mobile mengarahkan ke layar Masuk dengan pesan "Sesi berakhir, silakan masuk lagi". */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description Sesi dicabut. Selalu 204 walau refresh token sudah tidak berlaku. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    getMyProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Profil */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    updateMyProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileRequest"];
            };
        };
        responses: {
            /** @description Profil terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    getHomeToday: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ringkasan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomeSummary"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    listWalletCategories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Kategori */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CategoryInfo"][];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    listTransactions: {
        parameters: {
            query: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthQuery"];
                /** @description Kursor buram dari `nextCursor` halaman sebelumnya. Kosong = halaman pertama. */
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Satu halaman transaksi */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Bulan setelah bulan berjalan (`MONTH_IN_FUTURE`) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createTransaction: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionInput"];
            };
        };
        responses: {
            /** @description Transaksi tersimpan */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Transaction"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Tanggal setelah hari ini (`DATE_IN_FUTURE`) atau kategori tidak cocok dengan tipe (`CATEGORY_TYPE_MISMATCH`) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getTransaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                transactionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transaksi */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Transaction"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteTransaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                transactionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Terhapus */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateTransaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                transactionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionPatch"];
            };
        };
        responses: {
            /** @description Transaksi terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Transaction"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            /** @description `DATE_IN_FUTURE` atau `CATEGORY_TYPE_MISMATCH` */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getMonthSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ringkasan bulan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MonthSummary"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description `MONTH_IN_FUTURE` */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getBudgetStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Status anggaran */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetStatus"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Belum ada anggaran untuk bulan itu (`BUDGET_NOT_FOUND`). Mobile menampilkan ajakan "Atur anggaran bulan ini". */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    setBudget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Bulan WIB, format YYYY-MM. */
                month: components["parameters"]["MonthPath"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetInput"];
            };
        };
        responses: {
            /** @description Status anggaran setelah disimpan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetStatus"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Hanya bulan berjalan yang bisa diatur (`MONTH_NOT_EDITABLE`) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listMyGroups: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Grup */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["GroupSummary"][];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    createGroup: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateGroupRequest"];
            };
        };
        responses: {
            /** @description Grup dibuat beserta kode undangan */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    joinGroup: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["JoinGroupRequest"];
            };
        };
        responses: {
            /** @description Sekarang anggota grup */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Kode grup tidak ditemukan (`GROUP_NOT_FOUND`) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Grup sudah 20 anggota (`GROUP_FULL`) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getGroup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Grup */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupDetail"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
        };
    };
    leaveGroup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sudah keluar */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
            /** @description Masih ada BalanceEntry dengan `from` atau `to` = saya (`BALANCE_NOT_SETTLED`, pesan "Selesaikan dulu patunganmu") */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getGroupBalances: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Saldo grup */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupBalances"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
        };
    };
    listGroupBills: {
        parameters: {
            query?: {
                /** @description Saring status tagihan. Tanpa parameter = semua. */
                status?: components["schemas"]["BillStatus"];
                /** @description Kursor buram dari `nextCursor` halaman sebelumnya. Kosong = halaman pertama. */
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Satu halaman tagihan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BillPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
        };
    };
    createBill: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: components["parameters"]["GroupId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBillRequest"];
            };
        };
        responses: {
            /** @description Tagihan dibuat. Bagian milik pembayar otomatis `lunas`. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Bill"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
            /**
             * @description Aturan bisnis dilanggar:
             *     - `MIN_PARTICIPANTS`: peserta kurang dari 2.
             *     - `PARTICIPANT_NOT_MEMBER`: pembayar atau peserta bukan anggota grup.
             *     - `SHARES_SUM_MISMATCH`: jumlah bagian manual tidak sama dengan total; pesan menyebut selisihnya.
             *     - `SHARES_NOT_ALLOWED` / `SHARES_REQUIRED`: `shares` diisi pada bagi rata, atau kosong pada bagi manual.
             */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getBill: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tagihan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Bill"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotGroupMember"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteBill: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Terhapus */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            /** @description Bukan anggota grup (`NOT_GROUP_MEMBER`) atau bukan pembuat tagihan (`NOT_BILL_CREATOR`) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            404: components["responses"]["NotFound"];
            /** @description Sudah ada bagian milik peserta selain pembayar yang `lunas` (`BILL_HAS_PAYMENTS`) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    markSharePaid: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tagihan terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Bill"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description Bukan pemilik bagian (`NOT_SHARE_OWNER`) atau bukan anggota grup (`NOT_GROUP_MEMBER`) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            404: components["responses"]["NotFound"];
            409: components["responses"]["InvalidShareTransition"];
        };
    };
    confirmShare: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tagihan terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Bill"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotBillPayer"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["InvalidShareTransition"];
        };
    };
    rejectShare: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["parameters"]["BillId"];
                shareId: components["parameters"]["ShareId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tagihan terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Bill"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["NotBillPayer"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["InvalidShareTransition"];
        };
    };
    listSchedules: {
        parameters: {
            query?: {
                /** @description Saring satu hari. Tanpa parameter = seminggu penuh. */
                dayOfWeek?: components["schemas"]["DayOfWeek"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Jadwal */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["ClassSchedule"][];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScheduleInput"];
            };
        };
        responses: {
            /** @description Jadwal tersimpan */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassSchedule"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            422: components["responses"]["TimeRangeInvalid"];
        };
    };
    getSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                scheduleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Jadwal */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassSchedule"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                scheduleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Terhapus */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                scheduleId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SchedulePatch"];
            };
        };
        responses: {
            /** @description Jadwal terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassSchedule"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["TimeRangeInvalid"];
        };
    };
    listTasks: {
        parameters: {
            query?: {
                status?: components["schemas"]["TaskStatus"];
                /** @description Kursor buram dari `nextCursor` halaman sebelumnya. Kosong = halaman pertama. */
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Satu halaman tugas */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createTask: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskInput"];
            };
        };
        responses: {
            /** @description Tugas tersimpan */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            422: components["responses"]["ScheduleNotFound"];
        };
    };
    getTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                taskId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tugas */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyTask"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                taskId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Terhapus */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                taskId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskPatch"];
            };
        };
        responses: {
            /** @description Tugas terbaru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["ScheduleNotFound"];
        };
    };
}
