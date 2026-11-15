import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { Transform } from 'node:stream';

import Busboy from 'busboy';
import type { Request } from 'express';
import heicConvert from 'heic-convert';

import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { deleteObjects, downloadObject, uploadObject } from '../../lib/storage.js';
import { ApiError } from '../../utils/api-error.js';
import type { FileContent } from '../../utils/file-response.js';
import {
  MAX_FILE_BYTES,
  MAX_FILES_PER_WORK_LOG,
  MAX_TOTAL_BYTES_PER_WORK_LOG,
  canonicalMimeType,
  extensionOf,
  isAllowedUpload,
  isHeic,
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

function fileTooLarge(): ApiError {
  return new ApiError(
    400,
    'FILE_TOO_LARGE',
    'Ukuran file melebihi batas 5 MB atau sisa kapasitas kegiatan',
  );
}

async function storageFailed(error: unknown): Promise<never> {
  logger.error({ err: error }, 'Operasi R2 gagal');
  throw new ApiError(502, 'STORAGE_ERROR', 'Penyimpanan file sedang bermasalah');
}

async function toBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

interface ReceivedFile {
  key: string;
  size: number;
  originalName: string;
  mimeType: string;
}

function receiveFile(req: Request, maxBytes: number, prefix: string): Promise<ReceivedFile> {
  return new Promise<ReceivedFile>((resolve, reject) => {
    let settled = false;
    const settle = (action: () => void) => {
      if (!settled) {
        settled = true;
        action();
      }
    };

    let busboy: ReturnType<typeof Busboy>;

    try {
      busboy = Busboy({ headers: req.headers, limits: { fileSize: maxBytes, files: 1 } });
    } catch {
      reject(new ApiError(400, 'INVALID_MULTIPART', 'Permintaan upload tidak valid'));
      return;
    }

    let sawFile = false;

    busboy.on('file', (_field, stream, info) => {
      sawFile = true;

      const filename = info.filename ?? '';
      const extension = extensionOf(filename);

      if (!extension || !isAllowedUpload(extension, info.mimeType)) {
        stream.resume();
        settle(() =>
          reject(
            new ApiError(
              400,
              'INVALID_FILE_TYPE',
              'Format file tidak didukung. Gunakan JPG, JPEG, PNG, WEBP, HEIC, HEIF, PDF, DOC, DOCX, XLS, atau XLSX',
            ),
          ),
        );
        return;
      }

      const key = `${prefix}/${randomUUID()}.${extension}`;
      const mimeType = canonicalMimeType(extension) as string;
      let size = 0;
      let truncated = false;

      const counter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          size += chunk.length;
          callback(null, chunk);
        },
      });

      stream.pipe(counter);
      const upload = uploadObject(key, counter, mimeType);

      stream.on('limit', () => {
        truncated = true;
        void upload.abort();
      });

      upload
        .done()
        .then(() => {
          if (truncated) {
            settle(() => reject(fileTooLarge()));
            return;
          }

          settle(() => resolve({ key, size, originalName: filename, mimeType }));
        })
        .catch((error: unknown) => {
          settle(() => reject(truncated ? fileTooLarge() : error));
        });
    });

    busboy.on('error', (error) => {
      settle(() => reject(error));
    });

    req.on('error', (error) => {
      settle(() => reject(error));
    });

    busboy.on('close', () => {
      if (!sawFile) {
        settle(() => reject(new ApiError(400, 'FILE_REQUIRED', 'File wajib diunggah')));
      }
    });

    req.pipe(busboy);
  });
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
    throw new ApiError(400, 'TOO_MANY_FILES', 'Maksimal 10 file per kegiatan');
  }

  const remaining = MAX_TOTAL_BYTES_PER_WORK_LOG - (existing._sum.size ?? 0);

  if (remaining <= 0) {
    throw new ApiError(400, 'FILE_TOO_LARGE', 'Kapasitas file kegiatan sudah penuh (50 MB)');
  }

  // ponytail: batas dihitung sebelum upload; cukup untuk satu pengguna. Ganti ke
  // penghitungan transaksional bila upload paralel menjadi masalah.
  const received = await receiveFile(
    req,
    Math.min(MAX_FILE_BYTES, remaining),
    `work-logs/${userId}/${workLogId}`,
  ).catch(async (error: unknown) => {
    if (error instanceof ApiError) {
      throw error;
    }

    return storageFailed(error);
  });

  try {
    const file = await prisma.workLogFile.create({
      data: { workLogId, ...received },
      select: fileSelect,
    });

    return toFileItem(file);
  } catch (error) {
    await deleteObjects([received.key]).catch((cleanupError: unknown) => {
      logger.error({ err: cleanupError, key: received.key }, 'Gagal menghapus objek yatim');
    });
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

  await deleteObjects([file.key]).catch(storageFailed);
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

  const inline = wantsInline && isPreviewable(file.mimeType);

  const body = await downloadObject(file.key).catch(storageFailed);

  if (inline && isHeic(file.mimeType)) {
    // ponytail: konversi setiap kali preview, tanpa cache. Simpan turunan JPEG
    // bila latensi preview mulai terasa.
    const jpeg = await heicConvert({
      buffer: await toBuffer(body),
      format: 'JPEG',
      quality: 0.85,
    }).catch(async (error: unknown) => {
      logger.error({ err: error, fileId }, 'Konversi HEIC gagal');
      throw new ApiError(422, 'PREVIEW_UNAVAILABLE', 'File tidak dapat ditampilkan');
    });

    return {
      body: Buffer.from(jpeg),
      contentType: 'image/jpeg',
      size: jpeg.length,
      originalName: file.originalName,
      inline: true,
      converted: true,
    };
  }

  return {
    body,
    contentType: file.mimeType,
    size: file.size,
    originalName: file.originalName,
    inline,
    converted: false,
  };
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
