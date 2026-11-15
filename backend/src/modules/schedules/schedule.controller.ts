import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import type {
  CreateScheduleInput,
  ListSchedulesQuery,
  UpdateScheduleInput,
} from './schedule.schema.js';
import {
  createSchedule,
  deleteSchedule,
  getSchedule,
  listSchedules,
  updateSchedule,
} from './schedule.service.js';

export const listSchedulesHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ListSchedulesQuery;
  sendSuccess(res, await listSchedules(currentUser(req).id, query));
};

export const getScheduleHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendSuccess(res, { schedule: await getSchedule(currentUser(req).id, id) });
};

export const createScheduleHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as CreateScheduleInput;
  sendSuccess(res, { schedule: await createSchedule(currentUser(req).id, input) }, 201);
};

export const updateScheduleHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateScheduleInput;
  sendSuccess(res, { schedule: await updateSchedule(currentUser(req).id, id, input) });
};

export const deleteScheduleHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  await deleteSchedule(currentUser(req).id, id);
  res.status(204).end();
};
