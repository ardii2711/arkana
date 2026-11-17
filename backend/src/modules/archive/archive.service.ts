import type { ArchiveFolder } from '../../generated/prisma/client.js';
import { readFileContent } from '../../lib/file-content.js';
import { MAX_FILE_BYTES, ARCHIVE_QUOTA_BYTES, isPreviewable } from '../../lib/file-rules.js';
import { receiveMultipart } from '../../lib/multipart.js';
import { prisma } from '../../lib/prisma.js';
import { isUniqueViolation } from '../../lib/prisma-error.js';
import { deleteObjects, mapStorageError, storageError } from '../../lib/storage.js';
import { dateOnlyUtc, dateKey } from '../../lib/wita.js';
import { ApiError } from '../../utils/api-error.js';
import type { FileContent } from '../../utils/file-response.js';
import type { Request } from 'express';
import {
  MAX_FOLDER_LEVEL,
  descendantIds,
  folderLevel,
  subtreeHeight,
  type FolderNode,
} from './archive-folders.rules.js';
import type {
  CreateFileFields,
  CreateFolderInput,
  ListFilesQuery,
  UpdateFileInput,
  UpdateFolderInput,
} from './archive.schema.js';
import { createFileFieldsSchema } from './archive.schema.js';

const DEFAULT_FOLDERS = [
  'SK & Kepegawaian',
  'Pendidikan',
  'Diklat & Sertifikat',
  'Data Pribadi & Keluarga',
  'Lainnya',
];

const folderSelect = {
  id: true,
  name: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const fileSelect = {
  id: true,
  folderId: true,
  folder: { select: { name: true } },
  name: true,
  description: true,
  documentDate: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
  updatedAt: true,
} as const;

type FolderRow = Pick<ArchiveFolder, 'id' | 'name' | 'parentId' | 'createdAt' | 'updatedAt'>;

interface FileRow {
  id: string;
  folderId: string | null;
  folder: { name: string } | null;
  name: string;
  description: string | null;
  documentDate: Date | null;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

function toFileItem(file: FileRow) {
  const { folder, ...rest } = file;

  return {
    ...rest,
    folderName: folder?.name ?? null,
    documentDate: file.documentDate ? dateKey(file.documentDate) : null,
    previewable: isPreviewable(file.mimeType),
  };
}

function folderNotFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Folder tidak ditemukan');
}

function fileNotFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Dokumen tidak ditemukan');
}

async function findOwnedFolder(userId: string, folderId: string): Promise<FolderRow> {
  const folder = await prisma.archiveFolder.findFirst({
    where: { id: folderId, userId },
    select: folderSelect,
  });

  if (!folder) {
    throw folderNotFound();
  }

  return folder;
}

async function loadFolderNodes(userId: string): Promise<FolderNode[]> {
  return prisma.archiveFolder.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });
}

function folderNameTaken(): ApiError {
  return new ApiError(409, 'FOLDER_NAME_TAKEN', 'Nama folder sudah dipakai pada level ini');
}

async function ensureFolderNameAvailable(
  userId: string,
  parentId: string | null,
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.archiveFolder.findFirst({
    where: {
      userId,
      parentId,
      name,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw folderNameTaken();
  }
}

export async function listArchiveFolders(userId: string) {
  const [folderCount, fileCount] = await Promise.all([
    prisma.archiveFolder.count({ where: { userId } }),
    prisma.archiveFile.count({ where: { userId } }),
  ]);

  // ponytail: seeding folder bawaan saat arsip benar-benar kosong. Dua request
  // paralel bisa membuat duplikat; pindahkan ke proses aktivasi bila terjadi.
  if (folderCount === 0 && fileCount === 0) {
    await prisma.archiveFolder.createMany({
      data: DEFAULT_FOLDERS.map((name) => ({ userId, name })),
    });
  }

  const [folders, used] = await Promise.all([
    prisma.archiveFolder.findMany({
      where: { userId },
      select: { ...folderSelect, _count: { select: { files: true } } },
      orderBy: [{ name: 'asc' }],
    }),
    prisma.archiveFile.aggregate({ where: { userId }, _sum: { size: true } }),
  ]);

  return {
    folders: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      fileCount: folder._count.files,
    })),
    usage: { usedBytes: used._sum.size ?? 0, quotaBytes: ARCHIVE_QUOTA_BYTES },
  };
}

