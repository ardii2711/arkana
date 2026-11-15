import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import { exportReportHandler } from './report.controller.js';
import { reportExportQuerySchema } from './report.schema.js';

export const reportsRouter = Router();

reportsRouter.use(requireRole('USER'));

reportsRouter.get(
  '/work-logs/export',
  validate({ query: reportExportQuerySchema }),
  exportReportHandler,
);
