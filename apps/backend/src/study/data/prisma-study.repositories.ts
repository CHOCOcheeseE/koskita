import { Injectable } from '@nestjs/common';
import { ClassSchedule as ScheduleRow, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/data/prisma.service';
import {
  ClassSchedule,
  ScheduleData,
  ScheduleRepository,
  StudyTask,
  TaskCursor,
  TaskData,
  TaskRepository,
} from '../domain/ports';
import type { TaskStatus } from '../domain/rules';

function toSchedule(row: ScheduleRow): ClassSchedule {
  return {
    id: row.id,
    userId: row.userId,
    courseName: row.courseName,
    dayOfWeek: row.dayOfWeek,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    room: row.room,
  };
}

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: ScheduleData): Promise<ClassSchedule> {
    return toSchedule(await this.prisma.classSchedule.create({ data: { ...data, userId } }));
  }

  async findOwned(userId: string, id: string): Promise<ClassSchedule | null> {
    const row = await this.prisma.classSchedule.findFirst({ where: { id, userId } });
    return row ? toSchedule(row) : null;
  }

  async update(id: string, data: ScheduleData): Promise<ClassSchedule> {
    return toSchedule(await this.prisma.classSchedule.update({ where: { id }, data }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.classSchedule.delete({ where: { id } });
  }

  async list(userId: string, dayOfWeek?: number): Promise<ClassSchedule[]> {
    const rows = await this.prisma.classSchedule.findMany({
      where: { userId, ...(dayOfWeek !== undefined ? { dayOfWeek } : {}) },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }, { endMinute: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toSchedule);
  }
}

const taskInclude = { schedule: { select: { courseName: true } } } satisfies Prisma.StudyTaskInclude;
type TaskRow = Prisma.StudyTaskGetPayload<{ include: typeof taskInclude }>;

function toTask(row: TaskRow): StudyTask {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    scheduleId: row.scheduleId,
    courseName: row.schedule?.courseName ?? null,
    deadline: row.deadline,
    note: row.note,
    status: row.status as TaskStatus,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: TaskData): Promise<StudyTask> {
    return toTask(await this.prisma.studyTask.create({ data: { ...data, userId }, include: taskInclude }));
  }

  async findOwned(userId: string, id: string): Promise<StudyTask | null> {
    const row = await this.prisma.studyTask.findFirst({ where: { id, userId }, include: taskInclude });
    return row ? toTask(row) : null;
  }

  async update(id: string, data: TaskData): Promise<StudyTask> {
    return toTask(await this.prisma.studyTask.update({ where: { id }, data, include: taskInclude }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.studyTask.delete({ where: { id } });
  }

  async list(userId: string, status: TaskStatus, after: TaskCursor | null, take: number): Promise<StudyTask[]> {
    const where: Prisma.StudyTaskWhereInput = { userId, status };
    let orderBy: Prisma.StudyTaskOrderByWithRelationInput[];
    if (status === 'belum') {
      orderBy = [{ deadline: 'asc' }, { id: 'asc' }];
      if (after) where.OR = [{ deadline: { gt: after.value } }, { deadline: after.value, id: { gt: after.id } }];
    } else {
      orderBy = [{ completedAt: 'desc' }, { id: 'desc' }];
      if (after) where.OR = [{ completedAt: { lt: after.value } }, { completedAt: after.value, id: { lt: after.id } }];
    }
    const rows = await this.prisma.studyTask.findMany({ where, orderBy, take, include: taskInclude });
    return rows.map(toTask);
  }
}
