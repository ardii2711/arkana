import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import { exportReportHandler, getReportHandler } from './report.controller.js';
import { reportExportQuerySchema, reportQuerySchema } from './report.schema.js';

export const reportsRouter = Router();

reportsRouter.use(requireRole('USER'));

reportsRouter.get('/work-logs', validate({ query: reportQuerySchema }), getReportHandler);

reportsRouter.get(
  '/work-logs/export',
  validate({ query: reportExportQuerySchema }),
  exportReportHandler,
);
