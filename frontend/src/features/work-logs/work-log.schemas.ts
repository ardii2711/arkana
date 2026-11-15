import { z } from 'zod';

import { WORK_CATEGORIES } from './work-log.api';

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max.toLocaleString('id-ID')} karakter`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter`);

export const workLogSchema = z.object({
  name: requiredText('Nama kegiatan', 200),
  description: requiredText('Uraian pekerjaan', 10_000),
  output: requiredText('Hasil atau output', 5_000),
  category: z.enum(WORK_CATEGORIES, { error: 'Kategori wajib dipilih' }),
  target: optionalText('Target', 100),
  realisasi: optionalText('Realisasi', 100),
});

export type WorkLogFormValues = z.infer<typeof workLogSchema>;
