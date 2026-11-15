import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from './note.schema.js';
import { createNote, deleteNote, listNotes, updateNote } from './note.service.js';

export const listNotesHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ListNotesQuery;
  sendSuccess(res, await listNotes(currentUser(req).id, query));
};

export const createNoteHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as CreateNoteInput;
  sendSuccess(res, { note: await createNote(currentUser(req).id, input) }, 201);
};

export const updateNoteHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateNoteInput;
  sendSuccess(res, { note: await updateNote(currentUser(req).id, id, input) });
};

export const deleteNoteHandler: RequestHandler = async (req, res) => {
  const { id } = res.locals.input.params as { id: string };
  await deleteNote(currentUser(req).id, id);
  res.status(204).end();
};
