# 01 · Produk: KosKita

> Pemilik dokumen: Rina (Product Manager) · Versi 1 · 24 November 2026

KosKita adalah super app kecil untuk **mahasiswa anak kos**. Satu aplikasi untuk tiga urusan yang setiap hari bikin pusing: **uang bulanan**, **patungan tagihan kos**, dan **deadline kuliah**.

---

## 1. Ringkasan riset tren

Riset singkat dilakukan 24 November 2026 lewat pencarian web. Temuan utamanya:

| # | Temuan | Sumber |
|---|---|---|
| T1 | Generasi muda yang besar bersama smartphone mendorong tren super app; super app di Indonesia diperkirakan tumbuh kuat sampai 2031. | [digitalinasia.com, 2026](https://digitalinasia.com/2026/04/09/how-super-apps-work-in-asia/), [Lucintel](https://lucintel.com/super-app-market-in-indonesia.aspx) |
| T2 | Super app besar mulai **memangkas layanan** agar tetap kompetitif; bank malah memecah layanan ke aplikasi yang lebih spesifik per segmen. | [The Jakarta Post, 2023](https://www.thejakartapost.com/business/2023/10/04/indonesian-superapps-trim-services-to-stay-competitive.html), [Babel Insight, 2026](https://www.babelinsight.id/persaingan-super-apps-perbankan-2026-intip-aplikasi-paling-aman-dan-banyak-dipakai-masyarakat) |
| T3 | Keluhan pengguna: fitur tambahan yang tidak relevan (contoh Shopee Video/Games) bikin halaman ramai dan aplikasi berat; iklan dan notifikasi promo mengganggu. | [Mojok](https://mojok.co/terminal/surat-terbuka-untuk-shopee-please-hilangkan-menu-shopee-video-dan-shopee-games-yang-unfaedah-buat-pembeli/), [Liputan6](https://www.liputan6.com/tekno/read/2109630/intrusive-ads-xl-dan-telkomsel-bikin-jengkel-pelanggan) |
| T4 | Pengguna paylater didominasi Gen Z, mayoritas untuk konsumsi. Studi UGM 2025 (128 mahasiswa): pengguna paylater cenderung literasi keuangannya lebih rendah. Pejabat OJK menyebut 60% Gen Z belanja melebihi pemasukan. | [Investor Trust](https://investortrust.id/financial/57511/pengguna-pay-later-didominasi-gen-z-ojk-soroti-pentingnya-mengelola-keuangan), [ETD UGM](https://etd.repository.ugm.ac.id/penelitian/detail/250257), [Katadata](https://katadata.co.id/amp/digital/fintech/6ad0662315820/gemar-pinjol-dan-paylater-anak-muda-terancam-terjebak-lingkaran-utang) |
| T5 | Niat menabung Gen Z tinggi (77%, Populix) tapi tidak stabil; hanya 23% Gen Z punya dana darurat 3 bulan (IMGR 2026). Muncul tren "loud budgeting". | [Bisnis.com, 2026](https://finansial.bisnis.com/read/20260107/55/1942486/stigma-boros-mulai-patah-anak-muda-kini-lebih-serius-soal-keuangan), [IDN Times](https://www.idntimes.com/business/finance/imgr-2026-soroti-pesatnya-teknologi-keuangan-dan-pentingnya-tujuan-00-3m8tp-y2p2x9), [GNFI, 2026](https://www.goodnewsfromindonesia.id/2026/03/02/dari-fomo-ke-loud-budgeting-bukti-gen-z-indonesia-makin-melek-finansial) |
| T6 | Anak kos patungan listrik/wifi pakai Splitwise atau fitur split bill e-wallet; masalahnya pembagian terasa tidak adil dan teman kos pakai e-wallet berbeda. | [kumparan](https://kumparan.com/kumparantech/5-aplikasi-split-bill-buat-patungan-bayar-yang-lebih-adil-20vU25jk1Ok), [Eraspace](https://eraspace.com/artikel/post/5-rekomendasi-aplikasi-split-bill-bisa-permudah-pembayaran-bersama) |
| T7 | Prevalensi stres mahasiswa Indonesia 36,7–71,6% di berbagai studi; manajemen waktu rendah berkaitan dengan stres; pola "dari deadline ke deadline". | [Repositori Unhas](https://repository.unhas.ac.id/52891/2/R011211087-1-2.pdf), [GNFI, 2026](https://www.goodnewsfromindonesia.id/2026/07/08/dari-deadline-ke-deadline-cerita-mahasiswa-yang-sering-menunda-tugas) |

Catatan kejujuran data: sebagian angka berasal dari studi satu kampus atau kutipan media, bukan survei nasional. Cukup untuk arah produk, bukan untuk klaim pemasaran.

## 2. Masalah dan konsep

**Masalah yang belum dilayani baik:** mahasiswa anak kos memakai 3–4 aplikasi terpisah (catatan keuangan, Splitwise, grup WhatsApp, kalender) untuk satu rutinitas yang sama: *"uang bulanan cukup nggak sampai akhir bulan, patungan wifi sudah lunas belum, tugas apa yang deadline minggu ini."* Super app besar justru menambah fitur belanja dan hiburan yang memancing konsumsi (T3, T4).

**Konsep:** KosKita, super app yang **sengaja kecil**: tiga modul yang saling nyambung di satu Beranda, tanpa iklan, tanpa paylater, tanpa transaksi uang sungguhan.

### Kenapa konsep ini dipilih

1. **Masalah nyata dan sering** (harian), didukung T4–T7.
2. **Celah pasar:** tren menuju aplikasi yang lebih fokus per segmen (T2) dan keluhan aplikasi bengkak (T3).
3. **Realistis untuk tim ini:** semua fitur cukup CRUD + hitungan di backend NestJS + PostgreSQL lokal. Tidak butuh payment gateway, peta berbayar, SMS OTP, atau layanan cloud.
4. **Efek jaringan kecil tapi kuat:** satu kamar kos mengajak teman sekos lewat kode grup.

### Konsep lain yang dipertimbangkan

| Konsep | Alasan tidak dipilih |
|---|---|
| Marketplace barang bekas kampus | Butuh moderasi, chat real-time, dan pembayaran; terlalu besar untuk MVP. |
| Cari kos + review | Butuh data awal kos yang banyak dan peta; tanpa data, aplikasi kosong. |
| Aplikasi kesehatan mental mahasiswa | Butuh tenaga profesional dan tanggung jawab klinis; berisiko. |

## 3. Persona

- **Nadia, 20, mahasiswi semester 3, ngekos di Jogja.** Dapat kiriman Rp1,5 juta/bulan, sering habis sebelum tanggal 25. Berbagi wifi dan galon dengan 4 teman sekos. Mau tahu "hari ini masih boleh jajan berapa".
- **Raka, 21, ketua kamar/penghuni lama.** Yang selalu nalangin bayar wifi Rp350 ribu lalu nagih satu-satu di grup WhatsApp. Mau daftar siapa sudah bayar tanpa nagih berulang.

## 4. Prinsip produk

1. **Fokus, bukan palugada.** Fitur baru masuk hanya kalau melayani salah satu dari tiga modul.
2. **Tanpa iklan, tanpa paylater, tanpa promo.** Notifikasi hanya untuk hal yang diminta pengguna.
3. **Tidak memindahkan uang.** KosKita mencatat; transfer tetap lewat bank/e-wallet masing-masing (menghindari T6 soal beda e-wallet dan menghindari regulasi pembayaran).
4. **Rupiah utuh.** Semua nominal disimpan sebagai bilangan bulat rupiah (tanpa desimal).
5. **Cepat dipakai:** catat pengeluaran maksimal 3 ketukan dari Beranda.

## 5. Modul

| Kode | Modul | Isi singkat |
|---|---|---|
| AKN | Akun | Daftar, masuk, profil singkat. |
| BRD | Beranda | Ringkasan hari ini dari ketiga modul. |
| DPT | Dompet | Catat pemasukan/pengeluaran, kategori, anggaran bulanan, jatah harian. |
| PTG | Patungan | Grup kos, tagihan bersama, status lunas, saldo siapa ke siapa. |
| KLH | Kuliah | Jadwal kuliah mingguan dan daftar tugas dengan deadline. |

## 6. Prioritas (MoSCoW)

**Must = MVP.** Should = kalau waktu tersisa setelah MVP lolos QA. Could/Won't = bukan tahap ini.

| ID | Fitur | Modul | Prioritas |
|---|---|---|---|
| AKN-01 | Daftar akun dengan email + kata sandi | AKN | Must |
| AKN-02 | Masuk dan keluar | AKN | Must |
| AKN-03 | Lihat dan ubah profil (nama, kampus) | AKN | Must |
| BRD-01 | Beranda ringkasan hari ini | BRD | Must |
| DPT-01 | Catat transaksi (pemasukan/pengeluaran) | DPT | Must |
| DPT-02 | Daftar transaksi per bulan + ubah/hapus | DPT | Must |
| DPT-03 | Anggaran bulanan dan jatah harian | DPT | Must |
| DPT-04 | Ringkasan pengeluaran per kategori | DPT | Must |
| PTG-01 | Buat grup kos dan gabung lewat kode | PTG | Must |
| PTG-02 | Buat tagihan bersama (bagi rata atau nominal manual) | PTG | Must |
| PTG-03 | Tandai bagian sudah dibayar / konfirmasi | PTG | Must |
| PTG-04 | Saldo grup: siapa berutang ke siapa | PTG | Must |
| KLH-01 | Jadwal kuliah mingguan | KLH | Must |
| KLH-02 | Daftar tugas dengan deadline dan status | KLH | Must |
| DPT-05 | Tagihan rutin bulanan (kos, wifi) otomatis dibuat | DPT/PTG | Should |
| KLH-03 | Pengingat lokal di perangkat sebelum deadline | KLH | Should |
| PTG-05 | Riwayat tagihan grup per bulan | PTG | Should |
| DPT-06 | Target tabungan sederhana | DPT | Could |
| — | Ekspor CSV transaksi | DPT | Could |
| — | Transfer uang di dalam aplikasi, paylater, iklan | — | Won't |
| — | Chat grup, marketplace, cari kos | — | Won't |
| — | Login Google/OTP SMS (butuh layanan pihak ketiga) | — | Won't |

## 7. User story dan kriteria terima (MVP)

Format kriteria: *Diberikan / Ketika / Maka*. Semua nominal rupiah bilangan bulat positif kecuali disebut lain.

### AKN-01 · Daftar akun

**Sebagai** mahasiswa baru pengguna, **saya ingin** membuat akun dengan email dan kata sandi **agar** data saya tersimpan dan bisa dipakai di grup kos.

- Diberikan email belum terdaftar, nama 2–50 karakter, dan kata sandi minimal 8 karakter, ketika saya menekan Daftar, maka akun dibuat dan saya langsung masuk ke Beranda.
- Diberikan email sudah terdaftar, ketika saya mendaftar, maka muncul pesan "Email sudah dipakai" dan tidak ada akun baru.
- Diberikan format email salah atau kata sandi kurang dari 8 karakter, ketika saya menekan Daftar, maka muncul pesan di kolom yang salah dan permintaan tidak dikirim.
- Kata sandi tidak pernah disimpan atau dikembalikan dalam bentuk asli.

### AKN-02 · Masuk dan keluar

**Sebagai** pengguna, **saya ingin** masuk dan keluar **agar** akun saya aman di HP bersama.

- Diberikan email dan kata sandi benar, ketika saya masuk, maka saya diarahkan ke Beranda dan tetap masuk saat aplikasi dibuka ulang.
- Diberikan kata sandi salah, ketika saya masuk, maka muncul pesan umum "Email atau kata sandi salah" (tidak menyebut mana yang salah).
- Ketika saya menekan Keluar, maka sesi di perangkat dihapus dan saya kembali ke layar Masuk.
- Diberikan sesi kedaluwarsa, ketika aplikasi memanggil API, maka saya diarahkan ke layar Masuk dengan pesan "Sesi berakhir, silakan masuk lagi".

### AKN-03 · Profil

**Sebagai** pengguna, **saya ingin** mengatur nama dan kampus **agar** teman sekos mengenali saya di grup.

- Ketika saya membuka Profil, maka tampil nama, email, dan kampus (opsional).
- Diberikan nama baru 2–50 karakter, ketika saya simpan, maka nama baru tampil di Profil dan di daftar anggota grup.
- Email tidak bisa diubah di MVP.

### BRD-01 · Beranda ringkasan hari ini

**Sebagai** anak kos, **saya ingin** sekali lihat tahu kondisi hari ini **agar** tidak perlu buka tiga menu.

- Ketika saya membuka Beranda, maka tampil: (a) jatah harian hari ini dan sisa anggaran bulan ini (DPT-03), (b) total yang saya utang dan yang orang utang ke saya di semua grup (PTG-04), (c) kelas hari ini (KLH-01), (d) maksimal 3 tugas belum selesai dengan deadline terdekat (KLH-02).
- Diberikan modul belum punya data, maka bagian itu menampilkan ajakan singkat (contoh "Atur anggaran bulan ini") dengan tombol ke layar terkait, bukan angka nol yang membingungkan.
- Beranda punya tombol cepat "+ Pengeluaran" yang membuka form DPT-01 dengan tipe pengeluaran terpilih.
- Tidak ada banner promo atau iklan.

### DPT-01 · Catat transaksi

**Sebagai** anak kos, **saya ingin** mencatat pemasukan dan pengeluaran dengan cepat **agar** tahu uang lari ke mana.

- Form berisi: tipe (pemasukan/pengeluaran), nominal, kategori, tanggal (default hari ini), catatan opsional maksimal 100 karakter.
- Kategori bawaan pengeluaran: Makan, Transport, Kos & Tagihan, Kuliah, Jajan & Hiburan, Lainnya. Pemasukan: Kiriman, Kerja Sampingan, Beasiswa, Lainnya.
- Diberikan nominal 1–100.000.000, ketika saya simpan, maka transaksi muncul paling atas di daftar bulan itu dan Beranda ikut diperbarui.
- Diberikan nominal kosong, nol, negatif, atau berdesimal, maka tombol simpan ditolak dengan pesan "Nominal harus angka rupiah lebih dari 0".
- Tanggal di masa depan lebih dari hari ini ditolak.

### DPT-02 · Daftar transaksi

**Sebagai** pengguna, **saya ingin** melihat, mengubah, dan menghapus transaksi **agar** catatan saya benar.

- Ketika saya membuka Dompet, maka tampil transaksi bulan berjalan, terbaru di atas, dikelompokkan per tanggal, dengan total pemasukan dan pengeluaran bulan itu.
- Saya bisa pindah ke bulan sebelumnya/berikutnya (tidak lewat bulan ini).
- Ketika saya mengubah transaksi, aturan validasi sama dengan DPT-01.
- Ketika saya menghapus, muncul konfirmasi; setelah dihapus, total bulan diperbarui.
- Saya hanya bisa melihat dan mengubah transaksi milik saya sendiri.

### DPT-03 · Anggaran bulanan dan jatah harian

**Sebagai** anak kos dengan kiriman bulanan, **saya ingin** menetapkan anggaran bulan ini dan tahu jatah per hari **agar** uang cukup sampai akhir bulan.

- Saya menetapkan satu angka anggaran pengeluaran per bulan (1–100.000.000).
- **Rumus jatah harian** (dihitung backend, zona waktu Asia/Jakarta):
  `jatah_harian = floor((anggaran − total_pengeluaran_bulan_ini_sebelum_hari_ini) / sisa_hari_termasuk_hari_ini)`
  `sisa_hari_ini = jatah_harian − pengeluaran_hari_ini`
- Contoh: anggaran Rp1.500.000, tanggal 21 November (sisa 10 hari termasuk hari ini), sudah keluar Rp1.000.000 sebelum hari ini, maka jatah harian = Rp50.000. Kalau hari ini sudah jajan Rp20.000, sisa hari ini Rp30.000.
- Diberikan pengeluaran sudah melebihi anggaran, maka jatah harian ditampilkan Rp0 dan muncul label "Anggaran terlampaui Rp…" (bukan angka negatif).
- Diberikan belum ada anggaran bulan ini, maka Beranda dan Dompet menampilkan ajakan mengatur anggaran.
- Anggaran bisa diubah kapan saja di bulan berjalan; hitungan langsung menyesuaikan.

### DPT-04 · Ringkasan per kategori

**Sebagai** pengguna, **saya ingin** melihat pengeluaran per kategori **agar** tahu pos paling boros.

- Ketika saya membuka Ringkasan bulan tertentu, maka tampil daftar kategori pengeluaran, nominal, dan persentase dari total, diurutkan dari terbesar.
- Persentase dibulatkan ke bilangan bulat; kategori dengan nominal 0 tidak ditampilkan.
- Diberikan bulan tanpa pengeluaran, maka tampil "Belum ada pengeluaran bulan ini".

### PTG-01 · Grup kos

**Sebagai** penghuni kos, **saya ingin** membuat grup dan mengajak teman sekos **agar** tagihan bersama tercatat di satu tempat.

- Ketika saya membuat grup dengan nama 3–40 karakter, maka grup dibuat, saya jadi anggota pertama, dan sistem membuat **kode undangan 6 karakter** (huruf besar dan angka, tanpa O/0/I/1) yang unik.
- Diberikan kode yang benar, ketika teman memasukkannya, maka ia jadi anggota dan grup muncul di daftar grupnya.
- Diberikan kode salah, maka muncul "Kode grup tidak ditemukan". Memasukkan kode grup yang sudah diikuti tidak membuat anggota ganda.
- Satu grup maksimal 20 anggota.
- Anggota bisa keluar dari grup hanya jika saldonya di grup itu Rp0; kalau tidak, muncul pesan "Selesaikan dulu patunganmu".
- Hanya anggota yang bisa melihat isi grup.

### PTG-02 · Tagihan bersama

**Sebagai** orang yang nalangin bayar wifi, **saya ingin** mencatat tagihan dan membaginya **agar** semua tahu bagiannya masing-masing.

- Form: judul (3–60 karakter, contoh "Wifi November"), total nominal, siapa yang membayar dulu (default saya), anggota yang ikut (default semua), cara bagi: **rata** atau **manual**.
- **Bagi rata:** `bagian = floor(total / jumlah_peserta)`; sisa pembagian (total mod jumlah_peserta) ditambahkan masing-masing Rp1 ke peserta pertama berdasarkan urutan bergabung, sehingga jumlah bagian selalu sama persis dengan total. Contoh: Rp100.000 dibagi 3 menjadi Rp33.334, Rp33.333, Rp33.333.
- **Manual:** tiap peserta diisi nominal ≥ 0; tagihan ditolak jika jumlah bagian ≠ total, dengan pesan menyebut selisihnya.
- Bagian milik orang yang membayar dulu otomatis berstatus lunas.
- Peserta minimal 2 orang.
- Pembuat tagihan bisa menghapus tagihan selama belum ada bagian (selain miliknya) yang ditandai lunas.

### PTG-03 · Tandai lunas

**Sebagai** anggota, **saya ingin** menandai bagian saya sudah ditransfer **agar** tidak ditagih lagi; **sebagai** penalang, **saya ingin** mengonfirmasi **agar** catatan tidak bisa diakali.

- Status bagian: `belum_bayar` → `menunggu_konfirmasi` (ditandai peserta) → `lunas` (dikonfirmasi pembayar). Pembayar juga bisa langsung menandai `lunas` (misal dibayar tunai).
- Pembayar bisa menolak konfirmasi, status kembali ke `belum_bayar`.
- Hanya peserta yang bersangkutan yang bisa menandai bagiannya; hanya pembayar tagihan yang bisa mengonfirmasi atau menolak.
- Detail tagihan menampilkan daftar peserta, nominal, dan status masing-masing dengan warna/label yang jelas.
- Tagihan berstatus "Selesai" otomatis saat semua bagian lunas.

### PTG-04 · Saldo grup

**Sebagai** anggota, **saya ingin** tahu total saya berutang ke siapa dan siapa berutang ke saya **agar** tidak perlu hitung manual.

- Saldo dihitung dari bagian yang belum `lunas` (status `belum_bayar` dan `menunggu_konfirmasi`).
- Layar grup menampilkan per pasangan: "Kamu utang ke Raka Rp70.000" atau "Nadia utang ke kamu Rp33.333". Utang dua arah antara dua orang yang sama di grup yang sama saling dikurangi dulu (netto).
- Beranda menampilkan total utang saya dan total piutang saya dari semua grup.
- Diberikan semua lunas, maka tampil "Semua patungan beres".

### KLH-01 · Jadwal kuliah mingguan

**Sebagai** mahasiswa, **saya ingin** menyimpan jadwal kuliah **agar** tahu kelas hari ini tanpa buka portal kampus.

- Form: nama mata kuliah (2–60 karakter), hari (Senin–Minggu), jam mulai, jam selesai, ruang (opsional, maks 30 karakter).
- Jam selesai harus setelah jam mulai; kalau tidak, ditolak.
- Jadwal yang bentrok jamnya di hari yang sama boleh disimpan tapi diberi peringatan "Bentrok dengan …".
- Tampilan per hari dalam seminggu, urut jam mulai; hari ini terpilih otomatis.
- Bisa ubah dan hapus.

### KLH-02 · Tugas dan deadline

**Sebagai** mahasiswa yang sering kejar deadline, **saya ingin** mencatat tugas beserta tenggatnya **agar** tidak ada yang terlewat.

- Form: judul (3–80 karakter), mata kuliah (pilih dari jadwal KLH-01 atau kosong), deadline (tanggal + jam), catatan opsional maks 300 karakter.
- Status: `belum` atau `selesai`; satu ketukan untuk mencentang.
- Daftar default menampilkan tugas `belum`, urut deadline terdekat. Tugas lewat deadline diberi label merah "Terlambat". Tugas dengan deadline ≤ 24 jam diberi label "Hari ini/Besok".
- Ada tab "Selesai" untuk melihat tugas yang sudah dicentang.
- Bisa ubah dan hapus.
- Deadline di masa lalu boleh disimpan (untuk mencatat tugas yang telat) dan langsung berlabel "Terlambat".

## 8. Aturan bisnis lintas modul

- Zona waktu acuan: **Asia/Jakarta (WIB)** untuk batas hari dan bulan. (Asumsi MVP: pengguna di WIB.)
- Semua data milik pengguna hanya bisa diakses pemiliknya; data grup hanya oleh anggota grup.
- Nominal disimpan sebagai integer rupiah; tampilan memakai format `Rp1.500.000`.
- Bahasa antarmuka: Bahasa Indonesia santai.
- Semua daftar yang bisa panjang (transaksi, tugas, tagihan) mendukung paginasi di API.

## 9. Metrik sukses MVP (diuji di lingkungan lokal)

- Alur inti bisa diselesaikan dari HP/emulator tanpa error: daftar → atur anggaran → catat pengeluaran → buat grup → tagihan → tandai lunas → tambah jadwal dan tugas → Beranda menampilkan semuanya.
- Catat pengeluaran dari Beranda ≤ 3 ketukan sampai tersimpan.
- Hitungan jatah harian, bagi rata, dan saldo grup lolos uji otomatis dengan contoh di dokumen ini.

## 10. Rencana urutan pengerjaan (untuk tim)

| Urutan | Fokus | Fitur | Selesai jika |
|---|---|---|---|
| 1 | Fondasi | AKN-01, AKN-02, AKN-03 | Bisa daftar, masuk, keluar, ubah profil lewat aplikasi. |
| 2 | Dompet | DPT-01 s.d. DPT-04 | Contoh angka DPT-03 dan DPT-04 terbukti lewat tes backend. |
| 3 | Patungan | PTG-01 s.d. PTG-04 | Contoh bagi rata Rp100.000/3 dan aturan konfirmasi lolos tes. |
| 4 | Kuliah | KLH-01, KLH-02 | Validasi jam dan label deadline lolos tes. |
| 5 | Beranda | BRD-01 | Beranda menampilkan data keempat modul dan keadaan kosong. |
| 6 | Should | DPT-05, KLH-03, PTG-05 | Hanya jika 1–5 lolos QA dan review. |

Catatan untuk peran lain:
- **Bagus (Arsitek):** rumus DPT-03, PTG-02, dan PTG-04 sebaiknya dihitung di backend dan dikirim lewat kontrak, supaya mobile tidak menghitung ulang.
- **Citra (Desain):** Beranda jadi pusat; navigasi bawah 4 tab disarankan: Beranda, Dompet, Patungan, Kuliah (Profil dari pojok Beranda).
- **Fitri (Database):** semua kolom nominal integer; status bagian tagihan sebagai enum (`belum_bayar`, `menunggu_konfirmasi`, `lunas`).
- **Hendra (Keamanan):** perhatikan akses grup (hanya anggota) dan otorisasi konfirmasi pembayaran (hanya pembayar).

## 11. Asumsi

1. Pengguna utama mahasiswa di zona WIB.
2. Autentikasi cukup email + kata sandi dengan token, tanpa verifikasi email (tidak ada layanan email gratis yang lokal).
3. Tidak ada mode offline penuh di MVP; aplikasi butuh koneksi ke backend lokal.
4. Nama "KosKita" adalah nama kerja dan bisa diganti tanpa mengubah fitur.
