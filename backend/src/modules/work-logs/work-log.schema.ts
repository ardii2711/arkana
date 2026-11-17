import { z } from 'zod';

import { WorkCategory } from '../../generated/prisma/enums.js';
import { paginationFields } from '../../lib/pagination.js';
import { todayWita } from '../../lib/wita.js';

const name = z.string().trim().min(1).max(200);
const description = z.string().trim().min(1).max(10_000);
const output = z.string().trim().min(1).max(5_000);
const category = z.enum(WorkCategory);
const shortText = z
  .string()
  .trim()
  .max(100)
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));
const activityDate = z.iso
  .date()
  .refine((value) => value <= todayWita(), { message: 'Tanggal tidak boleh melewati hari ini' });

export const createWorkLogSchema = z.object({
  name,
  description,
  output,
  category,
  target: shortText,
  realisasi: shortText,
  activityDate: activityDate.optional(),
});

export const updateWorkLogSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    output: output.optional(),
    category: category.optional(),
    target: shortText,
    realisasi: shortText,
    activityDate: activityDate.optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const listWorkLogsQuerySchema = z
  .object({
    ...paginationFields,
    category: category.optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'Rentang tanggal tidak valid',
    path: ['from'],
  });

export const workLogIdParamSchema = z.object({ id: z.uuid() });

export const workLogFileParamSchema = z.object({ id: z.uuid(), fileId: z.uuid() });

export const workLogFileContentQuerySchema = z.object({
  inline: z.enum(['true', 'false']).optional(),
});

export const publicWorkLogParamSchema = z.object({ token: z.uuid() });

export const publicWorkLogFileParamSchema = z.object({
  token: z.uuid(),
  fileId: z.uuid(),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
export type ListWorkLogsQuery = z.infer<typeof listWorkLogsQuerySchema>;
