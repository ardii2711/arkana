import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import { getAdminDashboard, getDashboard } from './dashboard.service.js';

export const dashboardHandler: RequestHandler = async (req, res) => {
  sendSuccess(res, await getDashboard(currentUser(req).id));
};

export const adminDashboardHandler: RequestHandler = async (_req, res) => {
  sendSuccess(res, await getAdminDashboard());
};
