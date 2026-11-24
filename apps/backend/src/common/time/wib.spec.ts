import {
  daysLeftInMonthWib,
  isCalendarDate,
  monthDateRange,
  monthWib,
  previousDate,
  todayWib,
  wibDayOfWeek,
  wibDayRangeUtc,
} from './wib';

describe('wib', () => {
  it('1 Desember 00:30 WIB (UTC masih 30 November) dihitung 1 Desember', () => {
    const now = new Date('2026-11-30T17:30:00Z');
    expect(todayWib(now)).toBe('2026-12-01');
    expect(monthWib(now)).toBe('2026-12');
  });

  it('30 November 23:30 WIB masih 30 November', () => {
    const now = new Date('2026-11-30T16:30:00Z');
    expect(todayWib(now)).toBe('2026-11-30');
    expect(monthWib(now)).toBe('2026-11');
  });

  it('sisa hari: 21 November = 10, 30 November = 1', () => {
    expect(daysLeftInMonthWib(new Date('2026-11-21T05:00:00Z'))).toBe(10);
    expect(daysLeftInMonthWib(new Date('2026-11-30T05:00:00Z'))).toBe(1);
  });

  it('hari ISO WIB: Selasa 24 November 2026 = 2, Minggu = 7', () => {
    expect(wibDayOfWeek(new Date('2026-11-24T05:00:00Z'))).toBe(2);
    expect(wibDayOfWeek(new Date('2026-11-29T05:00:00Z'))).toBe(7);
  });

  it('rentang UTC satu hari WIB', () => {
    const r = wibDayRangeUtc('2026-11-24');
    expect(r.start.toISOString()).toBe('2026-11-23T17:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-11-24T17:00:00.000Z');
  });

  it('rentang bulan dan tanggal sebelumnya', () => {
    expect(monthDateRange('2028-02')).toEqual({ first: '2028-02-01', last: '2028-02-29' });
    expect(previousDate('2026-12-01')).toBe('2026-11-30');
  });

  it('validasi tanggal kalender', () => {
    expect(isCalendarDate('2026-11-24')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('24-11-2026')).toBe(false);
  });
});