export async function createArchiveFolder(userId: string, input: CreateFolderInput) {
  const parentId = input.parentId ?? null;
  const parentLevel = parentId ? folderLevel(await loadFolderNodes(userId), parentId) : 0;

  if (parentLevel === null) {
    throw folderNotFound();
  }

  if (parentLevel + 1 > MAX_FOLDER_LEVEL) {
    throw new ApiError(
      400,
      'FOLDER_DEPTH_EXCEEDED',
      `Kedalaman folder maksimal ${MAX_FOLDER_LEVEL} level`,
    );
  }

  await ensureFolderNameAvailable(userId, parentId, input.name);

  const folder = await prisma.archiveFolder
    .create({
      data: { userId, name: input.name, parentId },
      select: folderSelect,
    })
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw folderNameTaken();
      }

      throw error;
    });

  return { ...folder, fileCount: 0 };
}

export async function updateArchiveFolder(
  userId: string,
  folderId: string,
  input: UpdateFolderInput,
) {
  const folder = await findOwnedFolder(userId, folderId);
  const parentId = input.parentId === undefined ? folder.parentId : input.parentId;
  const name = input.name ?? folder.name;

  if (parentId && parentId === folderId) {
    throw new ApiError(
      400,
      'INVALID_FOLDER_MOVE',
      'Folder tidak dapat menjadi induk dirinya sendiri',
    );
  }

  if (parentId !== folder.parentId) {
    const folders = await loadFolderNodes(userId);

    if (parentId && descendantIds(folders, folderId).includes(parentId)) {
      throw new ApiError(
        400,
        'INVALID_FOLDER_MOVE',
        'Folder tidak dapat dipindah ke dalam turunannya',
      );
    }

    const parentLevel = parentId ? folderLevel(folders, parentId) : 0;

    if (parentLevel === null) {
      throw folderNotFound();
    }

    if (parentLevel + subtreeHeight(folders, folderId) > MAX_FOLDER_LEVEL) {
      throw new ApiError(
        400,
        'FOLDER_DEPTH_EXCEEDED',
        `Kedalaman folder maksimal ${MAX_FOLDER_LEVEL} level`,
      );
    }
  }

  if (name !== folder.name || parentId !== folder.parentId) {
    await ensureFolderNameAvailable(userId, parentId, name, folderId);
  }

  return prisma.archiveFolder
    .update({
      where: { id: folderId },
      data: { name, parentId },
      select: folderSelect,
    })
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw folderNameTaken();
      }

      throw error;
    });
}

export async function deleteArchiveFolder(
  userId: string,
  folderId: string,
  recursive: boolean,
): Promise<void> {
  await findOwnedFolder(userId, folderId);

  const [children, files] = await Promise.all([
    prisma.archiveFolder.count({ where: { userId, parentId: folderId } }),
    prisma.archiveFile.count({ where: { userId, folderId } }),
  ]);

  if (!recursive && (children > 0 || files > 0)) {
    throw new ApiError(409, 'FOLDER_NOT_EMPTY', 'Folder masih berisi subfolder atau dokumen');
  }

  if (recursive) {
    const ids = descendantIds(await loadFolderNodes(userId), folderId);
    const keys = await prisma.archiveFile.findMany({
      where: { userId, folderId: { in: ids } },
      select: { key: true },
    });

    await deleteObjects(keys.map((file) => file.key)).catch(storageError);
  }

  await prisma.archiveFolder.delete({ where: { id: folderId } });
}

