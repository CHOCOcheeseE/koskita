import { validationFailed } from '../domain/app-error';

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

export function decodeCursor(cursor: string | undefined): CursorValue | null {
  if (cursor === undefined || cursor === '') return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CursorValue).v === 'string' &&
      typeof (parsed as CursorValue).i === 'string'
    ) {
      return parsed as CursorValue;
    }
  } catch {
    // jatuh ke error di bawah
  }
  throw validationFailed({ cursor: 'Kursor halaman tidak valid' });
}

/** Ambil `limit + 1` baris, lalu potong dan buat kursor berikutnya dari baris terakhir. */
export function toPage<T>(rows: T[], limit: number, cursorOf: (row: T) => CursorValue): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null };
}
