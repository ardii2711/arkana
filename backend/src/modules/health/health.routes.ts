import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { Router } from 'express';

import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { storage } from '../../lib/storage.js';
import { sendSuccess } from '../../utils/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ponytail: tanpa timeout sendiri; probe platform yang membatasi waktu tunggu lalu menilai 503.
healthRouter.get('/ready', async (_req, res) => {
  const [database, objectStorage] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    storage.send(new HeadBucketCommand({ Bucket: env.R2_BUCKET_NAME })),
  ]);

  if (database.status === 'rejected') {
    logger.warn({ err: database.reason }, 'Readiness check database gagal');
  }

  if (objectStorage.status === 'rejected') {
    logger.warn({ err: objectStorage.reason }, 'Readiness check storage gagal');
  }

  const ready = database.status === 'fulfilled' && objectStorage.status === 'fulfilled';

  sendSuccess(
    res,
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database: database.status === 'fulfilled' ? 'ok' : 'error',
        storage: objectStorage.status === 'fulfilled' ? 'ok' : 'error',
      },
    },
    ready ? 200 : 503,
  );
});
