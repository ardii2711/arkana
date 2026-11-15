import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  createScheduleHandler,
  deleteScheduleHandler,
  getScheduleHandler,
  listSchedulesHandler,
  updateScheduleHandler,
} from './schedule.controller.js';
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  scheduleIdParamSchema,
  updateScheduleSchema,
} from './schedule.schema.js';

export const schedulesRouter = Router();

schedulesRouter.use(requireRole('USER'));

schedulesRouter.get('/', validate({ query: listSchedulesQuerySchema }), listSchedulesHandler);
schedulesRouter.post('/', validate({ body: createScheduleSchema }), createScheduleHandler);
schedulesRouter.get('/:id', validate({ params: scheduleIdParamSchema }), getScheduleHandler);
schedulesRouter.patch(
  '/:id',
  validate({ params: scheduleIdParamSchema, body: updateScheduleSchema }),
  updateScheduleHandler,
);
schedulesRouter.delete('/:id', validate({ params: scheduleIdParamSchema }), deleteScheduleHandler);
