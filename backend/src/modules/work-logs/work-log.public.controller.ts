import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { sendFileContent } from '../../utils/file-response.js';
import { getPublicFileContent, getPublicWorkLog } from './work-log.public.service.js';

export const getPublicWorkLogHandler: RequestHandler = async (_req, res) => {
  const { token } = res.locals.input.params as { token: string };
  sendSuccess(res, { workLog: await getPublicWorkLog(token) });
};

export const getPublicWorkLogFileContentHandler: RequestHandler = async (_req, res) => {
  const { token, fileId } = res.locals.input.params as { token: string; fileId: string };
  const { inline } = res.locals.input.query as { inline?: 'true' | 'false' };

  sendFileContent(res, await getPublicFileContent(token, fileId, inline === 'true'));
};
