import heicConvert from 'heic-convert';

import type { FileContent } from '../utils/file-response.js';
import { ApiError } from '../utils/api-error.js';
import { isHeic, isPreviewable } from './file-rules.js';
import { logger } from './logger.js';
import { downloadObject } from './storage.js';

export interface StoredFile {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

async function toBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Buffer));
  }

  return Buffer.concat(chunks);
}

export async function readFileContent(
  file: StoredFile,
  wantsInline: boolean,
): Promise<FileContent> {
  const inline = wantsInline && isPreviewable(file.mimeType);
  const body = await downloadObject(file.key);

  if (inline && isHeic(file.mimeType)) {
    // ponytail: konversi setiap kali preview, tanpa cache. Simpan turunan JPEG
    // bila latensi preview mulai terasa.
    const jpeg = await heicConvert({
      buffer: await toBuffer(body),
      format: 'JPEG',
      quality: 0.85,
    }).catch(async (error: unknown) => {
      logger.error({ err: error, key: file.key }, 'Konversi HEIC gagal');
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
