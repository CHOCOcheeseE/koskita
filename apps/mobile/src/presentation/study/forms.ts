import { z } from 'zod';

import { isTimeRangeValid } from '@/domain/study/study';

const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, { error: 'Jam belum benar' });

export const scheduleSchema = z
  .object({
    courseName: z
      .string()
      .trim()
      .min(2, { error: 'Nama mata kuliah minimal 2 karakter' })
      .max(60, { error: 'Nama mata kuliah maksimal 60 karakter' }),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: time,
    endTime: time,
    room: z.string().trim().max(30, { error: 'Ruang maksimal 30 karakter' }),
  })
  .refine((v) => isTimeRangeValid(v.startTime, v.endTime), {
    error: 'Jam selesai harus setelah jam mulai',
    path: ['endTime'],
  });
export type ScheduleForm = z.infer<typeof scheduleSchema>;

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Judul minimal 3 karakter' })
    .max(80, { error: 'Judul maksimal 80 karakter' }),
  scheduleId: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time,
  note: z.string().max(300, { error: 'Catatan maksimal 300 karakter' }),
});
export type TaskForm = z.infer<typeof taskSchema>;
