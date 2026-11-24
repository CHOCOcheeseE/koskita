import { validationFailed } from '../domain/app-error';
import { isIsoDateTime } from '../time/wib';

/** Kursor buram = base64url dari JSON `{ v: nilai kolom urut, i: id }`. */
export interface CursorValue {
  v: string;
  i: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeCursor(value: CursorValue): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Kursor rusak, `v` bukan teks, atau `i` bukan UUID -> 400 VALIDATION_FAILED (details.cursor). */
export function decodeCursor(cursor: string | undefined): CursorValue | null {
  if (cursor === undefined || cursor === '') return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CursorValue).v === 'string' &&
      typeof (parsed as CursorValue).i === 'string' &&
      UUID_RE.test((parsed as CursorValue).i)
    ) {
      const { v, i } = parsed as CursorValue;
      return { v, i: i.toLowerCase() };
    }
  } catch {
    // jatuh ke error di bawah
  }
  throw invalidCursor();
}

export const invalidCursor = () => validationFailed({ cursor: 'Kursor halaman tidak valid' });

/**
 * Tanggal+jam di kursor. Wajib ISO dengan tahun 4 digit (DATE_TIME_RE), jadi tahun seperti
 * `-010000` yang sah di JavaScript tapi di luar rentang PostgreSQL ditolak 400, bukan 500.
 */
export function parseCursorDate(value: string | undefined): Date {
  if (value === undefined || !isIsoDateTime(value)) throw invalidCursor();
  return new Date(value);
}

/** Ambil `limit + 1` baris, lalu potong dan buat kursor berikutnya dari baris terakhir. */
export function toPage<T>(rows: T[], limit: number, cursorOf: (row: T) => CursorValue): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null };
}
