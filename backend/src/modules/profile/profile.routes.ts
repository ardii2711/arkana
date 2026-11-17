import { Router } from 'express';

import { createLimiter } from '../../middlewares/rate-limit.js';
import { requireRole } from '../../middlewares/require-role.js';
import { validate } from '../../middlewares/validate.js';
import {
  deleteAvatarHandler,
  getAvatarHandler,
  requestEmailChangeHandler,
  updateProfileHandler,
  uploadAvatarHandler,
  verifyEmailChangeHandler,
} from './profile.controller.js';
import {
  requestEmailChangeSchema,
  updateProfileSchema,
  verifyEmailChangeSchema,
} from './profile.schema.js';

const emailChangeLimiter = createLimiter(5);

export const profileRouter = Router();

// Verifikasi email memakai token dari inbox sebagai bukti, seperti reset password.
profileRouter.post(
  '/email/verify',
  validate({ body: verifyEmailChangeSchema }),
  verifyEmailChangeHandler,
);

profileRouter.use(requireRole('USER', 'ADMIN'));
profileRouter.patch('/', validate({ body: updateProfileSchema }), updateProfileHandler);
profileRouter.post(
  '/email',
  emailChangeLimiter,
  validate({ body: requestEmailChangeSchema }),
  requestEmailChangeHandler,
);
profileRouter.post('/avatar', uploadAvatarHandler);
profileRouter.get('/avatar', getAvatarHandler);
profileRouter.delete('/avatar', deleteAvatarHandler);
