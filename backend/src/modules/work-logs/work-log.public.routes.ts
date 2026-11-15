import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import { validate } from '../../middlewares/validate.js';
import {
  getPublicWorkLogFileContentHandler,
  getPublicWorkLogHandler,
} from './work-log.public.controller.js';
import {
  publicWorkLogFileParamSchema,
  publicWorkLogParamSchema,
  workLogFileContentQuerySchema,
} from './work-log.schema.js';

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
    });
  },
});

export const publicWorkLogsRouter = Router();

publicWorkLogsRouter.use(limiter);

publicWorkLogsRouter.get(
  '/:token',
  validate({ params: publicWorkLogParamSchema }),
  getPublicWorkLogHandler,
);
publicWorkLogsRouter.get(
  '/:token/files/:fileId/content',
  validate({ params: publicWorkLogFileParamSchema, query: workLogFileContentQuerySchema }),
  getPublicWorkLogFileContentHandler,
);
