import type { ErrorRequestHandler, RequestHandler } from 'express';

import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { ApiError } from '../utils/api-error.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production' ? 'Internal server error' : String(err?.message ?? err),
    },
  });
};
