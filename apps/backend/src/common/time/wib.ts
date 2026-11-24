/**
 * Helper kalender WIB (Asia/Jakarta, UTC+07:00, tanpa DST).
 * Semua batas hari dan bulan di aplikasi dihitung lewat file ini.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function shifted(now: Date): Date {
  return new Date(now.getTime() + WIB_OFFSET_MS);
}

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
export function todayWib(now: Date): string {
  return shifted(now).toISOString().slice(0, 10);
}

/** Bulan berjalan di WIB, format YYYY-MM. */
export function monthWib(now: Date): string {
  return shifted(now).toISOString().slice(0, 7);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Sisa hari bulan ini termasuk hari ini (WIB). Tanggal terakhir = 1. */
export function daysLeftInMonthWib(now: Date): number {
  const today = todayWib(now);
  const day = Number(today.slice(8, 10));
  return daysInMonth(today.slice(0, 7)) - day + 1;
}

/** Hari ISO di WIB: 1 = Senin sampai 7 = Minggu. */
export function wibDayOfWeek(now: Date): number {
  const d = shifted(now).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Rentang UTC [start, end) untuk satu tanggal kalender WIB. */
export function wibDayRangeUtc(date: string): { start: Date; end: Date } {
  const start = new Date(dateToUtcMidnight(date).getTime() - WIB_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Tanggal pertama dan terakhir sebuah bulan, format YYYY-MM-DD. */
export function monthDateRange(month: string): { first: string; last: string } {
  const last = String(daysInMonth(month)).padStart(2, '0');
  return { first: `${month}-01`, last: `${month}-${last}` };
}

/** Tanggal sebelum `date` (YYYY-MM-DD). */
export function previousDate(date: string): string {
  return new Date(dateToUtcMidnight(date).getTime() - DAY_MS).toISOString().slice(0, 10);
}

/** YYYY-MM-DD ke Date tengah malam UTC (untuk kolom `date` di PostgreSQL). */
export function dateToUtcMidnight(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** Date dari kolom `date` ke YYYY-MM-DD. */
export function utcMidnightToDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isCalendarDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isMonth(value: string): boolean {
  return MONTH_RE.test(value);
}
