import { Router } from 'express';

import { archiveRouter } from '../modules/archive/archive.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { notesRouter } from '../modules/notes/note.routes.js';
import { profileRouter } from '../modules/profile/profile.routes.js';
import { reportsRouter } from '../modules/reports/report.routes.js';
import { schedulesRouter } from '../modules/schedules/schedule.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { publicWorkLogsRouter } from '../modules/work-logs/work-log.public.routes.js';
import { workLogsRouter } from '../modules/work-logs/work-log.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/work-logs', workLogsRouter);
apiRouter.use('/archive', archiveRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/schedules', schedulesRouter);
apiRouter.use('/notes', notesRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/public/work-logs', publicWorkLogsRouter);
