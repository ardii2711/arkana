import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  createFileHandler,
  createFolderHandler,
  deleteFileHandler,
  deleteFolderHandler,
  getFileContentHandler,
  getFileHandler,
  listFilesHandler,
  listFoldersHandler,
  updateFileHandler,
  updateFolderHandler,
} from './archive.controller.js';
import {
  createFolderSchema,
  deleteFolderQuerySchema,
  fileContentQuerySchema,
  fileParamSchema,
  folderParamSchema,
  listFilesQuerySchema,
  updateFileSchema,
  updateFolderSchema,
} from './archive.schema.js';

export const archiveRouter = Router();

archiveRouter.use(requireRole('USER'));

archiveRouter.get('/folders', listFoldersHandler);
archiveRouter.post('/folders', validate({ body: createFolderSchema }), createFolderHandler);
archiveRouter.patch(
  '/folders/:id',
  validate({ params: folderParamSchema, body: updateFolderSchema }),
  updateFolderHandler,
);
archiveRouter.delete(
  '/folders/:id',
  validate({ params: folderParamSchema, query: deleteFolderQuerySchema }),
  deleteFolderHandler,
);

archiveRouter.get('/files', validate({ query: listFilesQuerySchema }), listFilesHandler);
archiveRouter.post('/files', createFileHandler);
archiveRouter.get('/files/:id', validate({ params: fileParamSchema }), getFileHandler);
archiveRouter.patch(
  '/files/:id',
  validate({ params: fileParamSchema, body: updateFileSchema }),
  updateFileHandler,
);
archiveRouter.delete('/files/:id', validate({ params: fileParamSchema }), deleteFileHandler);
archiveRouter.get(
  '/files/:id/content',
  validate({ params: fileParamSchema, query: fileContentQuerySchema }),
  getFileContentHandler,
);
