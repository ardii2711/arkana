import { Router } from 'express';

import { createLimiter } from '../../middlewares/rate-limit.js';
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

const limiter = createLimiter(120, 60 * 1000);

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
