import { z } from 'zod';

import { SCHEDULE_CATEGORIES, SCHEDULE_STATUSES } from './schedule.api';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export const scheduleFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi').max(200, 'Judul maksimal 200 karakter'),
    description: z.string().trim().max(2_000, 'Deskripsi maksimal 2.000 karakter'),
    location: z.string().trim().max(200, 'Tempat maksimal 200 karakter'),
    category: z.enum(SCHEDULE_CATEGORIES, { error: 'Kategori wajib dipilih' }),
    status: z.enum(SCHEDULE_STATUSES, { error: 'Status wajib dipilih' }),
    allDay: z.boolean(),
    startDate: z.string().regex(DATE, 'Tanggal mulai wajib diisi'),
    startTime: z.string().regex(TIME, 'Waktu mulai wajib diisi'),
    endDate: z.string().regex(DATE, 'Tanggal selesai tidak valid').or(z.literal('')),
    endTime: z.string().regex(TIME, 'Waktu selesai tidak valid').or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.allDay) {
      return;
    }

    if (!TIME.test(values.startTime)) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Waktu mulai wajib diisi' });
    }

    if (values.endDate || values.endTime) {
      const endDate = values.endDate || values.startDate;
      const endTime = values.endTime || '23:59';
      const start = `${values.startDate}T${values.startTime}`;
      const end = `${endDate}T${endTime}`;

      if (end < start) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'Waktu selesai tidak boleh sebelum waktu mulai',
        });
      }
    }
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
