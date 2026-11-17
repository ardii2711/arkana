import { z } from 'zod';

import { AT_LEAST_ONE_FIELD_MESSAGE, hasAtLeastOneField } from '../../lib/validation.js';

const PNS_GOLONGAN = [
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

const PPPK_GOLONGAN = [
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

const GOLONGAN_VALUES = [...PNS_GOLONGAN, ...PPPK_GOLONGAN] as [string, ...string[]];

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(100).optional(),
    titleBefore: z.string().trim().max(50).nullish(),
    titleAfter: z.string().trim().max(100).nullish(),
    nip: z
      .string()
      .regex(/^\d{18}$/, 'NIP harus 18 digit angka')
      .nullish(),
    employeeStatus: z.enum(['PNS', 'PPPK']).nullish(),
    golongan: z.enum(GOLONGAN_VALUES).nullish(),
    position: z.string().trim().max(100).nullish(),
    unit: z.string().trim().max(150).nullish(),
  })
  .refine(hasAtLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE });

export const requestEmailChangeSchema = z.object({
  email: z.email('Format email tidak valid').trim().toLowerCase().max(255),
});

export const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type VerifyEmailChangeInput = z.infer<typeof verifyEmailChangeSchema>;
