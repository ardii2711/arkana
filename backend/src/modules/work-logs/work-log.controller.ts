import type { RequestHandler } from 'express';

import { receiveMultipart } from '../../lib/multipart.js';
import { mapStorageError } from '../../lib/storage.js';
import { ApiError } from '../../utils/api-error.js';
import { currentUser } from '../../utils/current-user.js';
import { sendSuccess } from '../../utils/api-response.js';
import { sendFileContent } from '../../utils/file-response.js';
import {
  completeWorkLogFileUpload,
  deleteWorkLogFile,
  getWorkLogFileContent,
  listWorkLogFiles,
  prepareWorkLogFileUpload,
} from './work-log-file.service.js';
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

export const listWorkLogFilesHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendSuccess(res, { files: await listWorkLogFiles(currentUser(req).id, id) });
};

export const uploadWorkLogFileHandler: RequestHandler = async (req, res) => {
  const userId = currentUser(req).id;
  const { id } = res.locals.input.params as { id: string };
  const config = await prepareWorkLogFileUpload(userId, id);
  const received = await receiveMultipart(req, { ...config, fileRequired: true }).catch(
    mapStorageError,
  );

  if (!received.file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'File wajib diunggah');
  }

  const file = await completeWorkLogFileUpload(id, received.file);
  sendSuccess(res, { file }, 201);
};

export const deleteWorkLogFileHandler: RequestHandler = async (req, res) => {
  const { id, fileId } = res.locals.input.params as { id: string; fileId: string };
  await deleteWorkLogFile(currentUser(req).id, id, fileId);
  res.status(204).end();
};

export const getWorkLogFileContentHandler: RequestHandler = async (req, res) => {
  const { id, fileId } = res.locals.input.params as { id: string; fileId: string };
  const { inline } = res.locals.input.query as { inline?: 'true' | 'false' };

  sendFileContent(
    res,
    await getWorkLogFileContent(currentUser(req).id, id, fileId, inline === 'true'),
  );
};
