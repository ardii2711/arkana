import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(
    'Konfigurasi environment tidak valid: NEXT_PUBLIC_API_URL wajib berupa URL absolut (contoh: http://localhost:4000/api). NEXT_PUBLIC_SITE_URL bila diisi wajib URL absolut.',
  );
}

export const env = parsed.data;
