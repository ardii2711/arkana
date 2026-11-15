import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import { sendFileContent } from '../../utils/file-response.js';
import {
  createArchiveFile,
  createArchiveFolder,
  deleteArchiveFile,
  deleteArchiveFolder,
  getArchiveFile,
  getArchiveFileContent,
  listArchiveFiles,
  listArchiveFolders,
  updateArchiveFile,
  updateArchiveFolder,
} from './archive.service.js';
import type {
  CreateFolderInput,
  ListFilesQuery,
  UpdateFileInput,
  UpdateFolderInput,
} from './archive.schema.js';

export const listFoldersHandler: RequestHandler = async (req, res) => {
  sendSuccess(res, await listArchiveFolders(currentUser(req).id));
};

export const createFolderHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as CreateFolderInput;
  sendSuccess(res, { folder: await createArchiveFolder(currentUser(req).id, input) }, 201);
};

export const updateFolderHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateFolderInput;
  sendSuccess(res, { folder: await updateArchiveFolder(currentUser(req).id, id, input) });
};

export const deleteFolderHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const { recursive } = res.locals.input.query as { recursive?: 'true' | 'false' };
  await deleteArchiveFolder(currentUser(req).id, id, recursive === 'true');
  res.status(204).end();
};

export const listFilesHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ListFilesQuery;
  sendSuccess(res, await listArchiveFiles(currentUser(req).id, query));
};

export const createFileHandler: RequestHandler = async (req, res) => {
  sendSuccess(res, { file: await createArchiveFile(currentUser(req).id, req) }, 201);
};

export const getFileHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendSuccess(res, { file: await getArchiveFile(currentUser(req).id, id) });
};

export const updateFileHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateFileInput;
  sendSuccess(res, { file: await updateArchiveFile(currentUser(req).id, id, input) });
};

export const deleteFileHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  await deleteArchiveFile(currentUser(req).id, id);
  res.status(204).end();
};

export const getFileContentHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const { inline } = res.locals.input.query as { inline?: 'true' | 'false' };
  sendFileContent(res, await getArchiveFileContent(currentUser(req).id, id, inline === 'true'));
};
