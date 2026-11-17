import { DeleteObjectsCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Readable } from 'node:stream';

import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from './logger.js';

export const storage = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export function uploadObject(key: string, body: Readable, contentType: string): Upload {
  return new Upload({
    client: storage,
    params: {
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 2,
  });
}

export async function downloadObject(key: string): Promise<Readable> {
  const object = await storage.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));

  if (!object.Body) {
    throw new Error(`Objek ${key} tidak memiliki isi`);
  }

  return object.Body as Readable;
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await storage.send(
    new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
    }),
  );
}

export function storageError(error: unknown): never {
  logger.error({ err: error }, 'Operasi R2 gagal');
  throw new ApiError(502, 'STORAGE_ERROR', 'Penyimpanan file sedang bermasalah');
}

export function mapStorageError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  return storageError(error);
}
