import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import { requireAuth } from '../../middlewares/require-auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  activateAccountHandler,
  activationInfoHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
} from './auth.controller.js';
import { activateAccountSchema, activationTokenSchema, loginSchema } from './auth.schema.js';

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
  });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const activateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.get(
  '/activation/:token',
  activateLimiter,
  validate({ params: activationTokenSchema }),
  activationInfoHandler,
);
authRouter.post(
  '/activate',
  activateLimiter,
  validate({ body: activateAccountSchema }),
  activateAccountHandler,
);
