/**
 * Helper kalender Asia/Jakarta (WIB, UTC+7 tanpa DST).
 * Semua fungsi murni: waktu "sekarang" selalu dikirim pemanggil.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

function shifted(instant: Date): Date {
  return new Date(instant.getTime() + WIB_OFFSET_MS);
}

/** Tanggal WIB `YYYY-MM-DD` dari sebuah instan. */
export function todayWib(now: Date): string {
  const d = shifted(now);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Bulan WIB `YYYY-MM` dari sebuah instan. */
export function monthWib(now: Date): string {
  return todayWib(now).slice(0, 7);
}

/** Hari ISO WIB, 1 = Senin sampai 7 = Minggu. */
export function isoDayOfWeekWib(now: Date): number {
  const day = shifted(now).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Jam WIB `HH:mm` dari timestamp ISO UTC. */
export function timeWibOf(isoDateTime: string): string {
  const d = shifted(new Date(isoDateTime));
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Tanggal WIB `YYYY-MM-DD` dari timestamp ISO UTC. */
export function dateWibOf(isoDateTime: string): string {
  return todayWib(new Date(isoDateTime));
}

/** Gabungan tanggal + jam WIB menjadi timestamp ISO UTC berakhiran `Z`. */
export function wibToUtcIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - WIB_OFFSET_MS;
  return new Date(utcMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Tambah n hari ke tanggal `YYYY-MM-DD`. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Geser bulan `YYYY-MM` sebanyak delta bulan. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`;
}

/** Hari ISO (1 = Senin) dari tanggal `YYYY-MM-DD`. */
export function isoDayOfWeekOfDate(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function isValidMonth(value: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(value);
}
