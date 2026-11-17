import { z } from 'zod';

import { NAME_MAX_LENGTH } from '@/lib/limits';

export const PNS_GOLONGAN = [
  'I/a',
  'I/b',
  'I/c',
  'I/d',
  'II/a',
  'II/b',
  'II/c',
  'II/d',
  'III/a',
  'III/b',
  'III/c',
  'III/d',
  'IV/a',
  'IV/b',
  'IV/c',
  'IV/d',
  'IV/e',
] as const;

export const PPPK_GOLONGAN = [
  'Golongan I',
  'Golongan II',
  'Golongan III',
  'Golongan IV',
  'Golongan V',
  'Golongan VI',
  'Golongan VII',
  'Golongan VIII',
  'Golongan IX',
  'Golongan X',
  'Golongan XI',
  'Golongan XII',
  'Golongan XIII',
  'Golongan XIV',
  'Golongan XV',
  'Golongan XVI',
  'Golongan XVII',
] as const;

export const ALL_GOLONGAN = [...PNS_GOLONGAN, ...PPPK_GOLONGAN] as readonly string[];
export const NONE_VALUE = '__none__';

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(NAME_MAX_LENGTH, 'Maksimal 100 karakter'),
  titleBefore: z.string().trim().max(50, 'Maksimal 50 karakter'),
  titleAfter: z.string().trim().max(NAME_MAX_LENGTH, 'Maksimal 100 karakter'),
  nip: z
    .string()
    .trim()
    .regex(/^(\d{18})?$/, 'NIP harus 18 digit angka'),
  employeeStatus: z.string(),
  golongan: z.string(),
  position: z.string().trim().max(NAME_MAX_LENGTH, 'Maksimal 100 karakter'),
  unit: z.string().trim().max(150, 'Maksimal 150 karakter'),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const emailChangeSchema = z.object({
  email: z.email('Format email tidak valid').trim().toLowerCase(),
});

export type EmailChangeValues = z.infer<typeof emailChangeSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi sekarang wajib diisi'),
    newPassword: z.string().min(8, 'Minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
