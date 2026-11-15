import { z } from 'zod';

const content = z.string().trim().min(1).max(20_000);

export const createNoteSchema = z.object({
  content,
  pinned: z.boolean().optional(),
});

export const updateNoteSchema = z
  .object({
    content: content.optional(),
    pinned: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  pinned: z.enum(['true', 'false']).optional(),
});

export const noteIdParamSchema = z.object({ id: z.uuid() });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
