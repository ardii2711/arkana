import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  PUBLIC_WEB_URL: z.url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  // Resend HTTP API (port 443). Wajib di produksi karena Render free memblokir SMTP.
  RESEND_API_KEY: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.url().optional(),
  // Di-inject otomatis oleh Render; dipakai self-ping agar instance free tidak tidur.
  RENDER_EXTERNAL_HOSTNAME: z.string().min(1).optional(),
});

const envSchemaWithRules = envSchema.superRefine((value, ctx) => {
  if (value.NODE_ENV === 'production' && !value.RESEND_API_KEY) {
    ctx.addIssue({
      code: 'custom',
      path: ['RESEND_API_KEY'],
      message: 'RESEND_API_KEY wajib di produksi (Render free memblokir outbound SMTP)',
    });
  }
});

const parsed = envSchemaWithRules.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
