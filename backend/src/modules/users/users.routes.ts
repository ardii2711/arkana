import { Router } from 'express';

import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  inviteUserHandler,
  listUsersHandler,
  resendInvitationHandler,
  updateUserHandler,
} from './users.controller.js';
import {
  inviteUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema.js';

export const usersRouter = Router();

usersRouter.use(requireRole('ADMIN'));

usersRouter.get('/', validate({ query: listUsersQuerySchema }), listUsersHandler);
usersRouter.post('/invite', validate({ body: inviteUserSchema }), inviteUserHandler);
usersRouter.post(
  '/:id/resend-invitation',
  validate({ params: userIdParamSchema }),
  resendInvitationHandler,
);
usersRouter.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  updateUserHandler,
);
