import type { Page } from '../shared/page';
import { addDays, dateWibOf } from '../shared/wib';

export type ScheduleConflict = { id: string; courseName: string; startTime: string; endTime: string };

export type ClassSchedule = {
  id: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  conflictsWith: ScheduleConflict[];
};

export type ScheduleInput = {
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
};

export type TaskStatus = 'belum' | 'selesai';
export type DeadlineLabel = 'overdue' | 'due_soon';

export type StudyTask = {
  id: string;
  title: string;
  scheduleId: string | null;
  courseName: string | null;
  deadline: string;
  note: string | null;
  status: TaskStatus;
  completedAt: string | null;
  deadlineLabel: DeadlineLabel | null;
  createdAt: string;
};

export type TaskInput = {
  title: string;
  scheduleId?: string | null;
  deadline: string;
  note?: string | null;
};

export interface StudyRepository {
  listSchedules(): Promise<ClassSchedule[]>;
  getSchedule(id: string): Promise<ClassSchedule>;
  createSchedule(input: ScheduleInput): Promise<ClassSchedule>;
  updateSchedule(id: string, input: Partial<ScheduleInput>): Promise<ClassSchedule>;
  deleteSchedule(id: string): Promise<void>;
  listTasks(status: TaskStatus, cursor?: string | null): Promise<Page<StudyTask>>;
  getTask(id: string): Promise<StudyTask>;
  createTask(input: TaskInput): Promise<StudyTask>;
  updateTask(id: string, patch: Partial<TaskInput> & { status?: TaskStatus }): Promise<StudyTask>;
  deleteTask(id: string): Promise<void>;
}

const emptyToNull = (v: string | null | undefined) => {
  const t = v?.trim() ?? '';
  return t === '' ? null : t;
};

export function createStudyUseCases(repo: StudyRepository) {
  const cleanSchedule = (input: ScheduleInput): ScheduleInput => ({
    ...input,
    courseName: input.courseName.trim(),
    room: emptyToNull(input.room),
  });
  const cleanTask = (input: TaskInput): TaskInput => ({
    ...input,
    title: input.title.trim(),
    note: emptyToNull(input.note),
    scheduleId: input.scheduleId ?? null,
  });
  return {
    listSchedules: () => repo.listSchedules(),
    getSchedule: (id: string) => repo.getSchedule(id),
    createSchedule: (input: ScheduleInput) => repo.createSchedule(cleanSchedule(input)),
    updateSchedule: (id: string, input: ScheduleInput) => repo.updateSchedule(id, cleanSchedule(input)),
    deleteSchedule: (id: string) => repo.deleteSchedule(id),
    listTasks: (status: TaskStatus, cursor?: string | null) => repo.listTasks(status, cursor),
    getTask: (id: string) => repo.getTask(id),
    createTask: (input: TaskInput) => repo.createTask(cleanTask(input)),
    updateTask: (id: string, input: TaskInput) => repo.updateTask(id, cleanTask(input)),
    setTaskStatus: (id: string, status: TaskStatus) => repo.updateTask(id, { status }),
    deleteTask: (id: string) => repo.deleteTask(id),
  };
}

export type StudyUseCases = ReturnType<typeof createStudyUseCases>;

export function isTimeRangeValid(start: string, end: string): boolean {
  return end > start;
}

export function schedulesOfDay(items: ClassSchedule[], dayOfWeek: number): ClassSchedule[] {
  return items
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function conflictText(schedule: Pick<ClassSchedule, 'conflictsWith'>): string | null {
  if (schedule.conflictsWith.length === 0) return null;
  return `Bentrok dengan ${schedule.conflictsWith.map((c) => c.courseName).join(', ')}`;
}

/** Lencana deadline untuk tampilan: label backend + pilihan "Hari ini"/"Besok" dari tanggal WIB. */
export type DeadlineBadge = 'overdue' | 'today' | 'tomorrow' | 'soon' | null;

export function deadlineBadge(task: Pick<StudyTask, 'deadline' | 'deadlineLabel'>, todayWibDate: string): DeadlineBadge {
  if (task.deadlineLabel === 'overdue') return 'overdue';
  if (task.deadlineLabel !== 'due_soon') return null;
  const deadlineDate = dateWibOf(task.deadline);
  if (deadlineDate === todayWibDate) return 'today';
  if (deadlineDate === addDays(todayWibDate, 1)) return 'tomorrow';
  return 'soon';
}
