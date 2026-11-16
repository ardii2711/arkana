import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

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

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
  });
};

const emailChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

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
