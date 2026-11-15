import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import { requireAuth } from '../../middlewares/require-auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  activateAccountHandler,
  activationInfoHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  googleCallbackHandler,
  googleStartHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  resetPasswordHandler,
} from './auth.controller.js';
import {
  activateAccountSchema,
  activationTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from './auth.schema.js';

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
  });
};

const limiter = (limit: number) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

const loginLimiter = limiter(10);
const refreshLimiter = limiter(60);
const logoutLimiter = limiter(30);
const activateLimiter = limiter(10);
const googleLimiter = limiter(20);
const forgotPasswordLimiter = limiter(5);
const resetPasswordLimiter = limiter(10);
const changePasswordLimiter = limiter(5);

export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/refresh', refreshLimiter, refreshHandler);
authRouter.post('/logout', logoutLimiter, logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.get('/google', googleLimiter, googleStartHandler);
authRouter.get('/google/callback', googleLimiter, googleCallbackHandler);
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
authRouter.post(
  '/password/forgot',
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPasswordHandler,
);
authRouter.post(
  '/password/reset',
  resetPasswordLimiter,
  validate({ body: resetPasswordSchema }),
  resetPasswordHandler,
);
authRouter.post(
  '/password/change',
  requireAuth,
  changePasswordLimiter,
  validate({ body: changePasswordSchema }),
  changePasswordHandler,
);
