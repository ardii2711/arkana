import { z } from 'zod';

import { BODY_MAX_LENGTH, NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/lib/limits';

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama folder wajib diisi.')
    .max(NAME_MAX_LENGTH, 'Nama folder maksimal 100 karakter.'),
  parentId: z.string(),
});

export type FolderFormValues = z.infer<typeof folderSchema>;

export const fileMetaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama dokumen wajib diisi.')
    .max(TITLE_MAX_LENGTH, 'Nama dokumen maksimal 200 karakter.'),
  description: z.string().trim().max(BODY_MAX_LENGTH, 'Deskripsi maksimal 5.000 karakter.'),
  documentDate: z.string(),
  folderId: z.string().min(1, 'Folder wajib dipilih.'),
});

export type FileMetaFormValues = z.infer<typeof fileMetaSchema>;
