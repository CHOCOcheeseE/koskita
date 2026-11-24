import { decodeCursor, encodeCursor, parseCursorDate } from './cursor';

describe('parseCursorDate', () => {
  it('ISO tahun 4 digit diterima', () => {
    expect(parseCursorDate('2026-11-24T03:00:00.000Z').toISOString()).toBe('2026-11-24T03:00:00.000Z');
    expect(parseCursorDate('2026-11-24T10:00:00+07:00').toISOString()).toBe('2026-11-24T03:00:00.000Z');
  });

  it.each([
    ['tahun 6 digit negatif (BUG-04)', '-010000-01-01T00:00:00.000Z'],
    ['tahun 6 digit positif', '+275760-09-13T00:00:00.000Z'],
    ['tanpa zona', '2026-11-24T03:00:00'],
    ['tanggal mustahil', '2026-02-30T00:00:00Z'],
    ['bukan tanggal', 'abc'],
    ['tidak ada', undefined],
  ])('%s -> 400 VALIDATION_FAILED details.cursor', (_, value) => {
    expect(() => parseCursorDate(value)).toThrow(
      expect.objectContaining({ status: 400, code: 'VALIDATION_FAILED', details: { cursor: expect.any(String) } }),
    );
  });
});

const raw = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
const id = '3f2b8a4e-1c9d-4e7a-9b6f-0a1b2c3d4e5f';

describe('decodeCursor', () => {
  it('kosong = halaman pertama; bolak-balik dengan encodeCursor', () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor(encodeCursor({ v: '2026-11-24', i: id }))).toEqual({ v: '2026-11-24', i: id });
  });

  it.each([
    ['bukan base64 JSON', '!!!'],
    ['i bukan UUID', raw({ v: 'x', i: 'bukan-uuid' })],
    ['i angka', raw({ v: 'x', i: 1 })],
    ['v tidak ada', raw({ i: id })],
  ])('%s -> 400 VALIDATION_FAILED details.cursor', (_, cursor) => {
    expect(() => decodeCursor(cursor)).toThrow(
      expect.objectContaining({ status: 400, code: 'VALIDATION_FAILED', details: { cursor: expect.any(String) } }),
    );
  });
});
