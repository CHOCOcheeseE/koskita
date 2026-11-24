import { assertTimeRange, deadlineLabel, findConflicts, minutesToTime, timeToMinutes } from './rules';

const slot = (id: string, start: string, end: string, dayOfWeek = 1) => ({
  id,
  courseName: id,
  dayOfWeek,
  startMinute: timeToMinutes(start),
  endMinute: timeToMinutes(end),
});

describe('jadwal', () => {
  it('konversi jam', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('10:00-09:00 dan 10:00-10:00 -> TIME_RANGE_INVALID', () => {
    expect(() => assertTimeRange(600, 540)).toThrow(expect.objectContaining({ code: 'TIME_RANGE_INVALID', status: 422 }));
    expect(() => assertTimeRange(600, 600)).toThrow(expect.objectContaining({ code: 'TIME_RANGE_INVALID' }));
    expect(() => assertTimeRange(480, 600)).not.toThrow();
  });

  it('08:00-10:00 vs 09:00-11:00 bentrok; vs 10:00-12:00 tidak', () => {
    const a = slot('a', '08:00', '10:00');
    expect(findConflicts(a, [slot('b', '09:00', '11:00')])).toHaveLength(1);
    expect(findConflicts(a, [slot('c', '10:00', '12:00')])).toHaveLength(0);
  });

  it('beda hari dan diri sendiri tidak dihitung bentrok', () => {
    const a = slot('a', '08:00', '10:00');
    expect(findConflicts(a, [a, slot('b', '09:00', '11:00', 2)])).toEqual([]);
  });
});

describe('deadlineLabel', () => {
  const now = new Date('2026-11-24T03:00:00Z');
  const hours = (h: number) => new Date(now.getTime() + h * 3600_000);

  it('kemarin -> overdue, 23 jam -> due_soon, 25 jam -> null', () => {
    expect(deadlineLabel(hours(-24), 'belum', now)).toBe('overdue');
    expect(deadlineLabel(hours(23), 'belum', now)).toBe('due_soon');
    expect(deadlineLabel(hours(24), 'belum', now)).toBe('due_soon');
    expect(deadlineLabel(hours(25), 'belum', now)).toBeNull();
  });

  it('status selesai -> null', () => {
    expect(deadlineLabel(hours(-24), 'selesai', now)).toBeNull();
  });
});
