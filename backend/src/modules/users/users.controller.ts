import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { sendFileContent } from '../../utils/file-response.js';
import type { InviteUserInput, ListUsersQuery, UpdateUserInput } from './users.schema.js';
import {
  deleteUser,
  getUserAvatar,
  inviteUser,
  listUsers,
  resendInvitation,
  updateUser,
} from './users.service.js';

export const listUsersHandler: RequestHandler = async (_req, res) => {
  const query = res.locals.input.query as ListUsersQuery;
  sendSuccess(res, await listUsers(query));
};

export const inviteUserHandler: RequestHandler = async (_req, res) => {
  const input = res.locals.input.body as InviteUserInput;
  sendSuccess(res, { user: await inviteUser(input) }, 201);
};

export const updateUserHandler: RequestHandler = async (_req, res) => {
  const { id } = res.locals.input.params as { id: string };
  const input = res.locals.input.body as UpdateUserInput;
  sendSuccess(res, { user: await updateUser(id, input) });
};

export const resendInvitationHandler: RequestHandler = async (_req, res) => {
  const { id } = res.locals.input.params as { id: string };

  await resendInvitation(id);
  sendSuccess(res, { sent: true });
};

export const getUserAvatarHandler: RequestHandler = async (_req, res) => {
  const { id } = res.locals.input.params as { id: string };
  sendFileContent(res, await getUserAvatar(id));
};

export const deleteUserHandler: RequestHandler = async (_req, res) => {
  const { id } = res.locals.input.params as { id: string };

  await deleteUser(id);
  res.status(204).end();
};
