import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter');

export const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const newPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama',
  });

export const forgotPasswordSchema = z.object({
  email: z.email('Email tidak valid'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
