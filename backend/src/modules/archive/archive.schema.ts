import { z } from 'zod';

import { paginationFields } from '../../lib/pagination.js';

const folderName = z.string().trim().min(1).max(100);
const fileName = z.string().trim().min(1).max(200);
const description = z.string().trim().max(5_000);
const documentDate = z.iso.date();
const folderId = z.uuid();

export const createFolderSchema = z.object({
  name: folderName,
  parentId: folderId.nullable().optional(),
});

export const updateFolderSchema = z
  .object({
    name: folderName.optional(),
    parentId: folderId.nullable().optional(),
  })
  .refine((input) => input.name !== undefined || input.parentId !== undefined, {
    message: 'Minimal satu field harus diisi',
  });

export const deleteFolderQuerySchema = z.object({
  recursive: z.enum(['true', 'false']).optional(),
});

export const folderParamSchema = z.object({ id: folderId });

export const createFileFieldsSchema = z.object({
  folderId: folderId.optional(),
  name: fileName.optional(),
  description: description.optional(),
  documentDate: documentDate.optional(),
});

export const updateFileSchema = z
  .object({
    name: fileName.optional(),
    description: description.nullable().optional(),
    documentDate: documentDate.nullable().optional(),
    folderId: folderId.nullable().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const listFilesQuerySchema = z.object({
  folderId: z.union([z.literal('root'), folderId]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  type: z.enum(['image', 'pdf', 'document']).optional(),
  ...paginationFields,
  sort: z.enum(['recent', 'name', 'documentDate']).default('recent'),
});

export const fileParamSchema = z.object({ id: z.uuid() });

export const fileContentQuerySchema = z.object({
  inline: z.enum(['true', 'false']).optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateFileFields = z.infer<typeof createFileFieldsSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
