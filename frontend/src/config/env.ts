import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_CONTACT_EMAIL: z.email(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
});

if (!parsed.success) {
  throw new Error(
    'Konfigurasi environment tidak valid: NEXT_PUBLIC_API_URL wajib berupa URL absolut (contoh: http://localhost:4000/api). NEXT_PUBLIC_SITE_URL bila diisi wajib URL absolut. NEXT_PUBLIC_CONTACT_EMAIL wajib berupa alamat email valid.',
  );
}

if (process.env.NODE_ENV === 'production' && !parsed.data.NEXT_PUBLIC_SITE_URL) {
  throw new Error(
    'Konfigurasi environment tidak valid: NEXT_PUBLIC_SITE_URL wajib diisi pada build produksi agar canonical dan sitemap memakai domain yang benar.',
  );
}

export const env = parsed.data;
