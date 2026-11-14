import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  createWorkLogHandler,
  deleteWorkLogHandler,
  getWorkLogHandler,
  listWorkLogsHandler,
  updateWorkLogHandler,
} from './work-log.controller.js';
import {
  createWorkLogSchema,
  listWorkLogsQuerySchema,
  updateWorkLogSchema,
  workLogIdParamSchema,
} from './work-log.schema.js';

export const workLogsRouter = Router();

workLogsRouter.use(requireRole('USER'));

workLogsRouter.get('/', validate({ query: listWorkLogsQuerySchema }), listWorkLogsHandler);
workLogsRouter.post('/', validate({ body: createWorkLogSchema }), createWorkLogHandler);
workLogsRouter.get('/:id', validate({ params: workLogIdParamSchema }), getWorkLogHandler);
workLogsRouter.patch(
  '/:id',
  validate({ params: workLogIdParamSchema, body: updateWorkLogSchema }),
  updateWorkLogHandler,
);
workLogsRouter.delete('/:id', validate({ params: workLogIdParamSchema }), deleteWorkLogHandler);
