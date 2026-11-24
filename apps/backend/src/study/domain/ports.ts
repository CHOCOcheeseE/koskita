import type { ScheduleSlot, TaskStatus } from './rules';

export interface ClassSchedule extends ScheduleSlot {
  userId: string;
  room: string | null;
}

export interface StudyTask {
  id: string;
  userId: string;
  title: string;
  scheduleId: string | null;
  courseName: string | null;
  deadline: Date;
  note: string | null;
  status: TaskStatus;
  completedAt: Date | null;
  createdAt: Date;
}

export interface ScheduleData {
  courseName: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  room: string | null;
}

export interface ScheduleRepository {
  create(userId: string, data: ScheduleData): Promise<ClassSchedule>;
  findOwned(userId: string, id: string): Promise<ClassSchedule | null>;
  update(id: string, data: ScheduleData): Promise<ClassSchedule>;
  delete(id: string): Promise<void>;
  /** Urut hari lalu jam mulai. `dayOfWeek` opsional. */
  list(userId: string, dayOfWeek?: number): Promise<ClassSchedule[]>;
}

export interface TaskData {
  title: string;
  scheduleId: string | null;
  deadline: Date;
  note: string | null;
  status: TaskStatus;
  completedAt: Date | null;
}

export interface TaskCursor {
  value: Date;
  id: string;
}

export interface TaskRepository {
  create(userId: string, data: TaskData): Promise<StudyTask>;
  findOwned(userId: string, id: string): Promise<StudyTask | null>;
  update(id: string, data: TaskData): Promise<StudyTask>;
  delete(id: string): Promise<void>;
  /** `belum`: deadline asc, id asc. `selesai`: completedAt desc, id desc. */
  list(userId: string, status: TaskStatus, after: TaskCursor | null, take: number): Promise<StudyTask[]>;
}

export const SCHEDULE_REPOSITORY = Symbol('SCHEDULE_REPOSITORY');
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
