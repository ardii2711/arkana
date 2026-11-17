import { z } from 'zod';

import { BODY_MAX_LENGTH, NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/lib/limits';
import { WORK_CATEGORIES } from '@/lib/work-category';

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max.toLocaleString('id-ID')} karakter`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter`);

export const workLogSchema = z.object({
  name: requiredText('Nama kegiatan', TITLE_MAX_LENGTH),
  description: requiredText('Uraian pekerjaan', 10_000),
  output: requiredText('Hasil atau output', BODY_MAX_LENGTH),
  category: z.enum(WORK_CATEGORIES, { error: 'Kategori wajib dipilih' }),
  target: optionalText('Target', NAME_MAX_LENGTH),
  realisasi: optionalText('Realisasi', NAME_MAX_LENGTH),
});

export type WorkLogFormValues = z.infer<typeof workLogSchema>;
