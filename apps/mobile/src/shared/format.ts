/** Format tampilan (docs/03-desain.md bagian 9.3). Semua tanggal/jam dalam WIB. */

const MINUS = '−';

function groupThousands(n: number): string {
  return String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** `Rp1.500.000`; tanda opsional `+Rp…` / `−Rp…`. */
export function formatRupiah(amount: number, sign?: '+' | '-'): string {
  const prefix = sign === '+' ? '+' : sign === '-' ? MINUS : amount < 0 ? MINUS : '';
  return `${prefix}Rp${groupThousands(amount)}`;
}

/** Angka dengan titik ribuan tanpa "Rp", untuk isi input nominal. */
export function formatThousands(amount: number): string {
  return groupThousands(amount);
}

/** Label pembaca layar: 30000 → "30 ribu rupiah", 1500000 → "1 juta 500 ribu rupiah". */
export function rupiahSpeech(amount: number): string {
  let n = Math.abs(Math.trunc(amount));
  if (n === 0) return 'nol rupiah';
  const parts: string[] = [];
  const units: [number, string][] = [
    [1_000_000_000, 'miliar'],
    [1_000_000, 'juta'],
    [1_000, 'ribu'],
  ];
  for (const [size, word] of units) {
    if (n >= size) {
      parts.push(`${Math.floor(n / size)} ${word}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(String(n));
  return `${amount < 0 ? 'minus ' : ''}${parts.join(' ')} rupiah`;
}

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, isoDay: jsDay === 0 ? 7 : jsDay };
}

/** "Selasa, 24 November" */
export function formatLongDate(date: string): string {
  const { m, d, isoDay } = parts(date);
  return `${DAY_NAMES[isoDay - 1]}, ${d} ${MONTH_NAMES[m - 1]}`;
}

/** "24 Nov" */
export function formatShortDate(date: string): string {
  const { m, d } = parts(date);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

/** "Sen, 23 Nov" */
export function formatDayShortDate(date: string): string {
  const { m, d, isoDay } = parts(date);
  return `${DAY_SHORT[isoDay - 1]}, ${d} ${MONTH_SHORT[m - 1]}`;
}

/** "November 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Nama bulan saja: "November" */
export function formatMonthName(month: string): string {
  const m = Number(month.split('-')[1]);
  return MONTH_NAMES[m - 1];
}

/** Ambil angka saja dari teks input nominal. */
export function parseDigits(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (digits === '') return null;
  return Number(digits.slice(0, 12));
}
