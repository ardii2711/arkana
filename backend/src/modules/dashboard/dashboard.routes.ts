import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { adminDashboardHandler, dashboardHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireRole('USER'), dashboardHandler);
dashboardRouter.get('/admin', requireRole('ADMIN'), adminDashboardHandler);
