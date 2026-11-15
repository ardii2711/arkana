import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  createNoteHandler,
  deleteNoteHandler,
  listNotesHandler,
  updateNoteHandler,
} from './note.controller.js';
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteIdParamSchema,
  updateNoteSchema,
} from './note.schema.js';

export const notesRouter = Router();

notesRouter.use(requireRole('USER'));

notesRouter.get('/', validate({ query: listNotesQuerySchema }), listNotesHandler);
notesRouter.post('/', validate({ body: createNoteSchema }), createNoteHandler);
notesRouter.patch(
  '/:id',
  validate({ params: noteIdParamSchema, body: updateNoteSchema }),
  updateNoteHandler,
);
notesRouter.delete('/:id', validate({ params: noteIdParamSchema }), deleteNoteHandler);
