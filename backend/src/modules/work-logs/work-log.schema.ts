import { z } from 'zod';

import { WorkCategory } from '../../generated/prisma/enums.js';

const today = () => new Date().toISOString().slice(0, 10);

const name = z.string().trim().min(1).max(200);
const description = z.string().trim().min(1).max(10_000);
const output = z.string().trim().min(1).max(5_000);
const category = z.enum(WorkCategory);
const activityDate = z.iso
  .date()
  .refine((value) => value <= today(), { message: 'Tanggal tidak boleh melewati hari ini' });

export const createWorkLogSchema = z.object({
  name,
  description,
  output,
  category,
  activityDate: activityDate.optional(),
});

export const updateWorkLogSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    output: output.optional(),
    category: category.optional(),
    activityDate: activityDate.optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const listWorkLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
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

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
export type ListWorkLogsQuery = z.infer<typeof listWorkLogsQuerySchema>;
