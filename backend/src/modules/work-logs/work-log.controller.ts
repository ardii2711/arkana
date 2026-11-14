import type { Request, RequestHandler } from 'express';

import { ApiError } from '../../utils/api-error.js';
import { sendSuccess } from '../../utils/api-response.js';
import type {
  CreateWorkLogInput,
  ListWorkLogsQuery,
  UpdateWorkLogInput,
} from './work-log.schema.js';
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLog,
  listWorkLogs,
  updateWorkLog,
} from './work-log.service.js';

function currentUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
  }

  return req.user;
}

export const listWorkLogsHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ListWorkLogsQuery;
  sendSuccess(res, await listWorkLogs(currentUser(req).id, query));
};

export const getWorkLogHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendSuccess(res, { workLog: await getWorkLog(currentUser(req).id, id) });
};

export const createWorkLogHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as CreateWorkLogInput;
  sendSuccess(res, { workLog: await createWorkLog(currentUser(req).id, input) }, 201);
};

export const updateWorkLogHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateWorkLogInput;
  sendSuccess(res, { workLog: await updateWorkLog(currentUser(req).id, id, input) });
};

export const deleteWorkLogHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  await deleteWorkLog(currentUser(req).id, id);
  res.status(204).end();
};
