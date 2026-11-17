import { z } from 'zod';

import { ScheduleCategory, ScheduleStatus } from '../../generated/prisma/enums.js';
import { paginationFields } from '../../lib/pagination.js';
import { AT_LEAST_ONE_FIELD_MESSAGE, hasAtLeastOneField } from '../../lib/validation.js';

const title = z.string().trim().min(1).max(200);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value));
const dateTime = z.iso.datetime({ offset: true });
const category = z.enum(ScheduleCategory);
const status = z.enum(ScheduleStatus);

function endsBeforeStart(startAt?: string, endAt?: string | null): boolean {
  return Boolean(startAt && endAt && new Date(endAt) < new Date(startAt));
}

const endAtIssue = {
  message: 'Waktu selesai tidak boleh sebelum waktu mulai',
  path: ['endAt'],
};

export const createScheduleSchema = z
  .object({
    title,
    description: optionalText(2_000),
    startAt: dateTime,
    endAt: dateTime.nullable().optional(),
    allDay: z.boolean().optional(),
    location: optionalText(200),
    category,
    status: status.optional(),
  })
  .refine((input) => !endsBeforeStart(input.startAt, input.endAt), endAtIssue);

export const updateScheduleSchema = z
  .object({
    title: title.optional(),
    description: optionalText(2_000),
    startAt: dateTime.optional(),
    endAt: dateTime.nullable().optional(),
    allDay: z.boolean().optional(),
    location: optionalText(200),
    category: category.optional(),
    status: status.optional(),
  })
  .refine(hasAtLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE })
  .refine((input) => !endsBeforeStart(input.startAt, input.endAt), endAtIssue);

export const listSchedulesQuerySchema = z
  .object({
    ...paginationFields,
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    category: category.optional(),
    status: status.optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'Rentang tanggal tidak valid',
    path: ['from'],
  });

export const scheduleIdParamSchema = z.object({ id: z.uuid() });

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;
