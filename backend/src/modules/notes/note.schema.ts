import { z } from 'zod';

import { paginationFields } from '../../lib/pagination.js';
import { AT_LEAST_ONE_FIELD_MESSAGE, hasAtLeastOneField } from '../../lib/validation.js';

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
  .refine(hasAtLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE });

export const listNotesQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().min(1).max(100).optional(),
  pinned: z.enum(['true', 'false']).optional(),
});

export const noteIdParamSchema = z.object({ id: z.uuid() });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
