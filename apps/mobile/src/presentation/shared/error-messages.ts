import { isAppError, NETWORK_ERROR_CODE } from '@/domain/shared/errors';
import { formatRupiah } from '@/shared/format';

/** Pesan per kode error (docs/03-desain.md bagian 9.2). Dipilih dari `error.code`, bukan `error.message`. */
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: 'Sesi berakhir, silakan masuk lagi',
  SESSION_EXPIRED: 'Sesi berakhir, silakan masuk lagi',
  TOKEN_EXPIRED: 'Sesi berakhir, silakan masuk lagi',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah',
  EMAIL_TAKEN: 'Email sudah dipakai',
  TOO_MANY_REQUESTS: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  NOT_FOUND: 'Data ini sudah tidak ada.',
  DATE_IN_FUTURE: 'Tanggal tidak boleh setelah hari ini',
  CATEGORY_TYPE_MISMATCH: 'Kategori tidak cocok dengan jenis transaksi',
  MONTH_IN_FUTURE: 'Bulan depan belum bisa dibuka',
  MONTH_NOT_EDITABLE: 'Anggaran hanya bisa diatur untuk bulan ini',
  GROUP_NOT_FOUND: 'Kode grup tidak ditemukan',
  GROUP_FULL: 'Grup ini sudah penuh (20 orang)',
  NOT_GROUP_MEMBER: 'Kamu bukan anggota grup ini lagi',
  BALANCE_NOT_SETTLED: 'Selesaikan dulu patunganmu',
  MIN_PARTICIPANTS: 'Minimal 2 orang ikut patungan',
  PARTICIPANT_NOT_MEMBER: 'Ada peserta yang sudah keluar grup. Muat ulang daftar anggota.',
  SHARES_REQUIRED: 'Isi nominal tiap peserta',
  SHARES_NOT_ALLOWED: 'Mode rata tidak memakai nominal manual',
  NOT_BILL_CREATOR: 'Hanya pembuat tagihan yang bisa menghapusnya',
  BILL_HAS_PAYMENTS: 'Tagihan tidak bisa dihapus karena sudah ada yang lunas',
  INVALID_SHARE_TRANSITION: 'Status bagian ini sudah berubah. Data dimuat ulang.',
  TIME_RANGE_INVALID: 'Jam selesai harus setelah jam mulai',
  SCHEDULE_NOT_FOUND: 'Jadwal yang dipilih sudah dihapus. Pilih lagi.',
  [NETWORK_ERROR_CODE]: 'Tidak bisa tersambung ke server KosKita. Cek koneksi atau pastikan server lokal menyala.',
};

export type MessageContext = {
  /** Nama orang untuk `NOT_SHARE_OWNER` / `NOT_BILL_PAYER`. */
  actorName?: string;
  /** Selisih untuk `SHARES_SUM_MISMATCH`. */
  gap?: number;
};

export function errorMessage(error: unknown, context: MessageContext = {}): string {
  if (!isAppError(error)) return 'Terjadi kesalahan. Coba lagi.';
  switch (error.code) {
    case 'NOT_SHARE_OWNER':
    case 'NOT_BILL_PAYER':
      return `Hanya ${context.actorName ?? 'orang yang berhak'} yang bisa melakukan ini.`;
    case 'SHARES_SUM_MISMATCH':
      return context.gap !== undefined
        ? `Jumlah bagian belum sama dengan total, selisih ${formatRupiah(Math.abs(context.gap))}`
        : 'Jumlah bagian belum sama dengan total.';
    case 'VALIDATION_FAILED': {
      const first = error.details ? Object.values(error.details)[0] : undefined;
      return first ?? (error.message || 'Isian belum benar.');
    }
    default:
      return MESSAGES[error.code] ?? (error.message || 'Terjadi kesalahan. Coba lagi.');
  }
}

/** Pesan per field dari `details` pada 400 `VALIDATION_FAILED`. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (isAppError(error) && error.code === 'VALIDATION_FAILED' && error.details) return error.details;
  return {};
}
