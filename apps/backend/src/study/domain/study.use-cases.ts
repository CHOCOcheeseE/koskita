import { AppError, notFound } from '../../common/domain/app-error';
import { Clock } from '../../common/domain/clock';
import { decodeCursor, Page, toPage } from '../../common/pagination/cursor';
import { wibDayOfWeek } from '../../common/time/wib';
import { ClassSchedule, ScheduleData, ScheduleRepository, StudyTask, TaskCursor, TaskRepository } from './ports';
import {
  assertTimeRange,
  deadlineLabel,
  DeadlineLabel,
  findConflicts,
  minutesToTime,
  ScheduleConflict,
  TaskStatus,
  timeToMinutes,
} from './rules';

export interface ScheduleInput {
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export interface ScheduleView extends ClassSchedule {
  conflictsWith: ScheduleConflict[];
}

export interface TaskInput {
  title: string;
  scheduleId?: string | null;
  deadline: string;
  note?: string | null;
}

export interface TaskPatch extends Partial<TaskInput> {
  status?: TaskStatus;
}

export interface TaskView extends StudyTask {
  deadlineLabel: DeadlineLabel | null;
}

const cleanOptional = (v: string | null | undefined): string | null => (v?.trim() ? v.trim() : null);

export class StudyUseCases {
  constructor(
    private readonly schedules: ScheduleRepository,
    private readonly tasks: TaskRepository,
    private readonly clock: Clock,
  ) {}

  // ------------------------------------------------------------ jadwal

  async listSchedules(userId: string, dayOfWeek?: number): Promise<ScheduleView[]> {
    const all = await this.schedules.list(userId, dayOfWeek);
    return all.map((s) => ({ ...s, conflictsWith: findConflicts(s, all) }));
  }

  /** Kelas hari ini (WIB) untuk Beranda. */
  classesToday(userId: string): Promise<ScheduleView[]> {
    return this.listSchedules(userId, wibDayOfWeek(this.clock.now()));
  }

  async createSchedule(userId: string, input: ScheduleInput): Promise<ScheduleView> {
    const created = await this.schedules.create(userId, this.toScheduleData(input));
    return this.withConflicts(userId, created);
  }

  async getSchedule(userId: string, id: string): Promise<ScheduleView> {
    return this.withConflicts(userId, await this.requireSchedule(userId, id));
  }

  async updateSchedule(userId: string, id: string, patch: Partial<ScheduleInput>): Promise<ScheduleView> {
    const current = await this.requireSchedule(userId, id);
    const data = this.toScheduleData({
      courseName: patch.courseName ?? current.courseName,
      dayOfWeek: patch.dayOfWeek ?? current.dayOfWeek,
      startTime: patch.startTime ?? minutesToTime(current.startMinute),
      endTime: patch.endTime ?? minutesToTime(current.endMinute),
      room: patch.room !== undefined ? patch.room : current.room,
    });
    return this.withConflicts(userId, await this.schedules.update(id, data));
  }

  async deleteSchedule(userId: string, id: string): Promise<void> {
    await this.requireSchedule(userId, id);
    await this.schedules.delete(id);
  }

  // ------------------------------------------------------------ tugas

  async listTasks(userId: string, status: TaskStatus, cursor: string | undefined, limit: number): Promise<Page<TaskView>> {
    const decoded = decodeCursor(cursor);
    let after: TaskCursor | null = null;
    if (decoded) {
      const value = new Date(decoded.v);
      if (Number.isNaN(value.getTime())) {
        throw new AppError(400, 'VALIDATION_FAILED', 'Kursor halaman tidak valid', { cursor: 'Kursor halaman tidak valid' });
      }
      after = { value, id: decoded.i };
    }
    const rows = await this.tasks.list(userId, status, after, limit + 1);
    const page = toPage(rows, limit, (t) => ({
      v: (status === 'belum' ? t.deadline : (t.completedAt ?? t.deadline)).toISOString(),
      i: t.id,
    }));
    return { items: page.items.map((t) => this.taskView(t)), nextCursor: page.nextCursor };
  }

  /** Maksimal 3 tugas `belum`, deadline terdekat (yang terlambat paling atas). */
  async upcomingTasks(userId: string): Promise<TaskView[]> {
    const rows = await this.tasks.list(userId, 'belum', null, 3);
    return rows.map((t) => this.taskView(t));
  }

  async createTask(userId: string, input: TaskInput): Promise<TaskView> {
    const scheduleId = await this.checkSchedule(userId, input.scheduleId ?? null);
    const created = await this.tasks.create(userId, {
      title: input.title.trim(),
      scheduleId,
      deadline: new Date(input.deadline),
      note: cleanOptional(input.note),
      status: 'belum',
      completedAt: null,
    });
    return this.taskView(created);
  }

  async getTask(userId: string, id: string): Promise<TaskView> {
    return this.taskView(await this.requireTask(userId, id));
  }

  async updateTask(userId: string, id: string, patch: TaskPatch): Promise<TaskView> {
    const current = await this.requireTask(userId, id);
    const scheduleId = patch.scheduleId !== undefined ? await this.checkSchedule(userId, patch.scheduleId) : current.scheduleId;
    const status = patch.status ?? current.status;
    let completedAt: Date | null = null;
    if (status === 'selesai') completedAt = current.status === 'selesai' ? current.completedAt : this.clock.now();
    const updated = await this.tasks.update(id, {
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      scheduleId,
      deadline: patch.deadline !== undefined ? new Date(patch.deadline) : current.deadline,
      note: patch.note !== undefined ? cleanOptional(patch.note) : current.note,
      status,
      completedAt,
    });
    return this.taskView(updated);
  }

  async deleteTask(userId: string, id: string): Promise<void> {
    await this.requireTask(userId, id);
    await this.tasks.delete(id);
  }

  // ------------------------------------------------------------ helper

  private toScheduleData(input: ScheduleInput): ScheduleData {
    const startMinute = timeToMinutes(input.startTime);
    const endMinute = timeToMinutes(input.endTime);
    assertTimeRange(startMinute, endMinute);
    return {
      courseName: input.courseName.trim(),
      dayOfWeek: input.dayOfWeek,
      startMinute,
      endMinute,
      room: cleanOptional(input.room),
    };
  }

  private async withConflicts(userId: string, schedule: ClassSchedule): Promise<ScheduleView> {
    const sameDay = await this.schedules.list(userId, schedule.dayOfWeek);
    return { ...schedule, conflictsWith: findConflicts(schedule, sameDay) };
  }

  private async requireSchedule(userId: string, id: string): Promise<ClassSchedule> {
    const found = await this.schedules.findOwned(userId, id);
    if (!found) throw notFound('Jadwal tidak ditemukan');
    return found;
  }

  private async requireTask(userId: string, id: string): Promise<StudyTask> {
    const found = await this.tasks.findOwned(userId, id);
    if (!found) throw notFound('Tugas tidak ditemukan');
    return found;
  }

  private async checkSchedule(userId: string, scheduleId: string | null): Promise<string | null> {
    if (scheduleId === null) return null;
    if (!(await this.schedules.findOwned(userId, scheduleId))) {
      throw new AppError(422, 'SCHEDULE_NOT_FOUND', 'Mata kuliah tidak ditemukan di jadwalmu');
    }
    return scheduleId;
  }

  private taskView(task: StudyTask): TaskView {
    return { ...task, deadlineLabel: deadlineLabel(task.deadline, task.status, this.clock.now()) };
  }
}
