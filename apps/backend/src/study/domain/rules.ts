import { AppError } from '../../common/domain/app-error';

export type TaskStatus = 'belum' | 'selesai';
export type DeadlineLabel = 'overdue' | 'due_soon';

export interface ScheduleSlot {
  id: string;
  courseName: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface ScheduleConflict {
  id: string;
  courseName: string;
  startMinute: number;
  endMinute: number;
}

/** "08:30" -> 510 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 510 -> "08:30" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function assertTimeRange(startMinute: number, endMinute: number): void {
  if (endMinute <= startMinute) {
    throw new AppError(422, 'TIME_RANGE_INVALID', 'Jam selesai harus setelah jam mulai');
  }
}

/** Jadwal lain di hari sama yang jamnya beririsan: start < other.end dan other.start < end. */
export function findConflicts(target: ScheduleSlot, others: ScheduleSlot[]): ScheduleConflict[] {
  return others
    .filter(
      (o) =>
        o.id !== target.id &&
        o.dayOfWeek === target.dayOfWeek &&
        target.startMinute < o.endMinute &&
        o.startMinute < target.endMinute,
    )
    .sort((a, b) => a.startMinute - b.startMinute || a.id.localeCompare(b.id))
    .map((o) => ({ id: o.id, courseName: o.courseName, startMinute: o.startMinute, endMinute: o.endMinute }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hanya untuk tugas `belum`:
 * - overdue: deadline < sekarang
 * - due_soon: sekarang <= deadline <= sekarang + 24 jam
 */
export function deadlineLabel(deadline: Date, status: TaskStatus, now: Date): DeadlineLabel | null {
  if (status !== 'belum') return null;
  const d = deadline.getTime();
  const n = now.getTime();
  if (d < n) return 'overdue';
  if (d <= n + DAY_MS) return 'due_soon';
  return null;
}