export async function listArchiveFiles(userId: string, query: ListFilesQuery) {
  const typeFilter =
    query.type === 'image'
      ? { mimeType: { startsWith: 'image/' } }
      : query.type === 'pdf'
        ? { mimeType: 'application/pdf' }
        : query.type === 'document'
          ? { NOT: [{ mimeType: { startsWith: 'image/' } }, { mimeType: 'application/pdf' }] }
          : {};

  const where = {
    userId,
    ...(query.folderId === 'root'
      ? { folderId: null }
      : query.folderId
        ? { folderId: query.folderId }
        : {}),
    ...typeFilter,
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.archiveFile.findMany({
      where,
      select: fileSelect,
      orderBy:
        query.sort === 'name'
          ? [{ name: 'asc' }]
          : query.sort === 'documentDate'
            ? [{ documentDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
            : [{ createdAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.archiveFile.count({ where }),
  ]);

  return {
    items: items.map(toFileItem),
    total,
    page: query.page,
    limit: query.limit,
  };
}

function baseName(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, '').trim();
  return withoutExtension || filename;
}

export async function createArchiveFile(userId: string, req: Request) {
  const used = await prisma.archiveFile.aggregate({ where: { userId }, _sum: { size: true } });
  const remaining = ARCHIVE_QUOTA_BYTES - (used._sum.size ?? 0);

  if (remaining <= 0) {
    throw new ApiError(
      400,
      'STORAGE_QUOTA_EXCEEDED',
      `Kuota penyimpanan arsip sudah penuh (${ARCHIVE_QUOTA_BYTES / 1024 ** 3} GB)`,
    );
  }

  const { fields, file } = await receiveMultipart(req, {
    maxBytes: Math.min(MAX_FILE_BYTES, remaining),
    prefix: `archive/${userId}`,
    fileRequired: true,
    fields: ['folderId', 'name', 'description', 'documentDate'],
  }).catch(mapStorageError);

  if (!file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'File wajib diunggah');
  }

  const values = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ''));
  const input: CreateFileFields = createFileFieldsSchema.parse(values);

  if (input.folderId) {
    await findOwnedFolder(userId, input.folderId);
  }

  try {
    const created = await prisma.archiveFile.create({
      data: {
        userId,
        folderId: input.folderId ?? null,
        name: input.name ?? baseName(file.originalName),
        description: input.description ?? null,
        documentDate: input.documentDate ? dateOnlyUtc(input.documentDate) : null,
        ...file,
      },
      select: fileSelect,
    });

    return toFileItem(created);
  } catch (error) {
    await deleteObjects([file.key]).catch(storageError);
    throw error;
  }
}

export async function getArchiveFile(userId: string, fileId: string) {
  const file = await prisma.archiveFile.findFirst({
    where: { id: fileId, userId },
    select: fileSelect,
  });

  if (!file) {
    throw fileNotFound();
  }

  return toFileItem(file);
}

export async function updateArchiveFile(userId: string, fileId: string, input: UpdateFileInput) {
  const file = await prisma.archiveFile.findFirst({
    where: { id: fileId, userId },
    select: { id: true },
  });

  if (!file) {
    throw fileNotFound();
  }

  if (input.folderId) {
    await findOwnedFolder(userId, input.folderId);
  }

  const updated = await prisma.archiveFile.update({
    where: { id: fileId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.folderId !== undefined && { folderId: input.folderId }),
      ...(input.documentDate !== undefined && {
        documentDate: input.documentDate ? dateOnlyUtc(input.documentDate) : null,
      }),
    },
    select: fileSelect,
  });

  return toFileItem(updated);
}

export async function deleteArchiveFile(userId: string, fileId: string): Promise<void> {
  const file = await prisma.archiveFile.findFirst({
    where: { id: fileId, userId },
    select: { id: true, key: true },
  });

  if (!file) {
    throw fileNotFound();
  }

  await deleteObjects([file.key]).catch(storageError);
  await prisma.archiveFile.delete({ where: { id: file.id } });
}

export async function getArchiveFileContent(
  userId: string,
  fileId: string,
  wantsInline: boolean,
): Promise<FileContent> {
  const file = await prisma.archiveFile.findFirst({
    where: { id: fileId, userId },
    select: { key: true, originalName: true, mimeType: true, size: true },
  });

  if (!file) {
    throw fileNotFound();
  }

  return readFileContent(file, wantsInline).catch(mapStorageError);
}
