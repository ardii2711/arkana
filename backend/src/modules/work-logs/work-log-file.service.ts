import { readFileContent } from '../../lib/file-content.js';
import { receiveMultipart } from '../../lib/multipart.js';
import { prisma } from '../../lib/prisma.js';
import { deleteObjects, storageError } from '../../lib/storage.js';
import { ApiError } from '../../utils/api-error.js';
import type { FileContent } from '../../utils/file-response.js';
import type { Request } from 'express';
import {
  MAX_FILE_BYTES,
  MAX_FILES_PER_WORK_LOG,
  MAX_TOTAL_BYTES_PER_WORK_LOG,
  isPreviewable,
} from './work-log-file.rules.js';
import { findOwnedWorkLog } from './work-log.service.js';

export const fileSelect = {
  id: true,
  workLogId: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const;

interface FileRow {
  id: string;
  workLogId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export function toFileItem(file: FileRow) {
  return { ...file, previewable: isPreviewable(file.mimeType) };
}

function fileNotFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'File tidak ditemukan');
}

function requoteStorageError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  return storageError(error);
}

export async function listWorkLogFiles(userId: string, workLogId: string) {
  await findOwnedWorkLog(userId, workLogId);

  const files = await prisma.workLogFile.findMany({
    where: { workLogId },
    select: fileSelect,
    orderBy: { createdAt: 'asc' },
  });

  return files.map(toFileItem);
}

export async function uploadWorkLogFile(userId: string, workLogId: string, req: Request) {
  await findOwnedWorkLog(userId, workLogId);

  const existing = await prisma.workLogFile.aggregate({
    where: { workLogId },
    _count: true,
    _sum: { size: true },
  });

  if (existing._count >= MAX_FILES_PER_WORK_LOG) {
    throw new ApiError(
      400,
      'TOO_MANY_FILES',
      `Maksimal ${MAX_FILES_PER_WORK_LOG} file per kegiatan`,
    );
  }

  const remaining = MAX_TOTAL_BYTES_PER_WORK_LOG - (existing._sum.size ?? 0);

  if (remaining <= 0) {
    throw new ApiError(
      400,
      'FILE_TOO_LARGE',
      `Kapasitas file kegiatan sudah penuh (${MAX_TOTAL_BYTES_PER_WORK_LOG / 1024 ** 2} MB)`,
    );
  }

  // ponytail: batas dihitung sebelum upload; cukup untuk satu pengguna. Ganti ke
  // penghitungan transaksional bila upload paralel menjadi masalah.
  const { file } = await receiveMultipart(req, {
    maxBytes: Math.min(MAX_FILE_BYTES, remaining),
    prefix: `work-logs/${userId}/${workLogId}`,
    fileRequired: true,
  }).catch(requoteStorageError);

  if (!file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'File wajib diunggah');
  }

  try {
    const created = await prisma.workLogFile.create({
      data: { workLogId, ...file },
      select: fileSelect,
    });

    return toFileItem(created);
  } catch (error) {
    await deleteObjects([file.key]).catch(storageError);
    throw error;
  }
}

export async function deleteWorkLogFile(
  userId: string,
  workLogId: string,
  fileId: string,
): Promise<void> {
  const file = await prisma.workLogFile.findFirst({
    where: { id: fileId, workLogId, workLog: { userId } },
    select: { id: true, key: true },
  });

  if (!file) {
    throw fileNotFound();
  }

  await deleteObjects([file.key]).catch(storageError);
  await prisma.workLogFile.delete({ where: { id: file.id } });
}

type FileScope =
  { workLog: { userId: string; id?: string } } | { workLog: { publicToken: string } };

async function loadFileContent(
  fileId: string,
  scope: FileScope,
  wantsInline: boolean,
): Promise<FileContent> {
  const file = await prisma.workLogFile.findFirst({
    where: { id: fileId, ...scope },
    select: { key: true, originalName: true, mimeType: true, size: true },
  });

  if (!file) {
    throw fileNotFound();
  }

  return readFileContent(file, wantsInline).catch(requoteStorageError);
}

export function getWorkLogFileContent(
  userId: string,
  workLogId: string,
  fileId: string,
  wantsInline: boolean,
): Promise<FileContent> {
  return loadFileContent(fileId, { workLog: { userId, id: workLogId } }, wantsInline);
}

export function getPublicWorkLogFileContent(
  publicToken: string,
  fileId: string,
  wantsInline: boolean,
): Promise<FileContent> {
  return loadFileContent(fileId, { workLog: { publicToken } }, wantsInline);
}
