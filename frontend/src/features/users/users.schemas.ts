import { z } from 'zod';

const name = z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter');

const email = z.email('Email tidak valid').trim().toLowerCase();

export const inviteUserSchema = z.object({
  name,
  email,
});

export const editUserSchema = z.object({
  name,
  email,
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
