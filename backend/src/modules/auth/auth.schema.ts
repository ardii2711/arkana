import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const activationToken = z.string().min(32).max(128);

export const activationTokenSchema = z.object({ token: activationToken });

export const activateAccountSchema = z.object({
  token: activationToken,
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
