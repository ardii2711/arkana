import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const tokenSchema = z.string().min(32).max(128);

export const activationTokenSchema = z.object({ token: tokenSchema });

export const activateAccountSchema = z.object({
  token: tokenSchema,
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: z.string().min(8).max(128),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
