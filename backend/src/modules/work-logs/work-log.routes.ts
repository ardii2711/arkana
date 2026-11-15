import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  createWorkLogHandler,
  deleteWorkLogFileHandler,
  deleteWorkLogHandler,
  getWorkLogFileContentHandler,
  getWorkLogHandler,
  listWorkLogFilesHandler,
  listWorkLogsHandler,
  updateWorkLogHandler,
  uploadWorkLogFileHandler,
} from './work-log.controller.js';
import {
  createWorkLogSchema,
  listWorkLogsQuerySchema,
  updateWorkLogSchema,
  workLogFileContentQuerySchema,
  workLogFileParamSchema,
  workLogIdParamSchema,
} from './work-log.schema.js';

export const workLogsRouter = Router();

workLogsRouter.use(requireRole('USER'));

workLogsRouter.get('/', validate({ query: listWorkLogsQuerySchema }), listWorkLogsHandler);
workLogsRouter.post('/', validate({ body: createWorkLogSchema }), createWorkLogHandler);
workLogsRouter.get('/:id', validate({ params: workLogIdParamSchema }), getWorkLogHandler);
workLogsRouter.get(
  '/:id/files',
  validate({ params: workLogIdParamSchema }),
  listWorkLogFilesHandler,
);
workLogsRouter.post(
  '/:id/files',
  validate({ params: workLogIdParamSchema }),
  uploadWorkLogFileHandler,
);
workLogsRouter.get(
  '/:id/files/:fileId/content',
  validate({ params: workLogFileParamSchema, query: workLogFileContentQuerySchema }),
  getWorkLogFileContentHandler,
);
workLogsRouter.delete(
  '/:id/files/:fileId',
  validate({ params: workLogFileParamSchema }),
  deleteWorkLogFileHandler,
);
workLogsRouter.patch(
  '/:id',
  validate({ params: workLogIdParamSchema, body: updateWorkLogSchema }),
  updateWorkLogHandler,
);
workLogsRouter.delete('/:id', validate({ params: workLogIdParamSchema }), deleteWorkLogHandler);
