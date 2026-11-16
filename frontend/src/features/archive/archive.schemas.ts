import { z } from 'zod';

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama folder wajib diisi.')
    .max(100, 'Nama folder maksimal 100 karakter.'),
  parentId: z.string(),
});

export type FolderFormValues = z.infer<typeof folderSchema>;

export const fileMetaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama dokumen wajib diisi.')
    .max(200, 'Nama dokumen maksimal 200 karakter.'),
  description: z.string().trim().max(5000, 'Deskripsi maksimal 5.000 karakter.'),
  documentDate: z.string(),
  folderId: z.string(),
});

export type FileMetaFormValues = z.infer<typeof fileMetaSchema>;
