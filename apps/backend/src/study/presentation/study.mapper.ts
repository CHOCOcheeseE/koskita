import type { components } from '../../contract/schema';
import { minutesToTime } from '../domain/rules';
import type { ScheduleView, TaskView } from '../domain/study.use-cases';

type Schemas = components['schemas'];

export function toScheduleResponse(s: ScheduleView): Schemas['ClassSchedule'] {
  return {
    id: s.id,
    courseName: s.courseName,
    dayOfWeek: s.dayOfWeek,
    startTime: minutesToTime(s.startMinute),
    endTime: minutesToTime(s.endMinute),
    room: s.room,
    conflictsWith: s.conflictsWith.map((c) => ({
      id: c.id,
      courseName: c.courseName,
      startTime: minutesToTime(c.startMinute),
      endTime: minutesToTime(c.endMinute),
    })),
  };
}

export function toTaskResponse(t: TaskView): Schemas['StudyTask'] {
  return {
    id: t.id,
    title: t.title,
    scheduleId: t.scheduleId,
    courseName: t.courseName,
    deadline: t.deadline.toISOString(),
    note: t.note,
    status: t.status,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    deadlineLabel: t.deadlineLabel,
    createdAt: t.createdAt.toISOString(),
  };
}
