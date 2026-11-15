import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error(
    'Konfigurasi environment tidak valid: NEXT_PUBLIC_API_URL wajib berupa URL absolut (contoh: http://localhost:4000/api).',
  );
}

export const env = parsed.data;
