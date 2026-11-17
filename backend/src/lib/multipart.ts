import { randomUUID } from 'node:crypto';
import { Transform } from 'node:stream';

import Busboy from 'busboy';
import type { Request } from 'express';

import { ApiError } from '../utils/api-error.js';
import { canonicalMimeType, extensionOf, isAllowedUpload } from './file-rules.js';
import { uploadObject } from './storage.js';

export interface ReceivedFile {
  key: string;
  size: number;
  originalName: string;
  mimeType: string;
}

interface MultipartResult {
  fields: Record<string, string>;
  file: ReceivedFile | null;
}

interface MultipartOptions {
  maxBytes: number;
  prefix: string;
  fields?: readonly string[];
  fileRequired?: boolean;
}

function fileTooLarge(): ApiError {
  return new ApiError(400, 'FILE_TOO_LARGE', 'Ukuran file melebihi batas yang diizinkan');
}

export function receiveMultipart(
  req: Request,
  { maxBytes, prefix, fields = [], fileRequired = false }: MultipartOptions,
): Promise<MultipartResult> {
  const allowedFields = new Set(fields);

  return new Promise<MultipartResult>((resolve, reject) => {
    let settled = false;
    const settle = (action: () => void) => {
      if (!settled) {
        settled = true;
        action();
      }
    };

    let busboy: ReturnType<typeof Busboy>;

    try {
      busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: maxBytes, files: 1, fields: 20, fieldSize: 10_000 },
      });
    } catch {
      reject(new ApiError(400, 'INVALID_MULTIPART', 'Permintaan upload tidak valid'));
      return;
    }

    const values: Record<string, string> = {};
    let filePromise: Promise<ReceivedFile> | null = null;
    let invalidFile = false;

    busboy.on('field', (name, value) => {
      if (allowedFields.has(name)) {
        values[name] = value;
      }
    });

    busboy.on('file', (_field, stream, info) => {
      if (filePromise) {
        stream.resume();
        return;
      }

      const filename = info.filename ?? '';
      const extension = extensionOf(filename);

      if (!extension || !isAllowedUpload(extension, info.mimeType)) {
        invalidFile = true;
        stream.resume();
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

      filePromise = upload
        .done()
        .then(() => {
          if (truncated) {
            throw fileTooLarge();
          }

          return { key, size, originalName: filename, mimeType };
        })
        .catch((error: unknown) => {
          throw truncated ? fileTooLarge() : error;
        });

      // Tandai rejection sebagai handled; ditunggu pada event 'close'.
      filePromise.catch(() => undefined);
    });

    busboy.on('error', (error) => {
      settle(() => reject(error));
    });

    req.on('error', (error) => {
      settle(() => reject(error));
    });

    busboy.on('close', () => {
      if (!filePromise) {
        if (invalidFile) {
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

        if (fileRequired) {
          settle(() => reject(new ApiError(400, 'FILE_REQUIRED', 'File wajib diunggah')));
          return;
        }

        settle(() => resolve({ fields: values, file: null }));
        return;
      }

      filePromise
        .then((file) => settle(() => resolve({ fields: values, file })))
        .catch((error: unknown) => settle(() => reject(error)));
    });

    req.pipe(busboy);
  });
}
