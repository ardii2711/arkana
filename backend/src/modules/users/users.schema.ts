import { z } from 'zod';

import { paginationFields } from '../../lib/pagination.js';
import { AT_LEAST_ONE_FIELD_MESSAGE, hasAtLeastOneField } from '../../lib/validation.js';

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
});

export const listUsersQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['ACTIVE', 'INVITED', 'INACTIVE']).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().trim().toLowerCase().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine(hasAtLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE });

export const userIdParamSchema = z.object({ id: z.uuid() });

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
