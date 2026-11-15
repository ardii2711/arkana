import type { Request, RequestHandler } from 'express';

import { ApiError } from '../../utils/api-error.js';
import { sendSuccess } from '../../utils/api-response.js';
import {
  deleteWorkLogFile,
  getWorkLogFileContent,
  listWorkLogFiles,
  uploadWorkLogFile,
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

export const listWorkLogFilesHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendSuccess(res, { files: await listWorkLogFiles(currentUser(req).id, id) });
};

export const uploadWorkLogFileHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const file = await uploadWorkLogFile(currentUser(req).id, id, req);
  sendSuccess(res, { file }, 201);
};

export const deleteWorkLogFileHandler: RequestHandler = async (req, res) => {
  const { id, fileId } = res.locals.input.params as { id: string; fileId: string };
  await deleteWorkLogFile(currentUser(req).id, id, fileId);
  res.status(204).end();
};

function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function previewName(filename: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, '') + '.jpg';
}

export const getWorkLogFileContentHandler: RequestHandler = async (req, res) => {
  const { id, fileId } = res.locals.input.params as { id: string; fileId: string };
  const { inline } = res.locals.input.query as { inline?: 'true' | 'false' };
  const content = await getWorkLogFileContent(currentUser(req).id, id, fileId, inline === 'true');

  res.setHeader('Content-Type', content.contentType);
  res.setHeader('Content-Length', String(content.size));
  res.setHeader(
    'Content-Disposition',
    contentDisposition(
      content.inline ? 'inline' : 'attachment',
      content.converted ? previewName(content.originalName) : content.originalName,
    ),
  );
  res.setHeader('Cache-Control', 'private, max-age=300');

  if (Buffer.isBuffer(content.body)) {
    res.end(content.body);
    return;
  }

  content.body.on('error', () => {
    res.destroy();
  });
  content.body.pipe(res);
};
